/**
 * Workplace Configuration for Portfolio States
 * 
 * Each workplace (company/organization) has:
 * - Company info (name, logo, period, location, workStyle)
 * - Projects array with their own models and info
 * 
 * Model path convention: /assets/models/[company]/[project]/[project].gltf
 * Logo path convention: /assets/logos/[company].png
 * Project logo: /assets/logos/[project].png
 * 
 * ORDER: Musecraft → MeetKai → More Than Real → Baltha Maker → UFSC
 */

// Content block types for flexible project content layout
export type ContentBlockType = 'hero-image' | 'text' | 'image' | 'image-grid' | 'image-compare' | 'video' | 'feature-card' | 'float-image' | 'tech-stack';

export interface HeroImageBlock {
    type: 'hero-image';
    src: string;
    alt?: string;
}

export interface TextBlock {
    type: 'text';
    title?: string;
    paragraphs: string[];
    showSeparator?: boolean;  // Show a separator line above this text block
}

export interface ImageBlock {
    type: 'image';
    src: string;
    alt?: string;
    caption?: string;
}

export interface ImageGridBlock {
    type: 'image-grid';
    images: { src: string; alt?: string }[];
    columns?: 1 | 2;  // Default is 1 (stacked)
}

export interface VideoBlock {
    type: 'video';
    src: string;  // Can be YouTube embed URL or local video path
    isYoutube?: boolean;
}

export interface ImageCompareBlock {
    type: 'image-compare';
    beforeSrc: string;
    afterSrc: string;
    beforeLabel?: string;
    afterLabel?: string;
    caption?: string;
}

export interface FeatureCardBlock {
    type: 'feature-card';
    imageSrc: string;
    imageAlt?: string;
    title: string;
    paragraphs: string[];
    imagePosition?: 'left' | 'right';  // Default is 'left'
    showSeparator?: boolean;  // Show a separator line above this card
}

// Float image block - image floats to one side with text wrapping around it (like Word)
export interface FloatImageBlock {
    type: 'float-image';
    imageSrc: string;
    imageAlt?: string;
    imagePosition?: 'left' | 'right';  // Default is 'left'
    width?: '2/5' | '1/2' | 'full';  // Image width: '2/5' (40%), '1/2' (50%), 'full' (100% below text). Default is '2/5'
    title?: string;  // Optional section title
    paragraphs: string[];  // Text that wraps around the image
    showSeparator?: boolean;  // Show a separator line above this block
}

// Tech stack block - displays a grid of software/tools icons with labels
export interface TechStackItem {
    id: string;          // Unique identifier for the item (used for icon path: /assets/images/stack-icons/{id}.svg or .png)
    label: string;       // Display label below the icon
}

export interface TechStackBlock {
    type: 'tech-stack';
    title?: string;      // Section title, e.g. "Tools & Technologies"
    items: TechStackItem[];
    showSeparator?: boolean;  // Show a separator line above this block
}

export type ContentBlock = HeroImageBlock | TextBlock | ImageBlock | ImageGridBlock | ImageCompareBlock | VideoBlock | FeatureCardBlock | FloatImageBlock | TechStackBlock;

// Title button for external links, actions, etc. displayed next to project/company titles
export interface TitleButton {
    icon: string;          // Icon filename (e.g., 'link.png', 'discord.png', 'youtube.png') - stored in /assets/images/
    url?: string;          // External URL to open in new tab
    action?: string;       // Internal action identifier (e.g., 'open-chat', 'navigate-to', etc.)
    tooltip?: string;      // Optional tooltip text on hover
}

export interface ProjectConfig {
    id: string;
    title: string;
    description: string;
    showLogo: boolean;
    modelPath: string;  // Full path to .gltf
    logoPath?: string;  // Optional project logo
    // Rich content blocks for project showcase
    contentBlocks?: ContentBlock[];
    // Optional action buttons next to the project title
    titleButtons?: TitleButton[];
}

export interface WorkplaceConfig {
    id: string;
    companyName: string;
    showCompanyLogo: boolean;
    companyLogoPath?: string;
    period: string;
    location: string;
    workStyle: string;  // "Remote", "On-site", "Hybrid", etc.
    role: string;  // User's role at this company (for mobile display)
    description: string;
    projects: ProjectConfig[];
    // Optional action buttons next to the company title
    titleButtons?: TitleButton[];
}

// Helper function to check if a workplace has only one project (single-project mode)
// In single-project mode, the project's name/logo is used as the header instead of company info
export function isSingleProjectSection(config: WorkplaceConfig): boolean {
    return config.projects.length === 1;
}

import { S } from '../state';

