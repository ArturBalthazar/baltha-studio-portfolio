/**
 * Internationalization (i18n) System for Baltha Studio
 * 
 * This file contains all translations for the website.
 * Brand names like "Baltha Studio", "Meetcraft", and "Petwheels" should NOT be translated.
 * 
 * To add a new language:
 * 1. Add the language code to the LanguageCode type
 * 2. Add a new entry in the translations object with all keys translated
 * 
 * To add a new translation key:
 * 1. Add the key to the TranslationKeys interface
 * 2. Add translations for all languages in the translations object
 */

export type LanguageCode = 'EN' | 'PT' | 'ES' | 'DE' | 'FR' | 'ZH';

// All translation keys - organized by section for easier maintenance
export interface TranslationKeys {
    // Header
    header: {
        welcomeText: string;
    };

    // Navigation Menu
    menu: {
        welcome: string;
        meetcraft: string;
        meetkai: string;
        morethanreal: string;
        balthamaker: string;
        ufsc: string;
        letsConnect: string;
    };

    // State 3 - Navigation & Audio Selection
    state3: {
        navigationTitle: string;
        guided: string;
        free: string;
        audioTitle: string;
        on: string;
        off: string;
        typingText: string;
    };

    // Bottom Left Controls
    controls: {
        turnAudioOff: string;
        turnAudioOn: string;
        information: string;
    };

    // Workplaces - Portfolio panel content
    workplaces: {
        meetcraft: WorkplaceTranslation;
        meetkai: WorkplaceTranslation;
        morethanreal: WorkplaceTranslation;
        balthamaker: WorkplaceTranslation;
        ufsc: WorkplaceTranslation;
    };

    // Connect Overlay (State Final)
    connect: {
        title: string;
        email: string;
        copy: string;
        copied: string;
        send: string;
        // Brand names - kept identical to prevent phone auto-translation
        linkedin: string;
        instagram: string;
        whatsapp: string;
    };

    // Chat
    chat: {
        headerTitle: string;
        headerSubtitle: string;
        placeholder: string;
        errorMessage: string;
        suggestion1: string;
        suggestion2: string;
        suggestion3: string;
    };

    // Common
    common: {
        previous: string;
        next: string;
        close: string;
        open: string;
        goToModel: string;
        skillsWith: string;
    };
}

// Workplace translation structure
export interface WorkplaceTranslation {
    companyName: string;
    role: string;
    projects: Record<string, ProjectTranslation>;
}

// Project translation structure  
export interface ProjectTranslation {
    title: string;
    description: string;
    content: string[];  // Array of translatable text (paragraphs, titles, captions)
}

