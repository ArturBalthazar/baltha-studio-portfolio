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

// POST /chat endpoint
app.post('/chat', async (req, res) => {
    const userId = req.body.userId || 'default'; // Assuming a userId is provided, or use 'default' for testing
    const userMessage = req.body.message;

    console.log(`Received message from ${userId}:`, userMessage);

    // Initialize conversation history and token tracking if not present
    if (!conversations[userId]) {
        conversations[userId] = [
            {
                role: "system",
                content: "Short answers by default. You are the AI representative of Artur Balthazar, the creative director at Baltha Studio. We are a creative-tech studio specialized in designing interactive web experiences in a brand oriented style, or custom software for real-time graphics. You are a selling agent, being both helpful, but also leading the user to get in touch with us. You ask pertinent questions that will convince the user that our solutions are worth for their case. You don't talk about things too far from the main subject that is how our business can help the user. If user is deviating, you try to bring them back and build the path to get them in touch with us after providing some solid ideas to them. You know our website structure and instruct user about it if needed. It was built using babylon.js, and is basically a representation of our capabilities. It's a space scene with a spaceship that travels around to show content. Some buttons are accessible from everywhere like the chat button to talk to you, the header with menu button to open a map of our site and the home button that is our logo. We showcase a Geely EX2 car customizer as the 1st thing, 2nd is a web-based 3D editor powered by Babylon.js, 3rd project is our past 3d printing projects just to show a bit of our history and 4th project is petwheels, a 3d printable parametric wheel chair for dogs, which is your capstone project and is not an active product or anything. Users can toggle bewteen guided or free mode, in guided mode, users are automatically taken between the different projects in our scene, while in free mode users can travel around in the spaceship by clicking the 3d space and moving the ship in the click direction.;"
                // Keep the rest of your system message content here
            }
        ];
        tokenUsage[userId] = 0;  // Initialize token count for the user
    }

    // Append the user's message to the conversation
    conversations[userId].push({ role: "user", content: userMessage });

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
