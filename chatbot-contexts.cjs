/**
 * AI Assistant Card System
 * 
 * The AI has a minimal base prompt + can "pull cards" when it needs more info.
 * Cards are injected into context only when requested, staying for the session.
 * 
 * Max 3 cards per request. Already-pulled cards don't count toward limit.
 */

// =============================================================================
// BASE PROMPT - Rules only, minimal, personality-focused
// =============================================================================
const BASE_PROMPT = `You're Artur's AI assistant on his portfolio. Be friendly and natural.

STYLE:
- Conversational, 1-3 sentences.
- Use "I" for Artur.
- Don't make up info - use context or pull cards.

PORTFOLIO STRUCTURE (IMPORTANT!):
The portfolio has SECTIONS (companies/workplaces) containing PROJECTS:
- musecraft: Personal project section (Musecraft Editor)
- meetkai: MeetKai Inc. - contains: thanksgiving, byd, pistons, meetkaisuite
- morethanreal: More Than Real - contains: chevrolet, dolcegusto, sika, seara
- balthamaker: Baltha Maker - Artur's own 3D printing business - contains: sesc, starwars, mesc
- ufsc: UFSC Product Design - contains: petwheels, durare, zenic

SECTIONS are companies, PROJECTS are individual portfolio items within them!

CONTEXT [ctx: state=X project=Y]:
The context tells you EXACTLY where the user is!
- state=home: Welcome screen
- state=meetkai/morethanreal/balthamaker/ufsc/musecraft: Which SECTION they're in
- project=X: Which PROJECT they're viewing

BEFORE NAVIGATING: CHECK THE CONTEXT! If project=chevrolet, they're ALREADY at Chevrolet - don't navigate there again!

NAVIGATION ACTIONS (CRITICAL):
When navigating, add action tags at the end:
"Sure, let's check out BYD!" [ACTIONS][{"type":"auto_goto","target":"byd"}][/ACTIONS]
"Here are options:" [ACTIONS][{"label":"Petwheels","type":"goto","target":"petwheels"},{"label":"BYD","type":"goto","target":"byd"}][/ACTIONS]
"Contact me:" [ACTIONS][{"label":"WhatsApp","type":"whatsapp"},{"label":"Email","type":"email"}][/ACTIONS]

Valid targets: musecraft, meetkai, morethanreal, balthamaker, ufsc, contact, thanksgiving, byd, pistons, meetkaisuite, chevrolet, dolcegusto, sika, seara, sesc, starwars, mesc, petwheels, durare, zenic

CARDS (PULL BEFORE ANSWERING!):
When asked about a project, PULL the card first! Don't guess!
- project_[id]: Pull when asked about a specific project
- extras: Fun facts about Artur
- personal, education, experience, skills: Background info

QUICK FACTS:
- Artur: 3D designer & web/tools developer, Brazil
- MeetKai Inc: Current job
- MeetKai Suite: Artur's Blender addon
- Baltha Maker: Artur's own 3D printing studio (NOT a project he "worked on" - it's HIS business!)
- Fun highlights: Thanksgiving horror game, BYD virtual dealerships, patented dog wheelchair`;

// =============================================================================
// INFORMATION CARDS
// =============================================================================

const CARD_PERSONAL = `[CARD: PERSONAL]
Full name: Artur Balthazar
Location: Florianópolis, Brazil
Nationality: Brazilian and Italian (can easily relocate to Europe)
Languages: Portuguese (native), English (fluent)
Contact: arturbalthazar@gmail.com | WhatsApp: +55 48 9128-7795 (provide button when asked)
LinkedIn: linkedin.com/in/artur-balthazar/ (provide button with link when asked)
Current role: 3D Designer & Tools Developer at MeetKai Inc. (2023-present, remote)`;

const CARD_EDUCATION = `[CARD: EDUCATION]
• Product Design degree - UFSC, Brazil (2018-2021)
  Full undergraduate degree in industrial/product design.

• Mechanical Engineering (incomplete) - UFSC, Brazil (2012-2017)
  Though unfinished, developed strong skills in logic, analytical thinking, and math.
  Passed all calculus, algebra, statistics, and computer science courses with good grades.
  Left to pursue creativity in Product Design.

• Exchange Program - Purdue University Northwest, USA (2015-2016)
  Lived in Chicago area during mechanical engineering exchange.
  Summer research project at NJIT, New Jersey.
  Bought first 3D printer during this time → started Baltha Maker upon return.

• Technical Course in Design - SATC, Brazil (2009-2010)
  Overview of graphic design, web design, packaging design, interior design, and architecture.
  Completed parallel to high school.`;

