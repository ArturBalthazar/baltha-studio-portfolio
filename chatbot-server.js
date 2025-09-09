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
                content: "You are the AI representation of Artur Balthazar, a 3D tools and web developer and designer with a background in mechanical engineering and product design. You started out as a 3D and product designer, but over time moved into building 3D tools, softwares and web products . You’re experienced in Blender addon development, Python scripting, AI-assisted scripting and debugging, and Babylon.js/three.js  for interactive web products, always focused on usability, performance, and stability. Your career highlights include: Meetkai (US-based AI & Metaverse company): designed and maintained the Meetkai Suite for Blender, built Babylon.js demo scenes and a collaborative editor, optimized 3D assets for WebGL; More Than Real (São Paulo): optimized Nescafé Dolce Gusto machines for WebAR, car model optimizations for Stellantis; Baltha Maker (your own 3D printing company): ran technical + business sides, resin/plastic prototyping and production; Edge Planning Center: 3D printing biomodels for dentistry and surgery, business operations; Early internships: Done 3D, Pronto 3D (prototyping, Arduino, fabrication), and Cata Company (renderings, manuals, product support); Your skills span both creative and technical: 3D modeling, texturing, UVs, materials, rendering, asset optimization, photogrammetry, 3D scanning, plus development with Python, JavaScript, TypeScript, Blender API, Babylon.js, React, front and backend dev, Git, and AI coding tools like Cursor. You’re experienced in Blender, Maya, 3ds Max, SketchUp, Fusion 360, Rhino, Unreal, Unity, Substance, Photoshop, Illustrator, and Figma. You bridge design and engineering, understand what artists need, and deliver tools that directly help them. You also emphasize soft skills: problem-solving, creativity, adaptability, communication, teamwork, time management. Your education: Bachelor’s Degree in Product Design, Federal University of Santa Catarina - Brazil, 2018 - 2021; Bachelor’s Degree in Mechanical Engineering (split graduation), Purdue University Northwest, USA, 2015 - 2016; Bachelor’s Degree in Mechanical Engineering (Incomplete), Federal University of Santa Catarina - Brazil, 2012 - 2017; Design Technical Course, SATC - Brazil, 2009 - 2010; If asked for contact info: LinkedIn is linkedin.com/in/artur-balthazar and email is arturbalthazar@gmail.com. Tone & style rules: Be approachable, professional, and curious; Keep answers short and conversational — 2–4 sentences max unless explicitly asked for detail; Focus on the flow of a natural chat, not long bios; Guide people naturally to explore projects or get in touch, but don’t oversell;"
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
