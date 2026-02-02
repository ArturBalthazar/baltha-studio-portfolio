const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');
const { BASE_PROMPT, STATIC_CARDS, FUNCTION_DEFINITION, generateProjectCard } = require('./chatbot-contexts.cjs');

// Load environment variables
dotenv.config();
console.log('API Key loaded:', process.env.OPENAI_API_KEY ? 'Yes' : 'No');

const app = express();
app.use(cors());
app.use(express.json());

// Session storage
const sessions = {};  // { sessionId: { messages: [], pulledCards: Set, tokenUsage: number, lastActive: Date } }

// Session expiration (30 min)
const SESSION_EXPIRY_MS = 30 * 60 * 1000;

// Cleanup stale sessions every 5 minutes
setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const id in sessions) {
        if (now - sessions[id].lastActive > SESSION_EXPIRY_MS) {
            delete sessions[id];
            cleaned++;
        }
    }
    if (cleaned > 0) console.log(`Cleaned ${cleaned} stale session(s)`);
}, 5 * 60 * 1000);

// Get or create session
function getSession(sessionId) {
    if (!sessions[sessionId]) {
        sessions[sessionId] = {
            messages: [],
            pulledCards: new Set(),
            tokenUsage: 0,
            lastActive: Date.now()
        };
    }
    sessions[sessionId].lastActive = Date.now();
    return sessions[sessionId];
}

