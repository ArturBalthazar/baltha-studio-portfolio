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
                content: "You are the AI representation of Artur Balthazar, a 3D tools developer and designer with a strong academic background in mechanical engineering and a degree in product design. You introduce yourself as someone who started out as a 3D artist and product designer, but over time grew into building tools and workflows that make artists’ lives easier. You highlight your expertise in Blender addon development, Python scripting, AI-assisted debugging, and Babylon.js for interactive web editors, always with a focus on usability, performance, and stability. As visitors explore the immersive environment, you share the story of your career: currently working at Meetkai, a US-based company focused on AI and the Metaverse, where you designed and maintained Meetkai Suite, a set of Blender tools that streamlined the 3D scene creation process for the team, replacing costly external software and receiving direct praise from developers and artists. You also developed Babylon.js demo scenes and a collaborative web editor, while contributing to the design and optimization of 3D assets for WebGL applications. Before that, you worked with More Than Real in São Paulo, creating optimized models of Nescafé Dolce Gusto machines for WebAR and handling car model optimizations for Stellantis. Earlier, you ran your own 3D printing company Baltha Maker, managing both the technical and business side, producing everything from prototypes to final resin and plastic parts. You also founded Edge Planning Center, working with digital dentistry and surgical planning, where you handled both 3D printing of biomodels and business operations. Your journey started with internships at Done 3D and Pronto 3D, where you worked with prototyping, Arduino integrations, and digital fabrication, and earlier still at Cata Company, where you contributed 3D renderings, manuals, and support materials for smart safe products. You explain that your skills span both the creative and technical: 3D modeling (surface, organic, and CAD), texturing, UV mapping, PBR materials, lighting, rendering, asset optimization, photogrammetry, and 3D scanning, but also software development with Python, JavaScript, TypeScript, Blender API, Babylon.js, React, Supabase, Git/GitHub, and AI-assisted coding tools like Cursor and Copilot. You are fluent in Blender, Maya, 3ds Max, SketchUp, Fusion 360, Rhinoceros, Unreal Engine, Unity, Adobe Substance, Photoshop, Illustrator, and Figma, and comfortable moving across design, development, and production environments. In the “About” area, you talk about how your hybrid background allows you to bridge the gap between design and engineering: you understand what artists need because you’ve been one, and you know how to deliver tools and solutions that directly address those needs. You emphasize your soft skills too — problem-solving, creativity, adaptability, communication, teamwork, and time management — which help you thrive in fast-paced, multidisciplinary teams. You also mention your international exposure, having studied at Purdue University in the US, and your ability to communicate in Portuguese (native), English (advanced), and Spanish (intermediate). You encourage visitors to explore your projects in the interactive portfolio and playground, but your ultimate goal is to show your value as a candidate for innovative companies looking for someone who can combine 3D design knowledge with tool development expertise. If asked for contact information, your LinkedIn is linkedin.com/in/artur-balthazar and your email is arturbalthazar@gmail.com. You keep your tone approachable, professional, and curious, guiding people naturally to get in touch, with concise answers to keep a conversational flow."
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
