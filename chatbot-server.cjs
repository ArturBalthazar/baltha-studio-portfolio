const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables from .env file
dotenv.config();
console.log('API Key:', process.env.OPENAI_API_KEY);

const app = express();

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

// Store conversations and token usage in memory
const conversations = {};
const tokenUsage = {};  // Store token usage per user
const sessionTimestamps = {};  // Track when each session was last active

// Session expiration time (30 minutes in milliseconds)
const SESSION_EXPIRY_MS = 30 * 60 * 1000;

// Clean up stale sessions every 5 minutes
setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;
    for (const sessionId in sessionTimestamps) {
        if (now - sessionTimestamps[sessionId] > SESSION_EXPIRY_MS) {
            delete conversations[sessionId];
            delete tokenUsage[sessionId];
            delete sessionTimestamps[sessionId];
            cleanedCount++;
        }
    }
    if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} stale session(s)`);
    }
}, 5 * 60 * 1000);

// POST /chat endpoint
app.post('/chat', async (req, res) => {
    const userId = req.body.userId || 'default'; // Assuming a userId is provided, or use 'default' for testing
    const userMessage = req.body.message;
    const context = req.body.context || {}; // Context from client about current UI state

    console.log(`Received message from ${userId}:`, userMessage);
    if (Object.keys(context).length > 0) {
        console.log(`Context:`, context);
    }

    // Update session timestamp (keeps session alive)
    sessionTimestamps[userId] = Date.now();

    // Initialize conversation history and token tracking if not present
    if (!conversations[userId]) {
        conversations[userId] = [
            {
                role: "system",
                content: `Short answers. You are the AI representative of Artur Balthazar, creative director at Baltha Studio, a creative tech studio specialized in brand-oriented interactive web experiences and custom real-time graphics software; you act as a helpful but sales-driven assistant who asks relevant, strategic questions, keeps the conversation focused on how Baltha Studio can help the user, and naturally guides them toward getting in touch; you understand our website and can explain or guide users through it when useful, knowing it is built with Babylon.js and designed as a live showcase of our capabilities: a navigable space scene with a spaceship, global UI elements accessible at all times (chat button, header menu with site map, and home logo), and four showcased projects — a Geely EX2 interactive car configurator, a web-based 3D editor powered by Babylon.js, past 3D printing projects that reflect our technical background, and PetWheels, a parametric 3D-printable wheelchair for dogs developed as a capstone project and not an active product — with users able to switch between guided mode (automatic navigation through projects) and free mode (manual spaceship movement by clicking in 3D space), using this experience to build credibility, spark interest, and lead users toward contacting Baltha Studio. CONTEXT: Messages may have [ctx:...] with state/location. Key: state=current area, nav=mode, panel=visible panel, color=car color(green/gray/white/silver), version=car trim(pro/max), view=interior. Use context naturally, don't mention format. ACTIONS: When contact is relevant, append action buttons: [ACTIONS][{"label":"WhatsApp","type":"whatsapp"},{"label":"Email","type":"email"}][/ACTIONS]. Types: whatsapp,email,linkedin,instagram,home. Only add when user asks about contact/getting in touch. Keep labels short. Max 2-3 buttons per response.`
            }
        ];
        tokenUsage[userId] = 0;  // Initialize token count for the user
    }

    // Build compact context string from context object
    // Format: [ctx: state=X navMode=Y panel=Z ...]
    let contextParts = [];

    // State mapping: 0=loading, 1=intro, 2=hero, 3=overlay, 4-7=content areas, 99=contact
    const stateNames = {
        0: 'loading', 1: 'intro', 2: 'hero', 3: 'overlay',
        4: 'geely-area', 5: 'musecraft-area', 6: 'dioramas-area', 7: 'petwheels-area',
        99: 'contact'
    };
    if (context.state !== undefined) {
        contextParts.push(`state=${stateNames[context.state] || context.state}`);
    }
    if (context.navMode) {
        contextParts.push(`nav=${context.navMode}`);
    }
    if (context.geelyVisible) {
        contextParts.push('panel=geely-customizer');
        if (context.geelyColor) contextParts.push(`color=${context.geelyColor}`);
        if (context.geelyVersion) contextParts.push(`version=${context.geelyVersion}`);
        if (context.geelyInterior) contextParts.push('view=interior');
    }
    if (context.dioramaVisible) {
        contextParts.push(`panel=dioramas`);
        if (context.dioramaModel) contextParts.push(`model=${context.dioramaModel}`);
    }
    if (context.petwheelsVisible) {
        contextParts.push('panel=petwheels');
    }
    if (context.musecraftVisible) {
        contextParts.push('panel=musecraft');
    }

    // Construct the message with context if available
    let messageWithContext = userMessage;
    if (contextParts.length > 0) {
        messageWithContext = `[ctx: ${contextParts.join(' ')}] ${userMessage}`;
    }

    // Append the user's message to the conversation
    conversations[userId].push({ role: "user", content: messageWithContext });

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o-mini",
            messages: conversations[userId], // Send the entire conversation history
            max_tokens: 400
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const botMessage = response.data.choices[0].message.content.trim();

        // Append the bot's response to the conversation history
        conversations[userId].push({ role: "assistant", content: botMessage });

        // Log the token usage from this interaction
        const tokensUsed = response.data.usage.total_tokens;
        tokenUsage[userId] += tokensUsed; // Add to the user's total token count

        console.log(`Response from OpenAI for ${userId}:`, botMessage);
        console.log(`Tokens used in this request: ${tokensUsed}`);
        console.log(`Total tokens used in conversation with ${userId}: ${tokenUsage[userId]}`);

        res.json({
            response: botMessage,
            tokensUsedInThisRequest: tokensUsed,
            totalTokensUsed: tokenUsage[userId]  // Return the total token usage
        });
    } catch (error) {
        console.error('Error communicating with OpenAI:', error.response ? error.response.data : error.message);
        res.status(500).send('Error processing request');
    }
});

app.listen(8081, () => {
    console.log('Server running on port 8081');
});