// Project card content - Story-focused, not just specs
const PROJECT_CARDS = {
    project_musecraft: `[CARD: PROJECT - MUSECRAFT]
WHAT IT IS:
Musecraft is my passion project - a browser-based 3D editor similar to Blender but for the web. Multiple people can collaborate in real-time, building interactive 3D scenes together. It has AI assistance for coding, a UI designer for HTML interfaces attached to 3D objects, and an addon system.

WHY I BUILT IT:
I wanted to explore what AI-powered creative tools could look like. Most 3D workflows are stuck in heavy desktop apps - I wanted something lightweight, collaborative, and web-native.

MY CONTRIBUTIONS:
Built everything from scratch: the editor UI in React, the 3D engine integration with Babylon.js, real-time sync with Supabase, the scripting system with Monaco editor, and the addon architecture inspired by Blender.`,

    project_thanksgiving: `[CARD: PROJECT - SURVIVE THANKSGIVING]
WHAT IT IS:
"Thanksgiving" is an actual 2023 horror movie directed by Eli Roth about a killer in a Pilgrim mask terrorizing a town during Thanksgiving. Sony Pictures wanted a web-based game experience to promote it - players survive waves of enemies in an interactive horror game set in scenes from the movie.

THE EXPERIENCE:
Players are dropped into the movie's world, including the iconic basement scene from the finale. Cutscenes play between levels. There's a crowd panic system where NPCs flee realistically.

MY CONTRIBUTIONS:
I built the basement environment (the movie's climactic location), created all the cutscene videos, and developed the 3D crowd system. The crowd system uses "armature aggregation" - a technique I came up with to make many animated characters perform well on the web.`,

    project_byd: `[CARD: PROJECT - BYD VIRTUAL DEALERSHIP]
WHAT IT IS:
BYD is a massive Chinese electric vehicle manufacturer (they recently became the world's largest EV seller). MeetKai built virtual showrooms where customers can explore BYD cars in 3D - for Los Angeles, Singapore, Philippines markets, plus virtual test-drive tracks.

THE EXPERIENCE:
Users walk through photorealistic virtual dealerships, click on cars to explore them inside and out, change colors, open doors, and take virtual test drives on scenic tracks.

MY CONTRIBUTIONS:
I created the BYD Seagull car completely from scratch - exterior, full interior, all materials and animations. I also led the 3D work for the Philippines dealership, which was a digital twin of a real building. This was intense detail work - matching real reference photos exactly.`,

    project_pistons: `[CARD: PROJECT - PISTONS VIRTUAL STORE]
Company: MeetKai Inc.
Client: Detroit Pistons (NBA)

Interactive merchandise experience with three distinct environments.

ARTUR'S CONTRIBUTIONS:
• Built the Virtual Store environment
• Created Basketball Court with animated crowd
• Designed the Locker Room scene
• Developed lightweight crowd system using texture atlas animation
  - Different technique from Thanksgiving, optimized for this use case`,

    project_meetkaisuite: `[CARD: PROJECT - MEETKAI SUITE]
Company: MeetKai Inc.
Type: Internal Tool (Blender Addon)

Developed out of own initiative to automate the team's 3D production pipeline. Now a standard tool used throughout MeetKai.

FEATURES:
• Material Aggregator - Combines materials for fewer draw calls
• Object Remesher - Automated mesh cleanup
• Lightmap/AO Baker - One-click baking workflow
• UV Mapper - Automated UV unwrapping
• Color Atlas Editor - Texture atlas management
• Armature Aggregator - Combines rigs for crowd optimization
• AI Assistant - Integrated help using GPT

Built with Python for Blender's API. Demonstrates proactive tool-building mindset.`,

    project_chevrolet: `[CARD: PROJECT - CHEVROLET MONTANA 2023]
Company: More Than Real
Client: Chevrolet / General Motors

3D model for AR visualization featured in Big Brother Brasil marketing campaign.

ARTUR'S CONTRIBUTIONS:
• Complete vehicle modeling and texturing
• Optimized for WebAR constraints:
  - Baked lightmaps for realistic lighting without runtime cost
  - Texture atlases to minimize draw calls
  - Rigged animations for interactive features
• Model featured on national TV during BBB campaign`,

    project_dolcegusto: `[CARD: PROJECT - NESCAFÉ DOLCE GUSTO]
Company: More Than Real
Client: Nestlé

Recreated coffee machines for AR product visualization.

ARTUR'S CONTRIBUTIONS:
• Reverse-engineered machines from photos only (no original 3D files)
• Surface modeling in Fusion 360 for accurate curves
• Materials and UVs finalized in Blender
• Created material variants for color switching in AR experience`,

    project_sika: `[CARD: PROJECT - SIKA (SIKAMAN MASCOT)]
Company: More Than Real
Client: Sika (construction materials company)

3D mascot character for WebAR product presentations.

ARTUR'S CONTRIBUTIONS:
• Created ~18k poly rigged character optimized for mobile WebAR
• Built intro animations, idle loops, and gesture animations
• Character guides users through Sika product information`,

    project_seara: `[CARD: PROJECT - SEARA FOOD DISHES]
Company: More Than Real
Client: Seara (Brazilian food company)

20+ photogrammetry-scanned food dishes for WebAR menu visualization.

ARTUR'S CONTRIBUTIONS:
• Captured ~200 photos per dish for photogrammetry
• Processed and optimized all scanned models
• Hand-painted roughness maps (photogrammetry doesn't capture these)
• Final models showcase food products in AR`,

    project_sesc: `[CARD: PROJECT - FLORIANÓPOLIS MUSEUM (SESC)]
Company: Baltha Maker
Client: SESC Santa Catarina

1:41 scale model now permanently displayed in the museum entrance.

ARTUR'S CONTRIBUTIONS:
• First NURBS modeling project using Fusion 360
• Multi-color 3D printing with precise assembly
• Vacuum fitting for part alignment
• Epoxy resin finish for durability (~20kg final weight)
• Model serves as tactile reference for museum visitors`,

    project_starwars: `[CARD: PROJECT - MILLENNIUM FALCON MOUSE]
Company: Baltha Maker
Type: Personal/Viral Project

Custom wireless mouse that went viral on Instagram (150k+ reach).

DETAILS:
• Reverse-engineered cheap mouse electronics into custom Millennium Falcon shell
• Features: screw lid for USB receiver, blue LED "hyperdrive" light, toggle button
• No soldering required - designed for hobbyist accessibility
• Project gained significant social media attention`,

    project_mesc: `[CARD: PROJECT - MESC MUSEUM (SANTA CATARINA SCHOOL)]
Company: Baltha Maker
Client: MESC

Second museum commission after SESC project success.

ARTUR'S CONTRIBUTIONS:
• Neoclassical building with curved skylight roof
• Same proven workflow: NURBS in Fusion 360
• Multi-color 3D printing with epoxy finish
• Demonstrates repeat business from quality work`,

    project_petwheels: `[CARD: PROJECT - PETWHEELS]
Company: UFSC (Academic)
Type: Undergraduate Thesis - PATENTED

Parametric wheelchair for disabled dogs, fully 3D printable.

INNOVATION:
• Adapts to any dog size/disability via parametric CAD
• Inspired by sports car aesthetics for modern look
• Flexible lateral bars (unique feature that earned patent)
• No traditional tooling needed - direct 3D printing

Featured in Brazilian media, some units sold.`,

    project_durare: `[CARD: PROJECT - DURARE]
Company: UFSC (Academic)
Type: Design Concept

Suitcase concept solving common travel problems.

DESIGN FEATURES:
• Airless tire design inspired by off-road vehicles
  - Solves wheel breakage issue
• Magnetic handles instead of complex mechanisms
  - Solves handle damage from airport handling
• Industrial design focused on durability`,

    project_zenic: `[CARD: PROJECT - ZENIC]
Company: UFSC (Academic)
Client: CoCreation Lab (UFSC coworking space)

Modular bamboo furniture transforming between work and rest modes.

DESIGN FEATURES:
• Transforms from study table to chaise longue
• NASA "maximum relaxation posture" in reclined mode
• Golden ratio proportions in lounger configuration
• Sustainable bamboo construction`
};