// All translations organized by language
export const translations: Record<LanguageCode, TranslationKeys> = {
    EN: {
        header: {
            welcomeText: "Welcome to Baltha Studio! I'm Artur Balthazar, your professional 3D developer and designer 🚀"
        },
        menu: {
            welcome: "Welcome",
            meetcraft: "Meetcraft",
            meetkai: "Meetkai Inc.",
            morethanreal: "More Than\nReal",
            balthamaker: "Baltha\nMaker",
            ufsc: "UFSC",
            letsConnect: "Let's\nConnect!"
        },
        state3: {
            navigationTitle: "Navigation",
            guided: "Guided",
            free: "Free",
            audioTitle: "Audio",
            on: "-",
            off: "-",
            typingText: "Choose a navigation mode to continue..."
        },
        controls: {
            turnAudioOff: "Turn audio off",
            turnAudioOn: "Turn audio on",
            information: "Information"
        },
        workplaces: {
            meetcraft: {
                companyName: "Meetcraft Editor",
                role: "Creator & Lead Developer",
                projects: {
                    meetcraft: {
                        title: "Meetcraft Editor",
                        description: "Web-based Babylon.js Editor",
                        content: [
                            "Meetcraft is a web-based 3D editor powered by Babylon.js that allows real-time collaborative creation of interactive scenes for the web.",
                            "It started as my personal project to explore AI-powered creative tools, and has since evolved into a comprehensive platform. The stack is React and TypeScript on the frontend, Babylon.js for rendering, and Supabase handling authentication, real-time sync, and secure cloud storage.",
                            "Cloud and Local Storage",
                            "Projects can live in the cloud via Supabase or entirely offline using the browser's File System Access API. Work on local folders like a desktop app, or sync assets to cloud storage for team access.",
                            "Real-Time Collaboration",
                            "Create teams with role-based permissions and collaborate in real-time. Multiple users can edit the same scene simultaneously—selections, transforms, and changes sync instantly with presence indicators.",
                            "3D Editing Environment",
                            "Full scene authoring with meshes, PBR materials, lights, cameras, physics, animations, and spatial audio. Includes a play mode to test scenes with physics and scripted behaviors without leaving the editor.",
                            "Integrated UI Editor",
                            "Design HTML/CSS interfaces directly in the 3D environment and anchor them to scene objects. Includes a style editor, animation support, and responsive breakpoints for building interactive 3D web experiences.",
                            "AI-Powered Scripting",
                            "Monaco-powered code editor with integrated AI assistance. Describe what you want in natural language—the AI generates executable scripts with full context of your scene and the Meetcraft API.",
                            "Addon Architecture",
                            "Extensible API inspired by Blender's addon system. Addons can register menus, inject panels, subscribe to events, and access scene, physics, animation, audio, and history systems with sandboxed permissions.",
                            "Export to GitHub",
                            "Export projects directly to GitHub as ready-to-deploy web applications. Includes snapshot-based versioning for saving and reverting scene states—a complete pipeline from creation to publication."
                        ]
                    }
                }
            },
            meetkai: {
                companyName: "Meetkai Inc.",
                role: "3D Designer and Tools Developer",
                projects: {
                    thanksgiving: {
                        title: "Survive Thanksgiving",
                        description: "Gamified movie experience",
                        content: [
                            "Thanksgiving is a Sony horror film featuring a masked killer on the loose during the holiday. Sony and MeetKai partnered to create an interactive web experience to help market the movie worldwide.",
                            "I worked on key 3D elements: the Basement scene (the movie's climatic finale), all in-game cutscene videos, and an optimized 3D crowd system for the external areas.",
                            "The Basement",
                            "The basement is where the movie's final scene takes place, a long dinner table set for a twisted Thanksgiving feast. I designed and built this entire environment, from the eerie table settings to the dim lighting that sets the horror mood.",
                            "External Crowds",
                            "The outdoor areas needed a living, breathing crowd to sell the Black Friday chaos. I created an optimized 3D crowd system that runs smoothly even on mobile, achieved through armature aggregation and animation track merging to keep draw calls minimal while maintaining natural movement.",
                            "Cutscenes",
                            "Throughout the game, cutscene videos play when the player encounters the killer. I created all of these sequences in short and intense moments that tie the gameplay to the film's horror atmosphere. Here are a few examples:"
                        ]
                    },
                    byd: {
                        title: "BYD Virtual Dealership",
                        description: "3D web visualizer for BYD",
                        content: [
                            "The BYD Virtual Dealership brings real showrooms into an interactive 3D web experience. Users can explore dealerships in Los Angeles, Singapore, the Philippines, and virtual test tracks—touring vehicles, customizing colors, and even taking virtual test drives, all from their browser.",
                            "My Role & The BYD Seagull",
                            "I played a major role in the 3D side of this project, particularly with vehicle modeling and optimization. We typically received existing car models that needed optimization with proper textures, materials, and animations for web delivery.",
                            "For the BYD Seagull specifically, we didn't have an existing model—so I recreated the entire car from scratch. This became one of my favorite pieces of work: I modeled everything from the exterior body, interior cabin, materials, to all interactive animations.",
                            "The entire interior was modeled with attention to detail—seats, dashboard, steering wheel, door panels, and all trim pieces—to create an immersive experience when users explore the car from inside.",
                            "Philippines Dealership",
                            "I was also the 3D lead for the Philippines Dealership digital twin at Quezon Avenue. This involved recreating the entire dealership architecture and showroom environment where all the car models are showcased."
                        ]
                    },
                    pistons: {
                        title: "Pistons Virtual Store",
                        description: "Virtual merchandise store",
                        content: [
                            "The Pistons Virtual Store is an interactive 3D web experience for Detroit Pistons official merchandise. Users can explore jerseys, hoodies, headwear, and gifts across three immersive environments.",
                            "I was the 3D lead on this project and handled most of the UX design decisions as well. I created all three environments optimized for real-time web rendering. Beyond the environments, I also created various interactive assets used throughout the experience.",
                            "The Virtual Store",
                            "The main showroom features product displays organized by category—jerseys showcased on mannequins, headwear on shelving units, and gift items arranged throughout the space.",
                            "Lighting was key to selling the atmosphere. Carefully baked lightmaps bring out the product displays and make the space feel inviting.",
                            "The Court",
                            "The basketball court features a full arena complete with an animated crowd. I used a lightweight technique where the crowd is rendered as flat planes with atlas textures that swap between animation frames, creating the illusion of a cheering 3D audience while keeping performance optimized for the web.",
                            "The Locker Room",
                            "The locker room was designed as a virtual event space where Pistons players could appear on screen during scheduled meet-and-greet events. Because of this, it's more spacious than a typical locker room, adapted to accommodate virtual gatherings with fans.",
                            "The environment showcases the team's championship legacy with banners, player lockers, and an immersive atmosphere."
                        ]
                    },
                    meetkaisuite: {
                        title: "MeetKai Suite (Blender Addon)",
                        description: "Blender addon for VR scene exports",
                        content: [
                            "I developed MeetKai Suite out of my own initiative after recognizing the team could benefit from automation tools that simply did not exist at the time. I joined MeetKai in 2023 and by the end of that year, after absorbing how things were done, I started building these tools.",
                            "Since then, it has fundamentally transformed our 3D asset creation pipeline for web. The addon is now a standard tool within the team and is used extensively throughout our 3D production process.",
                            "Material Aggregator & Object Remesher",
                            "Merges multiple materials into a single optimized texture set, with integrated geometry remeshing. One-click \"Apply and Aggregate\" finalizes mesh and textures together, drastically reducing draw calls.",
                            "Auto Bake",
                            "Streamlines texture baking with preset workflows. Supports color, roughness, metalness, and normal maps with direct or indirect contributions—all configurable per channel.",
                            "Multi-Format Exporter",
                            "Export directly to GLB, separate GLTF, or Splat format with mesh, camera, and light filtering, as well as custom naming conventions.",
                            "Optimizations",
                            "Includes batch object name cleanup, texture resizing, lightmap packing, armature aggregation, and animation optimizer—essential housekeeping for web-ready assets."
                        ]
                    }
                }
            },
            morethanreal: {
                companyName: "More Than Real",
                role: "3D Designer for AR",
                projects: {}
            },
            balthamaker: {
                companyName: "Baltha Maker",
                role: "3D Printing Designer and Founder",
                projects: {}
            },
            ufsc: {
                companyName: "UFSC",
                role: "Product Design Undergraduate",
                projects: {}
            }
        },
        connect: {
            title: "Let's connect!",
            email: "Email",
            copy: "Copy",
            copied: "Copied!",
            send: "Send",
            linkedin: "LinkedIn",
            instagram: "Instagram",
            whatsapp: "WhatsApp"
        },
        chat: {
            headerTitle: "Artur Balthazar",
            headerSubtitle: "3D Designer & Creative Technologist",
            placeholder: "Type your message here...",
            errorMessage: "Oops! Something went wrong.",
            suggestion1: "Show me a random project",
            suggestion2: "Tell me more about you and your skills",
            suggestion3: "How can I get in touch with you?"
        },
        common: {
            previous: "Previous",
            next: "Next",
            close: "Close",
            open: "Open",
            goToModel: "Go to model",
            skillsWith: "Skills with:"
        }
    },

    PT: {
        header: {
            welcomeText: "Bem-vindo ao Baltha Studio! Sou Artur Balthazar, seu desenvolvedor e designer 3D profissional 🚀"
        },
        menu: {
            welcome: "Início",
            meetcraft: "Meetcraft",
            meetkai: "MeetKai",
            morethanreal: "More Than\nReal",
            balthamaker: "Baltha\nMaker",
            ufsc: "UFSC",
            letsConnect: "Vamos\nConectar!"
        },
        state3: {
            navigationTitle: "Navegação",
            guided: "Guiado",
            free: "Livre",
            audioTitle: "Áudio",
            on: "-",
            off: "-",
            typingText: "Escolha um modo de navegação para continuar..."
        },
        controls: {
            turnAudioOff: "Desligar áudio",
            turnAudioOn: "Ligar áudio",
            information: "Informações"
        },
        workplaces: {
            meetcraft: {
                companyName: "Meetcraft Editor",
                role: "Criador & Desenvolvedor Principal",
                projects: {
                    meetcraft: {
                        title: "Meetcraft Editor",
                        description: "Editor 3D baseado em Babylon.js",
                        content: [
                            "Meetcraft é um editor 3D baseado na web, alimentado por Babylon.js, que permite a criação colaborativa em tempo real de cenas interativas para a web.",
                            "Começou como meu projeto pessoal para explorar ferramentas criativas com IA, e desde então evoluiu para uma plataforma completa. A stack é React e TypeScript no frontend, Babylon.js para renderização, e Supabase cuidando de autenticação, sincronização em tempo real e armazenamento seguro na nuvem.",
                            "Armazenamento Local e na Nuvem",
                            "Projetos podem viver na nuvem via Supabase ou totalmente offline usando a API File System Access do navegador. Trabalhe em pastas locais como um app desktop, ou sincronize assets na nuvem para acesso da equipe.",
                            "Colaboração em Tempo Real",
                            "Crie equipes com permissões baseadas em papéis e colabore em tempo real. Múltiplos usuários podem editar a mesma cena simultaneamente—seleções, transformações e mudanças sincronizam instantaneamente com indicadores de presença.",
                            "Ambiente de Edição 3D",
                            "Autoria completa de cenas com meshes, materiais PBR, luzes, câmeras, física, animações e áudio espacial. Inclui um modo de reprodução para testar cenas com física e comportamentos scriptados sem sair do editor.",
                            "Editor de UI Integrado",
                            "Projete interfaces HTML/CSS diretamente no ambiente 3D e ancore-as a objetos da cena. Inclui editor de estilos, suporte a animações e breakpoints responsivos para construir experiências web 3D interativas.",
                            "Scripting com IA",
                            "Editor de código Monaco com assistência de IA integrada. Descreva o que você quer em linguagem natural—a IA gera scripts executáveis com contexto completo da sua cena e da API do Meetcraft.",
                            "Arquitetura de Addons",
                            "API extensível inspirada no sistema de addons do Blender. Addons podem registrar menus, injetar painéis, se inscrever em eventos e acessar sistemas de cena, física, animação, áudio e histórico com permissões isoladas.",
                            "Exportar para GitHub",
                            "Exporte projetos diretamente para o GitHub como aplicações web prontas para deploy. Inclui versionamento baseado em snapshots para salvar e reverter estados de cena—um pipeline completo da criação à publicação."
                        ]
                    }
                }
            },
            meetkai: {
                companyName: "Meetkai Inc.",
                role: "Designer 3D e Desenvolvedor de Ferramentas",
                projects: {
                    thanksgiving: {
                        title: "Survive Thanksgiving",
                        description: "Experiência cinematográfica gamificada",
                        content: [
                            "Thanksgiving é um filme de terror da Sony com um assassino mascarado à solta durante o feriado. A Sony e a MeetKai se uniram para criar uma experiência web interativa para ajudar a promover o filme mundialmente.",
                            "Trabalhei em elementos 3D chave: a cena do Porão (o clímax final do filme), todos os vídeos de cutscenes do jogo, e um sistema otimizado de multidão 3D para as áreas externas.",
                            "O Porão",
                            "O porão é onde a cena final do filme acontece, uma longa mesa de jantar preparada para uma festa de Thanksgiving macabra. Eu projetei e construí todo esse ambiente, desde os cenários assustadores da mesa até a iluminação sombria que cria o clima de terror.",
                            "Multidões Externas",
                            "As áreas externas precisavam de uma multidão viva e pulsante para vender o caos da Black Friday. Criei um sistema de multidão 3D otimizado que roda suavemente mesmo em dispositivos móveis, alcançado através de agregação de armaduras e mesclagem de faixas de animação para manter os draw calls mínimos mantendo movimentos naturais.",
                            "Cutscenes",
                            "Ao longo do jogo, vídeos de cutscenes tocam quando o jogador encontra o assassino. Criei todas essas sequências em momentos curtos e intensos que conectam a jogabilidade à atmosfera de terror do filme. Aqui estão alguns exemplos:"
                        ]
                    },
                    byd: {
                        title: "Concessionária Virtual BYD",
                        description: "Visualizador web 3D para BYD",
                        content: [
                            "A Concessionária Virtual BYD traz showrooms reais para uma experiência web 3D interativa. Os usuários podem explorar concessionárias em Los Angeles, Singapura, Filipinas e pistas de teste virtuais—visitando veículos, personalizando cores e até fazendo test drives virtuais, tudo no navegador.",
                            "Meu Papel e o BYD Seagull",
                            "Tive um papel importante no lado 3D deste projeto, particularmente na modelagem e otimização de veículos. Normalmente recebíamos modelos de carros existentes que precisavam de otimização com texturas, materiais e animações adequadas para entrega web.",
                            "Para o BYD Seagull especificamente, não tínhamos um modelo existente—então recriei o carro inteiro do zero. Este se tornou um dos meus trabalhos favoritos: modelei tudo, desde a carroceria externa, cabine interna, materiais, até todas as animações interativas.",
                            "O interior inteiro foi modelado com atenção aos detalhes—bancos, painel, volante, painéis das portas e todos os acabamentos—para criar uma experiência imersiva quando os usuários exploram o carro por dentro.",
                            "Concessionária Filipinas",
                            "Também fui o líder 3D para o gêmeo digital da Concessionária das Filipinas na Avenida Quezon. Isso envolveu recriar toda a arquitetura da concessionária e o ambiente do showroom onde todos os modelos de carros são expostos."
                        ]
                    },
                    pistons: {
                        title: "Loja Virtual Pistons",
                        description: "Loja virtual de merchandise",
                        content: [
                            "A Loja Virtual Pistons é uma experiência web 3D interativa para merchandise oficial do Detroit Pistons. Os usuários podem explorar camisetas, moletons, bonés e presentes em três ambientes imersivos.",
                            "Fui o líder 3D neste projeto e também tomei a maioria das decisões de UX design. Criei todos os três ambientes otimizados para renderização web em tempo real. Além dos ambientes, também criei diversos assets interativos usados ao longo da experiência.",
                            "A Loja Virtual",
                            "O showroom principal apresenta displays de produtos organizados por categoria—camisetas expostas em manequins, bonés em prateleiras, e itens de presente distribuídos pelo espaço.",
                            "A iluminação foi crucial para criar a atmosfera. Lightmaps cuidadosamente bakeados destacam os displays de produtos e fazem o espaço parecer convidativo.",
                            "A Quadra",
                            "A quadra de basquete apresenta uma arena completa com uma multidão animada. Usei uma técnica leve onde a multidão é renderizada como planos achatados com texturas atlas que alternam entre frames de animação, criando a ilusão de uma plateia 3D torcendo enquanto mantém a performance otimizada para web.",
                            "O Vestiário",
                            "O vestiário foi projetado como um espaço de eventos virtuais onde jogadores dos Pistons poderiam aparecer na tela durante eventos de meet-and-greet agendados. Por isso, é mais espaçoso que um vestiário típico, adaptado para acomodar encontros virtuais com fãs.",
                            "O ambiente mostra o legado de campeonatos do time com banners, armários de jogadores, e uma atmosfera imersiva."
                        ]
                    },
                    meetkaisuite: {
                        title: "MeetKai Suite (Addon Blender)",
                        description: "Addon Blender para exportação de cenas VR",
                        content: [
                            "Desenvolvi o MeetKai Suite por iniciativa própria após reconhecer que a equipe poderia se beneficiar de ferramentas de automação que simplesmente não existiam na época. Entrei na MeetKai em 2023 e até o final daquele ano, após absorver como as coisas eram feitas, comecei a construir essas ferramentas.",
                            "Desde então, transformou fundamentalmente nosso pipeline de criação de assets 3D para web. O addon agora é uma ferramenta padrão dentro da equipe e é usado extensivamente em todo nosso processo de produção 3D.",
                            "Agregador de Materiais e Remesher de Objetos",
                            "Mescla múltiplos materiais em um único conjunto de texturas otimizado, com remeshing de geometria integrado. Um clique em \"Apply and Aggregate\" finaliza mesh e texturas juntos, reduzindo drasticamente os draw calls.",
                            "Auto Bake",
                            "Simplifica o baking de texturas com workflows predefinidos. Suporta mapas de cor, roughness, metalness e normais com contribuições diretas ou indiretas—todos configuráveis por canal.",
                            "Exportador Multi-Formato",
                            "Exporte diretamente para GLB, GLTF separado, ou formato Splat com filtragem de mesh, câmera e luz, assim como convenções de nomenclatura personalizadas.",
                            "Otimizações",
                            "Inclui limpeza em lote de nomes de objetos, redimensionamento de texturas, empacotamento de lightmaps, agregação de armaduras, e otimizador de animações—manutenção essencial para assets prontos para web."
                        ]
                    }
                }
            },
            morethanreal: {
                companyName: "More Than Real",
                role: "Designer 3D para AR",
                projects: {}
            },
            balthamaker: {
                companyName: "Baltha Maker",
                role: "Designer de Impressão 3D e Fundador",
                projects: {}
            },
            ufsc: {
                companyName: "UFSC",
                role: "Graduando em Design de Produto",
                projects: {}
            }
        },
        connect: {
            title: "Vamos conectar!",
            email: "E-mail",
            copy: "Copiar",
            copied: "Copiado!",
            send: "Enviar",
            linkedin: "LinkedIn",
            instagram: "Instagram",
            whatsapp: "WhatsApp"
        },
        chat: {
            headerTitle: "Artur Balthazar",
            headerSubtitle: "Tecnólogo Criativo & Artista 3D",
            placeholder: "Digite sua mensagem aqui...",
            errorMessage: "Ops! Algo deu errado.",
            suggestion1: "Me conte sobre você e seu trabalho",
            suggestion2: "Em quais projetos você já trabalhou?",
            suggestion3: "Como posso entrar em contato?"
        },
        common: {
            previous: "Anterior",
            next: "Próximo",
            close: "Fechar",
            open: "Abrir",
            goToModel: "Ir para modelo",
            skillsWith: "Habilidades com:"
        }
    },

    ES: {
        header: {
            welcomeText: "¡Bienvenido a Baltha Studio! Soy Artur Balthazar, tu desarrollador y diseñador 3D profesional 🚀"
        },
        menu: {
            welcome: "Inicio",
            meetcraft: "Meetcraft",
            meetkai: "MeetKai",
            morethanreal: "More Than\nReal",
            balthamaker: "Baltha\nMaker",
            ufsc: "UFSC",
            letsConnect: "¡Conectemos!"
        },
        state3: {
            navigationTitle: "Navegación",
            guided: "Guiado",
            free: "Libre",
            audioTitle: "Audio",
            on: "-",
            off: "-",
            typingText: "Elige un modo de navegación para continuar..."
        },
        controls: {
            turnAudioOff: "Apagar audio",
            turnAudioOn: "Encender audio",
            information: "Información"
        },
        workplaces: {
            meetcraft: { companyName: "Meetcraft Editor", role: "Creador y Desarrollador Principal", projects: {} },
            meetkai: { companyName: "Meetkai Inc.", role: "Diseñador 3D y Desarrollador de Herramientas", projects: {} },
            morethanreal: { companyName: "More Than Real", role: "Diseñador 3D para AR", projects: {} },
            balthamaker: { companyName: "Baltha Maker", role: "Diseñador de Impresión 3D y Fundador", projects: {} },
            ufsc: { companyName: "UFSC", role: "Estudiante de Diseño de Producto", projects: {} }
        },
        connect: {
            title: "¡Conectemos!",
            email: "Correo",
            copy: "Copiar",
            copied: "¡Copiado!",
            send: "Enviar",
            linkedin: "LinkedIn",
            instagram: "Instagram",
            whatsapp: "WhatsApp"
        },
        chat: {
            headerTitle: "Artur Balthazar",
            headerSubtitle: "Tecnólogo Creativo & Artista 3D",
            placeholder: "Escribe tu mensaje aquí...",
            errorMessage: "¡Ups! Algo salió mal.",
            suggestion1: "Cuéntame sobre ti y tu trabajo",
            suggestion2: "¿En qué proyectos has trabajado?",
            suggestion3: "¿Cómo puedo ponerme en contacto?"
        },
        common: {
            previous: "Anterior",
            next: "Siguiente",
            close: "Cerrar",
            open: "Abrir",
            goToModel: "Ir al modelo",
            skillsWith: "Habilidades con:"
        }
    },

    DE: {
        header: {
            welcomeText: "Willkommen bei Baltha Studio! Ich bin Artur Balthazar, dein professioneller 3D-Entwickler und Designer 🚀"
        },
        menu: {
            welcome: "Willkommen",
            meetcraft: "Meetcraft",
            meetkai: "MeetKai",
            morethanreal: "More Than\nReal",
            balthamaker: "Baltha\nMaker",
            ufsc: "UFSC",
            letsConnect: "Lass uns\nvernetzen!"
        },
        state3: {
            navigationTitle: "Navigation",
            guided: "Geführt",
            free: "Frei",
            audioTitle: "Audio",
            on: "-",
            off: "-",
            typingText: "Wähle einen Navigationsmodus, um fortzufahren..."
        },
        controls: {
            turnAudioOff: "Audio ausschalten",
            turnAudioOn: "Audio einschalten",
            information: "Information"
        },
        workplaces: {
            meetcraft: { companyName: "Meetcraft Editor", role: "Schöpfer und Hauptentwickler", projects: {} },
            meetkai: { companyName: "Meetkai Inc.", role: "3D-Designer und Tools-Entwickler", projects: {} },
            morethanreal: { companyName: "More Than Real", role: "3D-Designer für AR", projects: {} },
            balthamaker: { companyName: "Baltha Maker", role: "3D-Druck-Designer und Gründer", projects: {} },
            ufsc: { companyName: "UFSC", role: "Produktdesign-Student", projects: {} }
        },
        connect: {
            title: "Lass uns vernetzen!",
            email: "E-Mail",
            copy: "Kopieren",
            copied: "Kopiert!",
            send: "Senden",
            linkedin: "LinkedIn",
            instagram: "Instagram",
            whatsapp: "WhatsApp"
        },
        chat: {
            headerTitle: "Artur Balthazar",
            headerSubtitle: "Kreativtechnologe & 3D-Künstler",
            placeholder: "Schreiben Sie Ihre Nachricht hier...",
            errorMessage: "Ups! Etwas ist schief gelaufen.",
            suggestion1: "Erzähl mir über dich und deine Arbeit",
            suggestion2: "An welchen Projekten hast du gearbeitet?",
            suggestion3: "Wie kann ich dich kontaktieren?"
        },
        common: {
            previous: "Zurück",
            next: "Weiter",
            close: "Schließen",
            open: "Öffnen",
            goToModel: "Zum Modell",
            skillsWith: "Kenntnisse mit:"
        }
    },

    FR: {
        header: {
            welcomeText: "Bienvenue chez Baltha Studio! Je suis Artur Balthazar, votre développeur et designer 3D professionnel 🚀"
        },
        menu: {
            welcome: "Accueil",
            meetcraft: "Meetcraft",
            meetkai: "MeetKai",
            morethanreal: "More Than\nReal",
            balthamaker: "Baltha\nMaker",
            ufsc: "UFSC",
            letsConnect: "Connectons-\nnous!"
        },
        state3: {
            navigationTitle: "Navigation",
            guided: "Guidé",
            free: "Libre",
            audioTitle: "Audio",
            on: "-",
            off: "-",
            typingText: "Choisissez un mode de navigation pour continuer..."
        },
        controls: {
            turnAudioOff: "Désactiver l'audio",
            turnAudioOn: "Activer l'audio",
            information: "Informations"
        },
        workplaces: {
            meetcraft: { companyName: "Meetcraft Editor", role: "Créateur et Développeur Principal", projects: {} },
            meetkai: { companyName: "Meetkai Inc.", role: "Designer 3D et Développeur d'Outils", projects: {} },
            morethanreal: { companyName: "More Than Real", role: "Designer 3D pour AR", projects: {} },
            balthamaker: { companyName: "Baltha Maker", role: "Designer Impression 3D et Fondateur", projects: {} },
            ufsc: { companyName: "UFSC", role: "Étudiant en Design de Produit", projects: {} }
        },
        connect: {
            title: "Connectons-nous!",
            email: "E-mail",
            copy: "Copier",
            copied: "Copié!",
            send: "Envoyer",
            linkedin: "LinkedIn",
            instagram: "Instagram",
            whatsapp: "WhatsApp"
        },
        chat: {
            headerTitle: "Artur Balthazar",
            headerSubtitle: "Technologue Créatif & Artiste 3D",
            placeholder: "Tapez votre message ici...",
            errorMessage: "Oups! Quelque chose s'est mal passé.",
            suggestion1: "Parlez-moi de vous et de votre travail",
            suggestion2: "Sur quels projets avez-vous travaillé?",
            suggestion3: "Comment puis-je vous contacter?"
        },
        common: {
            previous: "Précédent",
            next: "Suivant",
            close: "Fermer",
            open: "Ouvrir",
            goToModel: "Aller au modèle",
            skillsWith: "Compétences avec:"
        }
    },

    ZH: {
        header: {
            welcomeText: "欢迎来到Baltha Studio！我是Artur Balthazar，您的专业3D开发者和设计师 🚀"
        },
        menu: {
            welcome: "欢迎",
            meetcraft: "Meetcraft",
            meetkai: "MeetKai",
            morethanreal: "More Than\nReal",
            balthamaker: "Baltha\nMaker",
            ufsc: "UFSC",
            letsConnect: "联系\n我!"
        },
        state3: {
            navigationTitle: "导航",
            guided: "引导",
            free: "自由",
            audioTitle: "音频",
            on: "-",
            off: "-",
            typingText: "选择导航模式以继续..."
        },
        controls: {
            turnAudioOff: "关闭音频",
            turnAudioOn: "开启音频",
            information: "信息"
        },
        workplaces: {
            meetcraft: { companyName: "Meetcraft Editor", role: "创作者和主要开发者", projects: {} },
            meetkai: { companyName: "Meetkai Inc.", role: "3D设计师和工具开发者", projects: {} },
            morethanreal: { companyName: "More Than Real", role: "AR 3D设计师", projects: {} },
            balthamaker: { companyName: "Baltha Maker", role: "3D打印设计师和创始人", projects: {} },
            ufsc: { companyName: "UFSC", role: "产品设计学生", projects: {} }
        },
        connect: {
            title: "联系我！",
            email: "邮箱",
            copy: "复制",
            copied: "已复制！",
            send: "发送",
            linkedin: "LinkedIn",
            instagram: "Instagram",
            whatsapp: "WhatsApp"
        },
        chat: {
            headerTitle: "Artur Balthazar",
            headerSubtitle: "创意技术专家 & 3D艺术家",
            placeholder: "在这里输入您的消息...",
            errorMessage: "糟糕！出了点问题。",
            suggestion1: "介绍一下你自己和你的工作",
            suggestion2: "你参与过哪些项目?",
            suggestion3: "我如何联系你?"
        },
        common: {
            previous: "上一个",
            next: "下一个",
            close: "关闭",
            open: "打开",
            goToModel: "前往模型",
            skillsWith: "技能:"
        }
    }
};

// Helper to get translation by language code
export function getTranslations(languageCode: LanguageCode): TranslationKeys {
    return translations[languageCode] || translations.EN;
}