// Configuration for each portfolio state
// ORDER: Musecraft (4) → MeetKai (5) → More Than Real (6) → Baltha Maker (7) → UFSC (8)
export const workplaceConfigs: Record<number, WorkplaceConfig> = {
    // S.state_4 - Musecraft Editor (Personal Project) - FIRST
    // Single-project section: header uses project name/logo directly
    [S.state_4]: {
        id: "personal",
        companyName: "Musecraft Editor",
        showCompanyLogo: true,
        companyLogoPath: "/assets/logos/musecraft.png",
        period: "Independent Project",
        location: "At home",
        workStyle: "Personal Project",
        role: "Creator & Lead Developer",
        description: "A web-based 3D scene editor for creating interactive experiences.",
        projects: [
            {
                id: "musecraft",
                title: "Musecraft Editor",
                description: "Web-based Babylon.js Editor",
                showLogo: true,
                titleButtons: [
                    { icon: 'link.png', url: 'https://musecraft.xyz', tooltip: 'Visit Website' },
                    { icon: 'youtube.png', url: 'https://www.youtube.com/@Musecraft-Editor', tooltip: 'YouTube Channel' },
                    { icon: 'discord.png', url: 'https://discord.gg/eFxZfEWB', tooltip: 'Join Discord' }
                ],
                modelPath: "/assets/models/personal/musecraft/musecraft.gltf",
                logoPath: "/assets/logos/musecraft.png",
                contentBlocks: [
                    // Project overview (includes Blender inspiration + tech stack)
                    {
                        type: 'text',
                        paragraphs: [
                            'Musecraft is a web-based 3D editor powered by Babylon.js that allows real-time collaborative work and creation of interactive 3D scenes for the web.',
                        ]
                    },
                    // Hero image
                    {
                        type: 'hero-image',
                        src: '/assets/models/personal/musecraft/content/cover.png',
                        alt: 'Musecraft Editor Interface'
                    },
                    // Project overview (includes Blender inspiration + tech stack)
                    {
                        type: 'text',
                        paragraphs: [
                            'It started as a personal project to explore AI-powered creative tools and has since evolved into a fully functional platform, built with React and TypeScript on the frontend, Babylon.js for real-time rendering, and Supabase for authentication, real-time sync, and secure cloud storage.'
                        ]
                    },
                    // Demo video
                    {
                        type: 'video',
                        src: 'https://www.youtube.com/embed/6g6zZgZ-FrE',
                        isYoutube: true
                    },
                    // Project & Asset Management
                    {
                        type: 'float-image',
                        imageSrc: '/assets/models/personal/musecraft/content/image1.png',
                        imageAlt: 'Cloud and Local Storage',
                        imagePosition: 'left',
                        width: '1/2',
                        title: 'Cloud and Local Storage',
                        paragraphs: [
                            'Projects can live in the cloud via Supabase or entirely offline using the browser\'s File System Access. Work on local folders like a desktop app, or sync assets to cloud storage for team access.'
                        ],
                        showSeparator: true
                    },
                    // 3D Editor Capabilities
                    {
                        type: 'float-image',
                        imageSrc: '/assets/models/personal/musecraft/content/image3.png',
                        imageAlt: '3D Editing Environment',
                        width: 'full',
                        title: '3D Editing Environment',
                        paragraphs: [
                            'Full scene authoring with meshes, PBR materials, lights, cameras, physics, animations, and spatial audio. Includes a play mode to test scenes with physics and scripted behaviors without leaving the editor. The interface is intentionally designed to feel familiar to Blender users, reducing friction for 3D artists transitioning to the platform.'
                        ],
                        showSeparator: true
                    },
                    // UI Editor
                    {
                        type: 'float-image',
                        imageSrc: '/assets/models/personal/musecraft/content/image4.png',
                        imageAlt: 'Integrated UI Editor',
                        width: 'full',
                        title: 'Integrated UI Editor',
                        paragraphs: [
                            'Design HTML/CSS interfaces directly in the 3D environment and anchor them to scene objects. Includes a style editor, animation support, and responsive breakpoints for building interactive 3D web experiences.'
                        ],
                        showSeparator: true
                    },
                    // AI-Powered Scripting
                    {
                        type: 'float-image',
                        imageSrc: '/assets/models/personal/musecraft/content/image5.png',
                        imageAlt: 'AI-Powered Scripting',
                        imagePosition: 'left',
                        width: '1/2',
                        title: 'AI-Powered Scripting',
                        paragraphs: [
                            'Monaco-powered code editor with integrated AI assistance. Describe what you want in natural language and the AI generates executable scripts with full context of your scene and the Musecraft API.'
                        ],
                        showSeparator: true
                    },
                    // Team collaboration
                    {
                        type: 'float-image',
                        imageSrc: '/assets/models/personal/musecraft/content/image2.png',
                        imageAlt: 'Real-Time Collaboration',
                        width: 'full',
                        title: 'Real-Time Collaboration',
                        paragraphs: [
                            'Create teams with role-based permissions and collaborate in real-time. Multiple users can edit the same scene simultaneously, with selections, transforms, and changes syncing instantly with presence indicators.'
                        ],
                        showSeparator: true
                    },
                    // Addon System
                    {
                        type: 'float-image',
                        imageSrc: '/assets/models/personal/musecraft/content/image6.png',
                        imageAlt: 'Addon Architecture',
                        imagePosition: 'right',
                        width: '1/2',
                        title: 'Addon Architecture',
                        paragraphs: [
                            'Extensible API inspired by Blender\'s addon system. Addons can register menus, inject panels, subscribe to events, and access scene, physics, animation, audio, and history systems with sandboxed permissions.'
                        ],
                        showSeparator: true
                    },
                    // Export and Deployment
                    {
                        type: 'float-image',
                        imageSrc: '/assets/models/personal/musecraft/content/image7.png',
                        imageAlt: 'Export to GitHub',
                        imagePosition: 'left',
                        width: '1/2',
                        title: 'Export to GitHub',
                        paragraphs: [
                            'Export projects directly to GitHub as ready-to-deploy web applications. Includes snapshot-based versioning for saving and reverting scene states, creating a complete pipeline from creation to publication.'
                        ],
                        showSeparator: true
                    },
                    // Softwares, tools and languages
                    {
                        type: 'tech-stack',
                        title: 'Skills with:',
                        showSeparator: true,
                        items: [
                            { id: 'react', label: 'React' },
                            { id: 'typescript', label: 'TypeScript' },
                            { id: 'babylonjs', label: 'Babylon.js' },
                            { id: 'supabase', label: 'Supabase' },
                            { id: 'git', label: 'Git/GitHub' },
                            { id: 'cursor', label: 'Cursor' },
                            { id: 'blender', label: 'Blender' },
                            { id: 'figma', label: 'Figma' },
                            { id: 'photoshop', label: 'Photoshop' }
                        ]
                    }
                ]
            }
        ]
    },

    // S.state_5 - MeetKai (moved from last to second)
    [S.state_5]: {
        id: "meetkai",
        companyName: "Meetkai Inc.",
        showCompanyLogo: true,
        companyLogoPath: "/assets/logos/meetkai.png",
        period: "Jan, 2023 - Present",
        location: "Los Angeles, USA",
        workStyle: "Remote",
        role: "3D Designer and Tools Developer",
        description: "As a 3D Technical Artist at Meetkai, I developed interactive 3D experiences and virtual environments for various clients.",
        titleButtons: [
            { icon: 'link.png', url: 'https://meetkai.com/', tooltip: 'Visit MeetKai' }
        ],
        projects: [
            {
                id: "thanksgiving",
                title: "Survive Thanksgiving",
                description: "Gamified movie experience",
                showLogo: true,
                titleButtons: [
                    { icon: 'link.png', url: 'https://thanksgiving.mkms.io/?map_id=169350804&shard_id=96', tooltip: 'Play Game' }
                ],
                modelPath: "/assets/models/meetkai/thanksgiving/thanksgiving.gltf",
                logoPath: "/assets/logos/sony.png",
                contentBlocks: [
                    // Cover image
                    {
                        type: 'hero-image',
                        src: '/assets/models/meetkai/thanksgiving/content/cover.png',
                        alt: 'Thanksgiving Game Cover'
                    },
                    // Project overview
                    {
                        type: 'text',
                        paragraphs: [
                            'Thanksgiving is a Sony horror film featuring a masked killer on the loose during the holiday. Sony and MeetKai partnered to create an interactive web experience to help market the movie worldwide.',
                            'I worked on key 3D elements: the Basement scene (the movie\'s climatic finale), all in-game cutscene videos, and an optimized 3D crowd system for the external areas.'
                        ]
                    },
                    // Video trailer
                    {
                        type: 'video',
                        src: 'https://www.youtube.com/embed/V8zJ_4dDaD8',
                        isYoutube: true
                    },
                    // THE BASEMENT section
                    {
                        type: 'text',
                        title: 'The Basement',
                        paragraphs: [
                            'The basement is where the movie\'s final scene takes place, a long dinner table set for a twisted Thanksgiving feast. I designed and built this entire environment, from the eerie table settings to the dim lighting that sets the horror mood.'
                        ]
                    },
                    // Basement images
                    {
                        type: 'image-grid',
                        images: [
                            { src: '/assets/models/meetkai/thanksgiving/content/basement2.png', alt: 'Basement Scene View 1' },
                            { src: '/assets/models/meetkai/thanksgiving/content/basement3.png', alt: 'Basement Scene View 2' }
                        ],
                        columns: 2
                    },
                    // EXTERNAL CROWDS section
                    {
                        type: 'text',
                        title: 'External Crowds',
                        paragraphs: [
                            'The outdoor areas needed a living, breathing crowd to sell the Black Friday chaos. I created an optimized 3D crowd system that runs smoothly even on mobile, achieved through armature aggregation and animation track merging to keep draw calls minimal while maintaining natural movement.'
                        ]
                    },
                    // Crowd images
                    {
                        type: 'image-grid',
                        images: [
                            { src: '/assets/models/meetkai/thanksgiving/content/crowd1.png', alt: 'External Crowd View 1' },
                            { src: '/assets/models/meetkai/thanksgiving/content/crowd2.png', alt: 'External Crowd View 2' }
                        ],
                        columns: 2
                    },
                    // CUTSCENES section
                    {
                        type: 'text',
                        title: 'Cutscenes',
                        paragraphs: [
                            'Throughout the game, cutscene videos play when the player encounters the killer. I created all of these sequences in short and intense moments that tie the gameplay to the film\'s horror atmosphere. Here are a few examples:'
                        ]
                    },
                    // Cutscene videos (stacked)
                    {
                        type: 'video',
                        src: 'https://www.youtube.com/embed/C7IkYRqhUZU',
                        isYoutube: true
                    },
                    {
                        type: 'video',
                        src: 'https://www.youtube.com/embed/_q2h88RLk5Q',
                        isYoutube: true
                    },
                    // Softwares, tools and languages
                    {
                        type: 'tech-stack',
                        title: 'Skills with:',
                        showSeparator: true,
                        items: [
                            { id: 'babylonjs', label: 'Babylon.js' },
                            { id: 'blender', label: 'Blender' },
                            { id: 'substance3d', label: 'Substance 3D' },
                            { id: 'photoshop', label: 'Photoshop' }
                        ]
                    }
                ]
            },
            {
                id: "byd",
                title: "BYD Virtual Dealership",
                description: "3D web visualizer for BYD",
                showLogo: true,
                titleButtons: [
                    { icon: 'link.png', url: 'https://byd-metaverse.mkms.io/?map_id=1676595765&shard_id=73', tooltip: 'Visit Experience' }
                ],
                modelPath: "/assets/models/meetkai/byd/byd.gltf",
                logoPath: "/assets/logos/byd.png",
                contentBlocks: [
                    // Hero image: LA Dealership facade
                    {
                        type: 'hero-image',
                        src: '/assets/models/meetkai/byd/content/facade.png',
                        alt: 'BYD Los Angeles Virtual Dealership'
                    },
                    // Project introduction
                    {
                        type: 'text',
                        paragraphs: [
                            'The BYD Virtual Dealership brings real showrooms into an interactive 3D web experience. Users can explore dealerships in Los Angeles, Singapore, the Philippines, and virtual test tracks—touring vehicles, customizing colors, and even taking virtual test drives, all from their browser.'
                        ]
                    },
                    // My involvement & BYD Seagull
                    {
                        type: 'text',
                        title: 'My Role & The BYD Seagull',
                        paragraphs: [
                            'I played a major role in the 3D side of this project, particularly with vehicle modeling and optimization. We typically received existing car models that needed optimization with proper textures, materials, and animations for web delivery.',
                            'For the BYD Seagull specifically, we didn\'t have an existing model—so I recreated the entire car from scratch. This became one of my favorite pieces of work: I modeled everything from the exterior body, interior cabin, materials, to all interactive animations.'
                        ]
                    },
                    // Modeling process image
                    {
                        type: 'image',
                        src: '/assets/models/meetkai/byd/content/image1.png',
                        alt: 'BYD Seagull 3D Modeling Process',
                        caption: 'Exterior modeling stages: from reference blueprints to final mesh topology'
                    },
                    // Interior text
                    {
                        type: 'text',
                        paragraphs: [
                            'The entire interior was modeled with attention to detail—seats, dashboard, steering wheel, door panels, and all trim pieces—to create an immersive experience when users explore the car from inside.'
                        ]
                    },
                    // Final renders
                    {
                        type: 'image',
                        src: '/assets/models/meetkai/byd/content/image2.png',
                        alt: 'BYD Seagull Final 3D Renders',
                        caption: 'Final renders showing exterior and fully detailed interior'
                    },
                    // Philippines dealership section
                    {
                        type: 'text',
                        title: 'Philippines Dealership',
                        paragraphs: [
                            'I was also the 3D lead for the Philippines Dealership digital twin at Quezon Avenue. This involved recreating the entire dealership architecture and showroom environment where all the car models are showcased.'
                        ]
                    },
                    // Dealership images stacked
                    {
                        type: 'image-grid',
                        columns: 1,
                        images: [
                            {
                                src: '/assets/models/meetkai/byd/content/image3.png',
                                alt: 'Philippines Dealership 3D Render'
                            },
                            {
                                src: '/assets/models/meetkai/byd/content/image4.png',
                                alt: 'Philippines Dealership Web View'
                            }
                        ]
                    },
                    // Softwares, tools and languages
                    {
                        type: 'tech-stack',
                        title: 'Skills with:',
                        showSeparator: true,
                        items: [
                            { id: 'babylonjs', label: 'Babylon.js' },
                            { id: 'blender', label: 'Blender' },
                            { id: 'substance3d', label: 'Substance 3D' },
                            { id: 'photoshop', label: 'Photoshop' }
                        ]
                    }
                ]
            },
            {
                id: "pistons",
                title: "Pistons Virtual Store",
                description: "Virtual merchandise store",
                showLogo: true,
                modelPath: "/assets/models/meetkai/pistons/pistons.gltf",
                logoPath: "/assets/logos/pistons.png",
                contentBlocks: [
                    // Cover image at top
                    {
                        type: 'hero-image',
                        src: '/assets/models/meetkai/pistons/content/cover.png',
                        alt: 'Pistons Virtual Store'
                    },
                    // Project overview
                    {
                        type: 'text',
                        paragraphs: [
                            'The Pistons Virtual Store is an interactive 3D web experience for Detroit Pistons official merchandise. Users can explore jerseys, hoodies, headwear, and gifts across three immersive environments.',
                            'I was the 3D lead on this project and handled most of the UX design decisions as well. I created all three environments optimized for real-time web rendering. Beyond the environments, I also created various interactive assets used throughout the experience.',
                        ]
                    },
                    // YouTube video below intro
                    {
                        type: 'video',
                        src: 'https://www.youtube.com/embed/XhoeLlXyoLE',
                        isYoutube: true
                    },
                    // THE VIRTUAL STORE section
                    {
                        type: 'text',
                        title: 'The Virtual Store',
                        paragraphs: [
                            'The main showroom features product displays organized by category—jerseys showcased on mannequins, headwear on shelving units, and gift items arranged throughout the space.',
                            'Lighting was key to selling the atmosphere. Carefully baked lightmaps bring out the product displays and make the space feel inviting.'
                        ]
                    },
                    // Lightmap comparison (no labels)
                    {
                        type: 'image-compare',
                        beforeSrc: '/assets/models/meetkai/pistons/content/render1.png',
                        afterSrc: '/assets/models/meetkai/pistons/content/render2.png',
                        caption: 'Drag to compare: without lightmaps vs with baked lighting'
                    },
                    // THE COURT section
                    {
                        type: 'text',
                        title: 'The Court',
                        paragraphs: [
                            'The basketball court features a full arena complete with an animated crowd. I used a lightweight technique where the crowd is rendered as flat planes with atlas textures that swap between animation frames, creating the illusion of a cheering 3D audience while keeping performance optimized for the web.'
                        ]
                    },
                    // Court image
                    {
                        type: 'image',
                        src: '/assets/models/meetkai/pistons/content/court3.png',
                        alt: 'Pistons Basketball Court'
                    },
                    // THE LOCKER ROOM section
                    {
                        type: 'text',
                        title: 'The Locker Room',
                        paragraphs: [
                            'The locker room was designed as a virtual event space where Pistons players could appear on screen during scheduled meet-and-greet events. Because of this, it\'s more spacious than a typical locker room, adapted to accommodate virtual gatherings with fans.',
                            'The environment showcases the team\'s championship legacy with banners, player lockers, and an immersive atmosphere.'
                        ]
                    },
                    // Locker room image
                    {
                        type: 'image',
                        src: '/assets/models/meetkai/pistons/content/locker2.png',
                        alt: 'Pistons Locker Room'
                    },
                    // Softwares, tools and languages
                    {
                        type: 'tech-stack',
                        title: 'Skills with:',
                        showSeparator: true,
                        items: [
                            { id: 'babylonjs', label: 'Babylon.js' },
                            { id: 'blender', label: 'Blender' },
                            { id: 'substance3d', label: 'Substance 3D' },
                            { id: 'photoshop', label: 'Photoshop' }
                        ]
                    }
                ]
            },
            {
                id: "meetkaisuite",
                title: "MeetKai Suite (Blender Addon)",
                description: "Blender addon for VR scene exports",
                showLogo: true,
                modelPath: "/assets/models/meetkai/meetkaisuite/meetkaisuite.gltf",
                logoPath: "/assets/logos/blender.png",
                contentBlocks: [
                    // Cover image
                    {
                        type: 'hero-image',
                        src: '/assets/models/meetkai/meetkaisuite/content/cover.png',
                        alt: 'MeetKai Suite Addon'
                    },
                    // Introduction
                    {
                        type: 'text',
                        paragraphs: [
                            'I developed MeetKai Suite out of my own initiative after recognizing the team could benefit from automation tools that simply did not exist at the time. I joined MeetKai in 2023 and by the end of that year, after absorbing how things were done, I started building these tools.',
                            'Since then, it has fundamentally transformed our 3D asset creation pipeline for web. The addon is now a standard tool within the team and is used extensively throughout our 3D production process.'
                        ]
                    },
                    // Material Aggregator + Object Remesher (image left)
                    {
                        type: 'feature-card',
                        imageSrc: '/assets/models/meetkai/meetkaisuite/content/materialAggregaor.png',
                        title: 'Material Aggregator & Object Remesher',
                        paragraphs: [
                            'Merges multiple materials into a single optimized texture set, with integrated geometry remeshing. One-click "Apply and Aggregate" finalizes mesh and textures together, drastically reducing draw calls.'
                        ],
                        imagePosition: 'right',
                        showSeparator: true
                    },
                    // Lightmap Baker (image left)
                    {
                        type: 'feature-card',
                        imageSrc: '/assets/models/meetkai/meetkaisuite/content/lightmapBaker.png',
                        title: 'Lightmap & AO Baker',
                        paragraphs: [
                            'Generates high-quality lightmaps or ambient occlusion maps with HDR output, per-object baking, and HQ Mode for automatic downscaling. Built-in noise reduction delivers production-ready results.'
                        ],
                        imagePosition: 'left',
                        showSeparator: true
                    },
                    // UV Mapper (image right)
                    {
                        type: 'feature-card',
                        imageSrc: '/assets/models/meetkai/meetkaisuite/content/uvMapper.png',
                        title: 'UV Mapper',
                        paragraphs: [
                            'Automatic UV unwrapping inspired by Unity, handling scaling, packing, and index generation. Artists no longer need to manually prepare UV layouts for lightmaps.'
                        ],
                        imagePosition: 'right',
                        showSeparator: true
                    },
                    // Color Atlas Editor (image left)
                    {
                        type: 'feature-card',
                        imageSrc: '/assets/models/meetkai/meetkaisuite/content/colorAtlasEditor.png',
                        title: 'Color Atlas Editor',
                        paragraphs: [
                            'Per-face PBR editing using just two 128×128 textures, enabling immense value combinations with nearly zero footprint. Ideal for stylized models and high-optimization projects.'
                        ],
                        imagePosition: 'left',
                        showSeparator: true
                    },
                    // Armature Aggregator (image right)
                    {
                        type: 'feature-card',
                        imageSrc: '/assets/models/meetkai/meetkaisuite/content/armatureAggregator.png',
                        title: 'Armature Aggregator',
                        paragraphs: [
                            'Merges multiple rigs into one while preserving bone structure and animations. Includes action merging to combine animation tracks into a single, unified action.'
                        ],
                        imagePosition: 'right',
                        showSeparator: true
                    },
                    // MeetKai Assistant (image left)
                    {
                        type: 'feature-card',
                        imageSrc: '/assets/models/meetkai/meetkaisuite/content/meetkaiAssistant.png',
                        title: 'MeetKai Assistant',
                        paragraphs: [
                            'AI-powered agentic editing in Blender. Type a prompt, press Execute Task, and an AI agent performs the operation using Blender\'s scripting capabilities.'
                        ],
                        imagePosition: 'left',
                        showSeparator: true
                    },
                    // Tools & Technologies
                    {
                        type: 'tech-stack',
                        title: 'Softwares, tools and languages',
                        showSeparator: true,
                        items: [
                            { id: 'blender', label: 'Blender' },
                            { id: 'blenderapi', label: 'Blender API' },
                            { id: 'python', label: 'Python' },
                            { id: 'javascript', label: 'JavaScript' },
                            { id: 'openai', label: 'OpenAI API' },
                            { id: 'photoshop', label: 'Photoshop' },
                            { id: 'git', label: 'Git/GitHub' },
                            { id: 'cursor', label: 'Cursor' }
                        ]
                    }
                ]
            }
        ]
    },

    // S.state_6 - More Than Real
    [S.state_6]: {
        id: "morethanreal",
        companyName: "More Than Real",
        showCompanyLogo: true,
        companyLogoPath: "/assets/logos/morethanreal.png",
        period: "Jan, 2022 - Jan, 2023",
        location: "São Paulo, Brazil",
        workStyle: "Remote",
        role: "3D Designer for AR",
        description: "At More Than Real, I created immersive 3D marketing experiences for major consumer brands.",
        titleButtons: [
            { icon: 'link.png', url: 'https://www.morethanreal.io/', tooltip: 'Visit Website' }
        ],
        projects: [
            {
                id: "chevrolet",
                title: "Chevrolet",
                description: "Chevrolet Montana 2023 for AR",
                showLogo: true,
                modelPath: "/assets/models/morethanreal/chevrolet/chevrolet.gltf",
                logoPath: "/assets/logos/chevrolet.png",
                contentBlocks: [
                    // Cover image
                    {
                        type: 'hero-image',
                        src: '/assets/models/morethanreal/chevrolet/content/cover.png',
                        alt: 'Chevrolet Montana lineup'
                    },
                    // Introduction
                    {
                        type: 'text',
                        paragraphs: [
                            'The Chevrolet Montana 2023 was launched with a major marketing campaign, including being featured on Big Brother Brasil reality show. I developed the 3D model for AR visualization as part of this campaign. This was one of several automotive projects I worked on at More Than Real.'
                        ]
                    },
                    // 3D Development section
                    {
                        type: 'text',
                        title: '3D Development',
                        showSeparator: true,
                        paragraphs: [
                            'The model was optimized for real-time rendering: polycount reduction, baked AO maps, texture atlases, and rigged animations for the truck bed mechanisms showcase the versatile tailgate configurations.'
                        ]
                    },
                    // 3D Model in Blender
                    {
                        type: 'image',
                        src: '/assets/models/morethanreal/chevrolet/content/image1.png',
                        alt: 'Chevrolet Montana 3D model in Blender',
                        caption: 'Animated truck bed with tailgate and accessory configurations'
                    },
                    // AR Visualization section
                    {
                        type: 'text',
                        title: 'AR Visualization',
                        showSeparator: true,
                        paragraphs: [
                            'The final model was deployed to WebAR, letting customers place the vehicle in their environment at real scale using just their smartphone.'
                        ]
                    },
                    // AR demo image
                    {
                        type: 'image',
                        src: '/assets/models/morethanreal/chevrolet/content/image2.png',
                        alt: 'Chevrolet Montana in AR',
                        caption: 'AR visualization on a smartphone'
                    },
                    // Softwares, tools and languages
                    {
                        type: 'tech-stack',
                        title: 'Skills with:',
                        showSeparator: true,
                        items: [
                            { id: 'babylonjs', label: 'Babylon.js' },
                            { id: 'spark', label: 'Spark AR' },
                            { id: 'blender', label: 'Blender' },
                            { id: 'photoshop', label: 'Photoshop' }
                        ]
                    }
                ]
            },
            {
                id: "dolcegusto",
                title: "Nescafé Dolce Gusto",
                description: "Dolce Gusto coffee machines for AR",
                showLogo: true,
                modelPath: "/assets/models/morethanreal/dolcegusto/dolcegusto.gltf",
                logoPath: "/assets/logos/dolcegusto.png",
                contentBlocks: [
                    // Cover image
                    {
                        type: 'hero-image',
                        src: '/assets/models/morethanreal/dolcegusto/content/cover.png',
                        alt: 'Dolce Gusto Coffee Machines Collection'
                    },
                    // Introduction
                    {
                        type: 'text',
                        paragraphs: [
                            'This project involved creating 3D models of Dolce Gusto coffee machines for Nescafé, to be used in WebXR experiences for sales and marketing. These interactive AR models allow customers to explore the products in their own space before purchasing.'
                        ]
                    },
                    // 3D Modeling process
                    {
                        type: 'text',
                        paragraphs: [
                            'Since Nescafé didn\'t have original 3D files for these machines, I had to recreate them from scratch using only photos and technical specifications as reference. Surface modeling was done in Autodesk Fusion 360, then brought into Blender for UV unwrapping, materials, and rendering.'
                        ]
                    },
                    // Process image
                    {
                        type: 'image',
                        src: '/assets/models/morethanreal/dolcegusto/content/dolcegusto1.png',
                        alt: 'Dolce Gusto 3D Modeling Process',
                        caption: 'Surface modeling stages from reference to final mesh'
                    },
                    // Final touches
                    {
                        type: 'text',
                        paragraphs: [
                            'Blender also enabled me to create material variants for the different product colors, which is essential for AR applications where users can switch between options in real-time.'
                        ]
                    },
                    // Softwares, tools and languages
                    {
                        type: 'tech-stack',
                        title: 'Skills with:',
                        showSeparator: true,
                        items: [
                            { id: 'babylonjs', label: 'Babylon.js' },
                            { id: 'spark', label: 'Spark AR' },
                            { id: 'fusion360', label: 'Fusion 360' },
                            { id: 'blender', label: 'Blender' },
                            { id: 'photoshop', label: 'Photoshop' }
                        ]
                    }
                ]
            },
            {
                id: "sika",
                title: "Sika",
                description: "AR product presentation with Sikaman",
                showLogo: true,
                modelPath: "/assets/models/morethanreal/sika/sika.gltf",
                logoPath: "/assets/logos/sika.png",
                contentBlocks: [
                    // Float image with text wrapping around
                    {
                        type: 'float-image',
                        imageSrc: '/assets/models/morethanreal/sika/content/Sikaman-Portfolio.png',
                        imageAlt: 'Sikaman mascot',
                        imagePosition: 'left',
                        paragraphs: [
                            'Sikaman is the mascot for Sika, a construction materials brand. Customers scan a QR code on product shelves in physical stores, launching a WebAR experience where Sikaman flies in and presents the Sika product line.',
                            'The 3D model was created and optimized in Blender for real-time rendering in WebAR. The final mesh sits around 18k polygons with an armature, keeping the file lightweight for mobile devices.'
                        ]
                    },
                    // Modeling image
                    {
                        type: 'image',
                        src: '/assets/models/morethanreal/sika/content/sik1.png',
                        alt: 'Sikaman 3D Model Topology',
                        caption: 'Front, side, and detail views showing the optimized mesh topology'
                    },
                    // Animation text
                    {
                        type: 'text',
                        paragraphs: [
                            'The character features an intro animation followed by idle loops. When users select a product to learn more, Sikaman performs gesture animations with speech balloons appearing and disappearing dynamically.'
                        ]
                    },
                    // Animation image
                    {
                        type: 'image',
                        src: '/assets/models/morethanreal/sika/content/sika2.png',
                        alt: 'Sikaman Animation Poses',
                        caption: 'Various animation poses rigged for the WebAR experience'
                    },
                    // Softwares, tools and languages
                    {
                        type: 'tech-stack',
                        title: 'Skills with:',
                        showSeparator: true,
                        items: [
                            { id: 'babylonjs', label: 'Babylon.js' },
                            { id: 'spark', label: 'Spark AR' },
                            { id: 'blender', label: 'Blender' },
                            { id: 'photoshop', label: 'Photoshop' }
                        ]
                    }
                ]
            },
            {
                id: "seara",
                title: "Seara",
                description: "3D scanned food dishes for AR",
                showLogo: true,
                modelPath: "/assets/models/morethanreal/seara/seara.gltf",
                logoPath: "/assets/logos/seara.png",
                contentBlocks: [
                    // Cover image - photo vs 3D comparison
                    {
                        type: 'hero-image',
                        src: '/assets/models/morethanreal/seara/content/cover.png',
                        alt: 'Seara Food Dishes - Photo vs 3D Scan Comparison'
                    },
                    // Introduction
                    {
                        type: 'text',
                        paragraphs: [
                            'I worked on over twenty 3D scanned food dishes for Seara, one of Brazil\'s largest food brands. These models were created for WebAR experiences, allowing customers to visualize products in their own environment.'
                        ]
                    },
                    // Gallery of dishes
                    {
                        type: 'image',
                        src: '/assets/models/morethanreal/seara/content/seara3.png',
                        alt: 'Collection of 3D Scanned Food Dishes',
                        caption: 'Selection of the 20+ dishes created for the AR experience'
                    },
                    // Photogrammetry process
                    {
                        type: 'text',
                        paragraphs: [
                            'Each dish was captured using photogrammetry—around 200 photos taken from multiple angles, then processed with 3D scanning software to generate the base mesh and textures.'
                        ]
                    },
                    // Scanning process image
                    {
                        type: 'image',
                        src: '/assets/models/morethanreal/seara/content/seara1.png',
                        alt: 'Photogrammetry Capture Process',
                        caption: 'Multiple angles captured and processed through 3D Scanner App'
                    },
                    // Texture optimization text
                    {
                        type: 'text',
                        paragraphs: [
                            'Texture optimization was particularly challenging since photogrammetry doesn\'t capture roughness or glossiness maps, which had to be painted manually in Blender.'
                        ]
                    },
                    // Texture optimization image
                    {
                        type: 'image',
                        src: '/assets/models/morethanreal/seara/content/seara2.png',
                        alt: 'Texture Optimization Workflow',
                        caption: 'Creating roughness maps manually to add realistic material properties'
                    },
                    // Softwares, tools and languages
                    {
                        type: 'tech-stack',
                        title: 'Skills with:',
                        showSeparator: true,
                        items: [
                            { id: 'babylonjs', label: 'Babylon.js' },
                            { id: 'spark', label: 'Spark AR' },
                            { id: 'blender', label: 'Blender' },
                            { id: 'photoshop', label: 'Photoshop' },
                            { id: '3dscanning', label: '3D Scanning' }
                        ]
                    }
                ]
            }
        ]
    },

    // S.state_7 - Baltha Maker
    [S.state_7]: {
        id: "balthamaker",
        companyName: "Baltha Maker",
        showCompanyLogo: true,
        companyLogoPath: "/assets/logos/balthamaker.png",
        period: "Mar, 2018 - Dec, 2021",
        location: "Florianópolis, Brazil",
        workStyle: "On-site",
        role: "3D Printing Designer and Founder",
        description: "Baltha Maker was my 3D printing studio where I created scale models and physical prototypes.",
        projects: [
            {
                id: "sesc",
                title: "Florianópolis Museum",
                description: "3D printed scale model",
                showLogo: true,
                modelPath: "/assets/models/balthamaker/sesc/sesc.gltf",
                logoPath: "/assets/logos/sesc.png",
                contentBlocks: [
                    // Cover image - the actual museum building
                    {
                        type: 'hero-image',
                        src: '/assets/models/balthamaker/sesc/content/cover.png',
                        alt: 'Florianópolis Museum - Victor Meirelles'
                    },
                    // Introduction
                    {
                        type: 'text',
                        paragraphs: [
                            'This project was developed for SESC Florianópolis Museum, representing a 1:41m scale version of the actual museum building. The model now sits in the museum\'s entrance hall, attracting the eyes of everyone who visits.',
                            'One of the reasons this work was so valuable to me was because I had the opportunity to integrate many different technical Skills with: architecture, design engineering, technical CAD modeling, and NURBS modeling. In fact, it was the first moment I actually got in touch with NURBS, and since then I never stopped working with it.'
                        ]
                    },
                    // 3D Modeling section
                    {
                        type: 'text',
                        title: '3D Modeling',
                        showSeparator: true,
                        paragraphs: [
                            'From archives, floor plans, and facades technical drawings, I created the 3D model of the building in Autodesk Fusion 360 using technical CAD modeling for the most part and NURBS for the fine details to be represented later on in the 3D printed model.'
                        ]
                    },
                    // 3D Model detail renders
                    {
                        type: 'image',
                        src: '/assets/models/balthamaker/sesc/content/image1.png',
                        alt: '3D Model details of Florianópolis Museum',
                        caption: 'Detailed ornamental elements modeled with NURBS in Fusion 360'
                    },
                    // 3D printing process collage
                    {
                        type: 'image',
                        src: '/assets/models/balthamaker/sesc/content/image2.png',
                        alt: '3D printing process and individual parts',
                        caption: 'Multi-color 3D printed parts including railings, shutters, and ornamental details'
                    },
                    // 3D Printing and Finishing section
                    {
                        type: 'text',
                        title: '3D Printing and Finishing',
                        showSeparator: true,
                        paragraphs: [
                            'For printing purposes, the model was subdivided in many parts and printed in different colors to minimize the need for painting. Parts were put together by vacuum fitting and gluing. Once the model was built, a final layer of epoxy resin was used in the whole surface—for protection and preservation purposes.',
                            'The printed model is hollow and weighs about 20kg. It is located in the entrance hall of the Florianópolis Museum, attracting the eyes of everyone who visits.'
                        ]
                    },
                    // Final model on display
                    {
                        type: 'image',
                        src: '/assets/models/balthamaker/sesc/content/image3.jpg',
                        alt: 'Final 3D printed model displayed in museum',
                        caption: 'The finished 1:41m scale model on display at SESC Museum entrance hall'
                    },
                    // Softwares, tools and languages
                    {
                        type: 'tech-stack',
                        title: 'Skills with:',
                        showSeparator: true,
                        items: [
                            { id: 'fusion360', label: 'Fusion 360' },
                            { id: 'blender', label: 'Blender' },
                            { id: 'cura', label: 'Cura' },
                            { id: '3dprinting', label: '3D Printing' }
                        ]
                    }
                ]
            },
            {
                id: "starwars",
                title: "Millennium Falcon Mouse",
                description: "Custom Star Wars mouse",
                showLogo: true,
                titleButtons: [
                    { icon: 'link.png', url: 'https://www.thingiverse.com/thing:6683242', tooltip: 'View on Thingiverse' }
                ],
                modelPath: "/assets/models/balthamaker/starwars/starwars.gltf",
                logoPath: "/assets/logos/starwars.png",
                contentBlocks: [
                    // Cover image
                    {
                        type: 'hero-image',
                        src: '/assets/models/balthamaker/starwars/content/cover.png',
                        alt: 'Millennium Falcon 3D printed mouse'
                    },
                    // Intro
                    {
                        type: 'text',
                        paragraphs: [
                            'As a fan of the Star Wars movie series, I created this 3D printed mouse of the Millennium Falcon back in 2017. After publishing it on Instagram, it reached over 150k people and many were interested in building their own. I then made an upgraded version with higher detail and easier assembly.'
                        ]
                    },
                    {
                        type: 'video',
                        src: 'https://www.youtube.com/embed/zsmf0Fp8Sbo',
                        isYoutube: true
                    },
                    // 3D Modeling
                    {
                        type: 'text',
                        title: '3D Modeling',
                        showSeparator: true,
                        paragraphs: [
                            'The first step was to choose a cheap wireless mouse from AliExpress and reverse-engineer its electronics in Autodesk Fusion 360. Then I modeled the Falcon based on reference images, making sure the internal electronics would fit properly.'
                        ]
                    },
                    // Model images side by side
                    {
                        type: 'image-grid',
                        columns: 2,
                        images: [
                            { src: '/assets/models/balthamaker/starwars/content/mouse1.png', alt: '3D model of Millennium Falcon mouse' },
                            { src: '/assets/models/balthamaker/starwars/content/mouse2.png', alt: 'Internal electronics layout' }
                        ]
                    },
                    // Features and assembly text
                    {
                        type: 'text',
                        paragraphs: [
                            'The design includes a screw lid on top for the USB plug, a blue LED in the rear to simulate light speed, and a side button to toggle the LED on and off.',
                            'After 3D printing, the build is straightforward with no soldering required. This makes it a perfect project for hobbyists, kids learning robotics, or professional makers.'
                        ]
                    },
                    // Assembly and final result
                    {
                        type: 'image',
                        src: '/assets/models/balthamaker/starwars/content/mouse3.png',
                        alt: 'Assembly process and final mouse with LED',
                        caption: 'Printed parts, assembly process, and final result with blue LED glow'
                    },
                    // Softwares, tools and languages
                    {
                        type: 'tech-stack',
                        title: 'Skills with:',
                        showSeparator: true,
                        items: [
                            { id: 'fusion360', label: 'Fusion 360' },
                            { id: 'blender', label: 'Blender' },
                            { id: 'cura', label: 'Cura' },
                            { id: '3dprinting', label: '3D Printing' }
                        ]
                    }
                ]
            },
            {
                id: "mesc",
                title: "MESC Museum",
                description: "3D printed architectural model",
                showLogo: true,
                modelPath: "/assets/models/balthamaker/mesc/mesc.gltf",
                logoPath: "/assets/logos/mesc.png",
                contentBlocks: [
                    // Cover image - the actual MESC building
                    {
                        type: 'hero-image',
                        src: '/assets/models/balthamaker/mesc/content/cover.png',
                        alt: 'Museu da Escola Catarinense - MESC'
                    },
                    // Introduction
                    {
                        type: 'text',
                        paragraphs: [
                            'After completing the Florianópolis Museum scale model, I was approached by the Museu da Escola Catarinense (MESC) to create a similar piece for their institution. The two museums are located nearby in downtown Florianópolis, and word travels fast.',
                            'MESC is housed in a beautiful neoclassical building that was originally built in the early 20th century. With its imposing columns and distinctive curved skylight roof, it preserves the educational history of Santa Catarina state.'
                        ]
                    },
                    // 3D Modeling section
                    {
                        type: 'text',
                        title: '3D Modeling',
                        showSeparator: true,
                        paragraphs: [
                            'Having the experience from the SESC project made this one significantly smoother. I followed a similar workflow: using architectural floor plans and facade references to build an accurate 3D model in Autodesk Fusion 360, with NURBS surfaces for the ornamental details like the columns and cornices.'
                        ]
                    },
                    // 3D Model render
                    {
                        type: 'image',
                        src: '/assets/models/balthamaker/mesc/content/mesc1.png',
                        alt: '3D CAD model of MESC Museum',
                        caption: 'Complete 3D model rendered in Autodesk Fusion 360'
                    },
                    // Production section
                    {
                        type: 'text',
                        title: 'Production and Finishing',
                        showSeparator: true,
                        paragraphs: [
                            'The model was 3D printed in multiple parts using the same multi-color approach from the previous project. The curved skylight on the roof was especially interesting to produce, requiring careful consideration of print orientation and support structures.',
                            'After assembly with vacuum fitting and gluing, the entire surface was coated with epoxy resin for durability and a premium finish.'
                        ]
                    },
                    // Production image
                    {
                        type: 'image',
                        src: '/assets/models/balthamaker/mesc/content/mesc2.png',
                        alt: '3D printed MESC model during assembly',
                        caption: 'Assembled scale model before final finishing'
                    },
                    // Final result
                    {
                        type: 'image',
                        src: '/assets/models/balthamaker/mesc/content/mesc3.png',
                        alt: 'Finished MESC Museum scale model',
                        caption: 'The completed scale model ready for display (I know it looks like AI with this solar beam, but it\'s not)'
                    },
                    // Softwares, tools and languages
                    {
                        type: 'tech-stack',
                        title: 'Skills with:',
                        showSeparator: true,
                        items: [
                            { id: 'fusion360', label: 'Fusion 360' },
                            { id: 'blender', label: 'Blender' },
                            { id: 'cura', label: 'Cura' },
                            { id: '3dprinting', label: '3D Printing' }
                        ]
                    }
                ]
            }
        ]
    },

    // S.state_8 - UFSC (Product Design) - LAST
    [S.state_8]: {
        id: "ufsc",
        companyName: "UFSC",
        showCompanyLogo: true,
        companyLogoPath: "/assets/logos/ufsc.png",
        period: "Jan, 2018 - Dec, 2021",
        location: "Florianópolis, Brazil",
        workStyle: "On-site",
        role: "Product Design Undergraduate",
        description: "Product design projects developed during my studies at the Federal University of Santa Catarina.",
        projects: [
            {
                id: "petwheels",
                title: "Petwheels",
                description: "Parametric wheelchair for dogs",
                showLogo: true,
                titleButtons: [
                    { icon: 'link.png', url: 'https://g1.globo.com/sc/santa-catarina/noticia/2022/07/12/cadeira-de-rodas-para-caes-inspirada-em-carros-esportivos-e-desenvolvida-na-ufsc.ghtml', tooltip: 'Read Article' }
                ],
                modelPath: "/assets/models/ufsc/petwheels/petwheels.gltf",
                logoPath: "/assets/logos/petwheels.png",
                contentBlocks: [
                    // Cover image
                    {
                        type: 'hero-image',
                        src: '/assets/models/ufsc/petwheels/content/cover.png',
                        alt: 'Dog running with Petwheels wheelchair'
                    },
                    // Introduction
                    {
                        type: 'text',
                        paragraphs: [
                            'Petwheels is a patented parametric wheelchair for dogs with disabilities, developed as my undergraduate final project in Product Design. The goal was to create a low-cost, tailor-made solution that could adapt to the highly variable types of disabilities and body sizes found in dogs, enabled by parametric modeling and digital fabrication.'
                        ]
                    },
                    // Technical drawings side by side
                    {
                        type: 'image-grid',
                        columns: 2,
                        images: [
                            { src: '/assets/models/ufsc/petwheels/content/image1.png', alt: 'Technical drawing with numbered parts' },
                            { src: '/assets/models/ufsc/petwheels/content/image2.png', alt: 'Wheelchair fitted on dog silhouette' }
                        ]
                    },
                    // Design concept
                    {
                        type: 'text',
                        title: 'Design Concept',
                        paragraphs: [
                            'The product conveys a sense of freedom and technology, drawing inspiration from the fluid lines and shapes of sports cars. This aesthetic approach gives Petwheels a modern, dynamic appearance that reflects the mobility it provides.'
                        ],
                        showSeparator: true
                    },
                    // Concept inspiration image
                    {
                        type: 'image',
                        src: '/assets/models/ufsc/petwheels/content/image3.png',
                        alt: 'Design inspiration from sports cars',
                        caption: 'Fluid lines inspired by automotive design'
                    },
                    // Parametric 3D Modeling title
                    {
                        type: 'text',
                        title: 'Parametric 3D Modeling',
                        showSeparator: true,
                        paragraphs: []
                    },
                    // 3D model render
                    {
                        type: 'image',
                        src: '/assets/models/ufsc/petwheels/content/image5.png',
                        alt: 'Petwheels 3D model top view'
                    },
                    // Parametric modeling explanation
                    {
                        type: 'text',
                        paragraphs: [
                            'Since the wheelchair is manufactured via 3D printing, almost every dimension of the model takes into account parameters that are collected from the dog prior to printing. The challenge was to create a 3D model in Autodesk Fusion 360 that could effectively compute different parameters without compromising the overall geometry and functionality.'
                        ]
                    },
                    // Parametric modeling screenshot
                    {
                        type: 'image',
                        src: '/assets/models/ufsc/petwheels/content/image4.png',
                        alt: 'Parametric modeling in Fusion 360',
                        caption: 'Parameter-driven geometry adapts to any dog size'
                    },
                    // Prototyping and manufacturing
                    {
                        type: 'text',
                        title: 'Prototyping and Manufacturing',
                        showSeparator: true,
                        paragraphs: []
                    },
                    // 3D printing process
                    {
                        type: 'image',
                        src: '/assets/models/ufsc/petwheels/content/image6.png',
                        alt: '3D printing workflow',
                        caption: 'From slicer to printer to finished part'
                    },
                    // Manufacturing text
                    {
                        type: 'text',
                        paragraphs: [
                            'Because the modeling is fully parametric, each wheelchair can be 3D printed in any size and configuration according to the dog\'s specific measurements and parameter limits. This brings real innovation to product manufacturing: full customization combined with easy fabrication and rapid prototyping, enabling quick iteration and testing without traditional tooling costs.'
                        ]
                    },
                    // Final prototype
                    {
                        type: 'image',
                        src: '/assets/models/ufsc/petwheels/content/image7.png',
                        alt: 'Final 3D printed prototype on dog',
                        caption: 'Working prototype tested on a real patient'
                    },
                    // Softwares, tools and languages
                    {
                        type: 'tech-stack',
                        title: 'Skills with:',
                        showSeparator: true,
                        items: [
                            { id: 'fusion360', label: 'Fusion 360' },
                            { id: 'blender', label: 'Blender' },
                            { id: 'photoshop', label: 'Photoshop' },
                            { id: 'cura', label: 'Cura' },
                            { id: '3dprinting', label: '3D Printing' }
                        ]
                    }
                ]
            },
            {
                id: "durare",
                title: "Durare",
                description: "Suitcase made to last",
                showLogo: true,
                modelPath: "/assets/models/ufsc/durare/durare.gltf",
                logoPath: "/assets/logos/durare.png",
                contentBlocks: [
                    // Cover image
                    {
                        type: 'hero-image',
                        src: '/assets/models/ufsc/durare/content/cover.png',
                        alt: 'Durare suitcase with wheel detail'
                    },
                    // Intro
                    {
                        type: 'text',
                        paragraphs: [
                            'Durare is a suitcase concept designed to solve the two most common structural problems reported by users: wheels that break and retractable handles that get damaged during transport.'
                        ]
                    },
                    // Design concept
                    {
                        type: 'text',
                        title: 'Design Concept',
                        showSeparator: true,
                        paragraphs: [
                            'The design draws inspiration from off-road and robust automobiles, conveying a sense of technology and resilience. The wheel design follows the airless tire innovation, which increases durability and reduces environmental impact from discarded rubber.'
                        ]
                    },
                    // Inspiration image
                    {
                        type: 'image',
                        src: '/assets/models/ufsc/durare/content/image1.png',
                        alt: 'Airless tire and automotive inspiration',
                        caption: 'Airless tire technology meets automotive aesthetics'
                    },
                    // Float image with remaining text
                    {
                        type: 'float-image',
                        imageSrc: '/assets/models/ufsc/durare/content/image2.png',
                        imageAlt: 'Retractable wheel mechanism',
                        imagePosition: 'left',
                        paragraphs: [
                            'For the retractable handles, the solution uses magnets instead of complex mechanical mechanisms, resulting in a much simpler build that is less prone to breaking.',
                            'The result is a suitcase designed with an aesthetic that differs from traditional luggage while maintaining all essential functionalities.'
                        ]
                    },
                    // Softwares, tools and languages
                    {
                        type: 'tech-stack',
                        title: 'Skills with:',
                        showSeparator: true,
                        items: [
                            { id: 'fusion360', label: 'Fusion 360' },
                            { id: 'blender', label: 'Blender' },
                            { id: 'photoshop', label: 'Photoshop' },
                            { id: 'cura', label: 'Cura' },
                            { id: '3dprinting', label: '3D Printing' }
                        ]
                    }
                ]
            },
            {
                id: "zenic",
                title: "Zenic",
                description: "Modular furniture for coworking",
                showLogo: true,
                modelPath: "/assets/models/ufsc/zenic/zenic.gltf",
                logoPath: "/assets/logos/zenic.png",
                contentBlocks: [
                    // Two hero images side by side
                    {
                        type: 'image-grid',
                        columns: 2,
                        images: [
                            { src: '/assets/models/ufsc/zenic/content/cover.png', alt: 'Zenic in chaise longue mode' },
                            { src: '/assets/models/ufsc/zenic/content/image1.png', alt: 'Zenic in desk mode' }
                        ]
                    },
                    // Intro text
                    {
                        type: 'text',
                        paragraphs: [
                            'Zenic is a modular furniture piece designed for CoCreation Lab, an open-air coworking space seeking durable and versatile furniture. The solution is a bamboo piece that transforms between a study table and a chaise longue, focusing on the private section where people spend hours working alone.',
                            'The design lets users switch modes depending on their task: upright for focused work, reclined for reading or relaxation. This flexibility supports both productivity and comfort throughout long work sessions.'
                        ]
                    },
                    // Configurations image
                    {
                        type: 'image',
                        src: '/assets/models/ufsc/zenic/content/image2.png',
                        alt: 'Zenic configurations and usage modes',
                        caption: 'Multiple configurations for different work styles'
                    },
                    // Design Aspects title
                    {
                        type: 'text',
                        title: 'Design Aspects',
                        showSeparator: true,
                        paragraphs: []
                    },
                    // Ergonomics text
                    {
                        type: 'text',
                        paragraphs: [
                            'The reclined position replicates the "maximum relaxation posture" used by NASA for astronauts in zero gravity. The table surface rotates 90° to become a chaise longue with a support for books and laptops, allowing users to work comfortably for extended periods.'
                        ]
                    },
                    // Ergonomics image
                    {
                        type: 'image',
                        src: '/assets/models/ufsc/zenic/content/image3.png',
                        alt: 'Ergonomic posture analysis',
                        caption: 'NASA relaxation posture applied to furniture design'
                    },
                    // Golden ratio text
                    {
                        type: 'text',
                        paragraphs: [
                            'The golden ratio (1.618) can be found throughout nature, from flowers to nautilus shells to galaxies. Seeking to bring this concept to the design, Zenic was made so that when in lounger format, it fits perfectly within a golden rectangle.'
                        ]
                    },
                    // Golden ratio images side by side
                    {
                        type: 'image-grid',
                        columns: 2,
                        images: [
                            { src: '/assets/models/ufsc/zenic/content/image4.png', alt: 'Golden ratio in nature' },
                            { src: '/assets/models/ufsc/zenic/content/image5.gif', alt: 'Golden ratio overlay animation' }
                        ]
                    },
                    // Manufacturing text
                    {
                        type: 'text',
                        title: 'Materials and Manufacturing',
                        showSeparator: true,
                        paragraphs: [
                            'The frame uses laminated bamboo and treated pine for sustainability and durability. Stainless steel provides corrosion resistance for the structural joints, while linen and cotton-polyester fabrics offer comfort and breathability.'
                        ]
                    },
                    // Manufacturing details image
                    {
                        type: 'image',
                        src: '/assets/models/ufsc/zenic/content/image6.png',
                        alt: 'Manufacturing details and joints',
                        caption: 'Modular construction with sustainable materials'
                    },
                    // Softwares, tools and languages
                    {
                        type: 'tech-stack',
                        title: 'Skills with:',
                        showSeparator: true,
                        items: [
                            { id: 'fusion360', label: 'Fusion 360' },
                            { id: 'blender', label: 'Blender' },
                            { id: 'photoshop', label: 'Photoshop' },
                            { id: 'cura', label: 'Cura' },
                            { id: '3dprinting', label: '3D Printing' }
                        ]
                    }
                ]
            }
        ]
    }
};

// Get workplace config for a given state number
export function getWorkplaceConfig(stateNumber: number): WorkplaceConfig | null {
    return workplaceConfigs[stateNumber] || null;
}

// Get project config for a given state and project index
export function getProjectConfig(stateNumber: number, projectIndex: number): ProjectConfig | null {
    const workplace = workplaceConfigs[stateNumber];
    if (!workplace) return null;
    return workplace.projects[projectIndex] || null;
}

// Get all projects for a state as an array of model paths (for dynamic model loading)
export function getProjectModelPaths(stateNumber: number): { id: string; modelPath: string }[] {
    const workplace = workplaceConfigs[stateNumber];
    if (!workplace) return [];
    return workplace.projects.map(p => ({ id: p.id, modelPath: p.modelPath }));
}