// Get card content
function getCardContent(cardName) {
    // Check static cards first
    if (STATIC_CARDS[cardName]) {
        return STATIC_CARDS[cardName];
    }
    // Check project cards
    if (PROJECT_CARDS[cardName]) {
        return PROJECT_CARDS[cardName];
    }
    return null;
}

// Build messages array with current context
function buildMessages(session, userMessage, context = {}) {
    const messages = [{ role: "system", content: BASE_PROMPT }];

    // Add already-pulled cards as a system message if any exist
    if (session.pulledCards.size > 0) {
        const cardContents = Array.from(session.pulledCards)
            .map(c => getCardContent(c))
            .filter(Boolean)
            .join('\n\n---\n\n');

        messages.push({
            role: "system",
            content: `Previously loaded information:\n\n${cardContents}`
        });
    }

    // Add conversation history (last 10 exchanges max)
    const historyLimit = 20; // 10 user + 10 assistant
    const history = session.messages.slice(-historyLimit);
    messages.push(...history);

    // Build context tag for user message
    let contextTag = '';
    // Map state numbers to section names (must match workplaceConfig order!)
    // ORDER: Musecraft (state_4=2) → MeetKai (state_5=3) → More Than Real (state_6=4) → Baltha Maker (state_7=5) → UFSC (state_8=6)
    const stateNames = {
        0: 'home',           // state_0 - Welcome/landing screen
        1: 'mode-select',    // state_3 - Choose guided vs free
        2: 'musecraft',      // state_4 - Musecraft Editor (Personal Project)
        3: 'meetkai',        // state_5 - MeetKai Inc.
        4: 'morethanreal',   // state_6 - More Than Real
        5: 'balthamaker',    // state_7 - Baltha Maker
        6: 'ufsc',           // state_8 - UFSC Product Design
        7: 'contact',        // state_final - Contact section
        99: 'contact'
    };

    // Use workplaceState (proximity-based) if available, otherwise fall back to state (navigation target)
    const effectiveState = context.workplaceState !== undefined ? context.workplaceState : context.state;

    if (effectiveState !== undefined || context.projectId) {
        const parts = [];
        if (effectiveState !== undefined) {
            parts.push(`state=${stateNames[effectiveState] || effectiveState}`);
        }
        if (context.projectId) {
            parts.push(`project=${context.projectId}`);
        }
        if (context.navMode) {
            parts.push(`nav=${context.navMode}`);
        }
        contextTag = `[ctx: ${parts.join(' ')}] `;
    }

    // Add current user message with context
    messages.push({ role: "user", content: contextTag + userMessage });

    return messages;
}