const CARD_EXPERIENCE = `[CARD: EXPERIENCE]
• MeetKai Inc. - 3D Designer & Tools Developer (Jan 2023 - Present)
  Remote position for LA-based company specializing in interactive 3D web experiences.
  Created 3D environments, vehicle models, character rigs, crowd systems.
  Developed MeetKai Suite Blender addon to automate team's 3D pipeline.
  Notable projects: Sony Thanksgiving game, BYD Virtual Dealership, Pistons Virtual Store.

• More Than Real - 3D Designer for AR (Jan 2022 - Jan 2023)
  Remote, São Paulo-based company.
  Created 3D assets for WebAR marketing experiences for major brands.
  Skills: 3D modeling, texturing, mesh optimization, light/AO baking, AR pipelines.
  Notable projects: Chevrolet Montana, Nescafé Dolce Gusto, Sika, Seara.

• Baltha Maker - 3D Printing Engineer & Founder (2018-2021)
  Own 3D printing studio in Florianópolis.
  3D modeling in CAD, surface, and sculpting software depending on client needs.
  3D printing and finishing in plastic and resin: scale models, prototypes, trophies, replacement parts.
  Business management: accounting, marketing, customer service, inventory.
  Notable projects: SESC Museum scale model, Millennium Falcon mouse.

• Edge Planning Center - 3D Printing Engineer & Co-founder (2021)
  Parallel business with two dentists providing 3D printable surgical guides.
  Left after a year to pursue international career in 3D design/development.

• Earlier roles: Pronto 3D (design intern, 2019), Cata Company (R&D intern, 2017), 
  Palisades Tahoe (ski lift operator, 2013-14), Eder Frank Architecture (intern, 2012).`;

const CARD_SKILLS = `[CARD: SKILLS]
3D & Technical:
• Excellent 3D modeler proficient with any pipeline (modeling, texturing, animating, rigging, baking)
• 3D optimization specialist - treats it like a "minigame" to hit performance targets while maintaining quality
• Blender expert, including Blender API/Python for tools development
• Babylon.js for web-based 3D applications
• Fusion 360 for parametric CAD and NURBS modeling
• Substance 3D for texturing
• Photogrammetry and 3D scanning workflows

Development:
• React, TypeScript for frontend development
• Python for Blender addons and automation
• Started production-level coding post-AI revolution, but confident in creating complex products end-to-end
• Deep understanding of software architecture from building Musecraft
• Tests thoroughly, reviews generated code, understands what's happening

Design & UX:
• Strong UX skills with holistic product development view
• Mindful of user experience at each step
• Product design degree provides design thinking foundation

Soft Skills:
• Self-starter who builds tools proactively (MeetKai Suite was own initiative)
• Enjoys challenges, sees "impossible" as just an idea
• International experience (USA, Europe visits)`;

const CARD_EXTRAS = `[CARD: EXTRAS]
Fun Facts:
• Created first 3D model at age 14: a Nokia Navigator 6110 in Google SketchUp, uploaded to Google Warehouse
• Has visited Prusa in Czech Republic (the 3D printer manufacturer)
• Worked as a ski lift operator at Palisades Tahoe (2013-14)

Philosophy:
• Likes challenges and considers the impossible just an idea waiting to be solved
• Treats 3D optimization like a minigame - finding the balance between quality and performance

Favorite Projects:
1. Musecraft - Personal web-based 3D editor, passion project
2. SESC Museum - First major 3D printing commission, now displayed in museum
3. Petwheels - Patented parametric dog wheelchair (undergraduate thesis)
4. BYD Seagull - Built entire car from scratch including interior
5. Chevrolet Montana - Featured in Big Brother Brasil marketing campaign

Not in Portfolio:
• Baltha Maker has many smaller projects not showcased
• MeetKai has confidential projects and smaller contributions not included`;

// =============================================================================
// PROJECT CARDS - Will be populated dynamically from workplaceConfig
// =============================================================================

// Project card generator - extracts text from workplaceConfig content blocks
function generateProjectCard(projectId, projectConfig, workplaceConfig) {
    if (!projectConfig) return null;

    let content = `[CARD: PROJECT - ${projectConfig.title.toUpperCase()}]\n`;
    content += `Company: ${workplaceConfig.companyName}\n`;
    content += `Period: ${workplaceConfig.period}\n`;
    content += `Role: ${workplaceConfig.role}\n\n`;

    // Extract text from content blocks
    if (projectConfig.contentBlocks) {
        for (const block of projectConfig.contentBlocks) {
            if (block.type === 'text') {
                if (block.title) content += `${block.title}:\n`;
                if (block.paragraphs) {
                    content += block.paragraphs.join('\n') + '\n\n';
                }
            } else if (block.type === 'feature-card') {
                content += `${block.title}: ${block.paragraphs.join(' ')}\n\n`;
            } else if (block.type === 'float-image') {
                content += block.paragraphs.join('\n') + '\n\n';
            }
        }
    }

    return content.trim();
}

// =============================================================================
// CARD LIBRARY
// =============================================================================

const STATIC_CARDS = {
    personal: CARD_PERSONAL,
    education: CARD_EDUCATION,
    experience: CARD_EXPERIENCE,
    skills: CARD_SKILLS,
    extras: CARD_EXTRAS
};

// Function calling definition for OpenAI
const FUNCTION_DEFINITION = {
    name: "get_cards",
    description: "Request information cards to answer the user's question. Only call when you need specific info you don't have. Max 3 cards.",
    parameters: {
        type: "object",
        properties: {
            cards: {
                type: "array",
                items: {
                    type: "string",
                    enum: [
                        "personal", "education", "experience", "skills", "extras",
                        "project_musecraft", "project_thanksgiving", "project_byd",
                        "project_pistons", "project_meetkaisuite", "project_chevrolet",
                        "project_dolcegusto", "project_sika", "project_seara",
                        "project_sesc", "project_starwars", "project_mesc",
                        "project_petwheels", "project_durare", "project_zenic"
                    ]
                },
                description: "Array of card names to retrieve. Usually 1, max 3."
            }
        },
        required: ["cards"]
    }
};

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
    BASE_PROMPT,
    STATIC_CARDS,
    FUNCTION_DEFINITION,
    generateProjectCard
};
