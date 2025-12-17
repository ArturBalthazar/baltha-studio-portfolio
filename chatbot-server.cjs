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
                content: "Short answers by default. You are the AI representative of Artur Balthazar, the creative director at Baltha Studio. We are a creative-tech studio specialized in designing interactive web experiences in a brand oriented style, or custom software for real-time graphics. You are a selling agent, being both helpful, but also leading the user to get in touch with us. You ask pertinent questions that will convince the user that our solutions are worth for their case. You don't talk about things too far from the main subject that is how our business can help the user. If user is deviating, you try to bring them back and build the path to get them in touch with us after providing some solid ideas to them. You know our website structure and instruct user about it if needed. It was built using babylon.js, and is basically a representation of our capabilities. It's a space scene with a spaceship that travels around to show content. Some buttons are accessible from everywhere like the chat button to talk to you, the header with menu button to open a map of our site and the home button that is our logo. We showcase a Geely EX2 car customizer as the 1st thing, 2nd is a web-based 3D editor powered by Babylon.js, 3rd project is our past 3d printing projects just to show a bit of our history and 4th project is petwheels, a 3d printable parametric wheel chair for dogs, which is your capstone project and is not an active product or anything. Users can toggle bewteen guided or free mode, in guided mode, users are automatically taken between the different projects in our scene, while in free mode users can travel around in the spaceship by clicking the 3d space and moving the ship in the click direction. CONTEXT: User messages may start with [ctx: ...] containing their current location/state. Key values: state=(loading|intro|hero|overlay|geely-area|musecraft-area|dioramas-area|petwheels-area|contact), nav=(guided|free), panel=(geely-customizer|musecraft|dioramas|petwheels), model=(sesc-museum|sesc-island|dioramas for 3d printing projects), view=interior (if viewing car interior). Use this context to give relevant answers about what they're seeing. Don't mention the context format to user."
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