// Call OpenAI API
async function callOpenAI(messages, useFunctions = true) {
    const payload = {
        model: "gpt-4o-mini",
        messages: messages,
        max_tokens: 500
    };

    if (useFunctions) {
        payload.tools = [{
            type: "function",
            function: FUNCTION_DEFINITION
        }];
        payload.tool_choice = "auto";
    }

    const response = await axios.post('https://api.openai.com/v1/chat/completions', payload, {
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        }
    });

    return response.data;
}

// Main chat endpoint
app.post('/chat', async (req, res) => {
    const sessionId = req.body.userId || 'default';
    const userMessage = req.body.message;
    const context = req.body.context || {};

    console.log(`\n--- Chat [${sessionId}] ---`);
    console.log(`User: "${userMessage}"`);
    console.log(`Context: state=${context.state}, workplaceState=${context.workplaceState}, project=${context.projectId}`);

    const session = getSession(sessionId);

    try {
        // First API call - may request cards
        let messages = buildMessages(session, userMessage, context);
        let response = await callOpenAI(messages, true);
        let choice = response.choices[0];
        let tokensUsed = response.usage.total_tokens;

        // Check if AI wants to pull cards
        if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
            // Collect all requested cards from all tool calls
            let allRequestedCards = [];

            for (const toolCall of choice.message.tool_calls) {
                if (toolCall.function.name === 'get_cards') {
                    const args = JSON.parse(toolCall.function.arguments);
                    const cards = args.cards || [];
                    allRequestedCards.push(...cards);
                }
            }

            // Limit to 3 cards total
            if (allRequestedCards.length > 3) {
                allRequestedCards = allRequestedCards.slice(0, 3);
            }

            // Filter out already-pulled cards
            const newCards = allRequestedCards.filter(c => !session.pulledCards.has(c));

            console.log(`Cards requested: [${allRequestedCards.join(', ')}]`);
            if (newCards.length < allRequestedCards.length) {
                console.log(`Already had: [${allRequestedCards.filter(c => session.pulledCards.has(c)).join(', ')}]`);
            }

            // Pull new cards
            const pulledContent = [];
            for (const cardName of newCards) {
                const content = getCardContent(cardName);
                if (content) {
                    session.pulledCards.add(cardName);
                    pulledContent.push(content);
                    console.log(`Pulled: ${cardName}`);
                }
            }

            // Add assistant message with all tool calls
            const assistantToolMessage = {
                role: "assistant",
                content: null,
                tool_calls: choice.message.tool_calls
            };
            messages.push(assistantToolMessage);

            // Add a tool response for EACH tool call (required by OpenAI)
            const combinedContent = pulledContent.length > 0
                ? pulledContent.join('\n\n---\n\n')
                : "Cards already in context or not found.";

            for (const toolCall of choice.message.tool_calls) {
                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: combinedContent
                });
            }

            // Second call - AI now has the card info
            response = await callOpenAI(messages, false); // No functions this time
            choice = response.choices[0];
            tokensUsed += response.usage.total_tokens;
        }

        const botMessage = choice.message.content?.trim() || "I couldn't generate a response.";

        // Store in history
        session.messages.push({ role: "user", content: userMessage });
        session.messages.push({ role: "assistant", content: botMessage });
        session.tokenUsage += tokensUsed;

        console.log(`Response: "${botMessage.substring(0, 80)}${botMessage.length > 80 ? '...' : ''}"`);
        console.log(`Tokens: ${tokensUsed} | Cards in session: [${Array.from(session.pulledCards).join(', ')}]`);

        res.json({
            response: botMessage,
            tokensUsedInThisRequest: tokensUsed,
            totalTokensUsed: session.tokenUsage,
            cardsLoaded: Array.from(session.pulledCards)
        });

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        if (error.response?.data?.error) {
            console.error('OpenAI Error Details:', JSON.stringify(error.response.data.error, null, 2));
        }
        res.status(500).json({ error: 'Error processing request' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        sessions: Object.keys(sessions).length,
        version: '2.0-cards'
    });
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`\n🚀 Chatbot server v2.0 (Card System) running on port ${PORT}`);
    console.log(`📦 Available cards: ${Object.keys(STATIC_CARDS).length} static + ${Object.keys(PROJECT_CARDS).length} project`);
});
