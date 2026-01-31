const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');
const { buildSystemPrompt, getContextSummary } = require('./chatbot-contexts.cjs');

// Load environment variables from .env file
dotenv.config();
console.log('API Key loaded:', process.env.OPENAI_API_KEY ? 'Yes' : 'No');

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
    const userId = req.body.userId || 'default';
    const userMessage = req.body.message;
    const context = req.body.context || {};

    console.log(`\n--- Chat Request from ${userId} ---`);
    console.log(`Message: "${userMessage}"`);

    const contextSummary = getContextSummary(context);
    if (contextSummary) {
        console.log(`Context: ${contextSummary}`);
    }

    // Update session timestamp (keeps session alive)
    sessionTimestamps[userId] = Date.now();

    // Build dynamic system prompt based on context and message content
    // Include message hint for keyword-based context loading
    const systemPromptContext = {
        ...context,
        messageHint: userMessage
    };
    const systemPrompt = buildSystemPrompt(systemPromptContext);

    // Initialize or update conversation with new system prompt
    if (!conversations[userId]) {
        conversations[userId] = [];
        tokenUsage[userId] = 0;
    }

    // Build compact context string for the message
    let contextParts = [];

    // State mapping for readability
    const stateNames = {
        0: 'loading', 1: 'mode-select', 2: 'musecraft',
        3: 'meetkai', 4: 'morethanreal', 5: 'balthamaker',
        6: 'ufsc', 7: 'contact', 99: 'contact'
    };

    if (context.state !== undefined) {
        contextParts.push(`state=${stateNames[context.state] || context.state}`);
    }
    if (context.navMode) {
        contextParts.push(`nav=${context.navMode}`);
    }
    if (context.workplaceVisible && context.workplaceState !== undefined) {
        const workplaceNames = {
            2: 'musecraft', 3: 'meetkai', 4: 'morethanreal',
            5: 'balthamaker', 6: 'ufsc'
        };
        contextParts.push(`viewing=${workplaceNames[context.workplaceState] || 'workplace'}`);

        if (context.projectIndex !== undefined) {
            contextParts.push(`project-idx=${context.projectIndex}`);
        }
    }

    // Construct the message with context if available
    let messageWithContext = userMessage;
    if (contextParts.length > 0) {
        messageWithContext = `[ctx: ${contextParts.join(' ')}] ${userMessage}`;
    }

    // Build messages array with fresh system prompt + conversation history
    const messages = [
        { role: "system", content: systemPrompt },
        ...conversations[userId],
        { role: "user", content: messageWithContext }
    ];

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o-mini",
            messages: messages,
            max_tokens: 400
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const botMessage = response.data.choices[0].message.content.trim();

        // Store only user and assistant messages (not system prompt) to keep history lean
        conversations[userId].push({ role: "user", content: messageWithContext });
        conversations[userId].push({ role: "assistant", content: botMessage });

        // Limit conversation history to last 20 messages to prevent context overflow
        if (conversations[userId].length > 20) {
            conversations[userId] = conversations[userId].slice(-20);
        }

        // Log the token usage from this interaction
        const tokensUsed = response.data.usage.total_tokens;
        tokenUsage[userId] += tokensUsed;

        console.log(`Response: "${botMessage.substring(0, 100)}${botMessage.length > 100 ? '...' : ''}"`);
        console.log(`Tokens: ${tokensUsed} (session total: ${tokenUsage[userId]})`);

        res.json({
            response: botMessage,
            tokensUsedInThisRequest: tokensUsed,
            totalTokensUsed: tokenUsage[userId]
        });
    } catch (error) {
        console.error('Error communicating with OpenAI:', error.response ? error.response.data : error.message);
        res.status(500).send('Error processing request');
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', sessions: Object.keys(conversations).length });
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`\n🚀 Chatbot server running on port ${PORT}`);
    console.log('📦 Using modular context system');
});
