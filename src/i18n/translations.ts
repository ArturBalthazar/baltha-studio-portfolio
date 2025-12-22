/**
 * Internationalization (i18n) System for Baltha Studio
 * 
 * This file contains all translations for the website.
 * Brand names like "Baltha Studio", "Musecraft", and "Petwheels" should NOT be translated.
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
        carCustomizer: string;
        musecraftEditor: string;
        digitalDioramas: string;
        petwheels: string;
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

    // GEELY Customizer (State 4)
    geely: {
        title: string;
        subtitle: string;
        bodyColor: string;
        version: string;
        interiorView: string;
        exteriorView: string;
        tapToSeeMore: string;
    };

    // Musecraft Panel (State 5)
    musecraft: {
        title: string;
        subtitle: string;
        text1: string;
        text2: string;
        text3: string;
    };

    // Dioramas Panel (State 6)
    dioramas: {
        subtitle: string;
        subtitleMobile: string;
        // Dynamic titles are handled separately
        florianopolisMuseum: {
            title: string;
            text1: string;
            text2: string;
        };
        santaCatarinaIsland: {
            title: string;
            text1: string;
            text2: string;
        };
        catarinenseMuseum: {
            title: string;
            text1: string;
            text2: string;
        };
    };

    // Petwheels Panel (State 7)
    petwheels: {
        title: string;
        subtitle: string;
        text1: string;
        text2: string;
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
    };
}

// All translations organized by language
export const translations: Record<LanguageCode, TranslationKeys> = {
    EN: {
        header: {
            welcomeText: "We design interactive web experiences tailored to your brand's essence and accessible to all."
        },
        menu: {
            welcome: "Welcome",
            carCustomizer: "Car\nCustomizer",
            musecraftEditor: "Musecraft\nEditor",
            digitalDioramas: "Digital\nDioramas",
            petwheels: "Petwheels",
            letsConnect: "Let's\nConnect!"
        },
        state3: {
            navigationTitle: "Navigation",
            guided: "Guided",
            free: "Free",
            audioTitle: "Audio",
            on: "-",
            off: "-",
            typingText: "Welcome to Baltha Studio! Choose a navigation mode to continue..."
        },
        controls: {
            turnAudioOff: "Turn audio off",
            turnAudioOn: "Turn audio on",
            information: "Information"
        },
        geely: {
            title: "GEELY Customizer",
            subtitle: "We create everything from 3D car configurators to test-drive tracks, virtual showrooms and much more.",
            bodyColor: "Body Color",
            version: "Version",
            interiorView: "Interior view",
            exteriorView: "Exterior view",
            tapToSeeMore: "Tap to see more"
        },
        musecraft: {
            title: "Musecraft Editor",
            subtitle: "Create interactive 3D scenes for the web in our collaborative web editor.",
            text1: "A powerful web-based 3D scene editor designed to create interactive, real-time experiences directly for the browser.",
            text2: "Musecraft allows designers, developers, and studios to fully assemble 3D scenes, define interactions, manage assets, and deploy experiences without the friction of traditional game engines or heavyweight pipelines.",
            text3: "Built on modern web technologies and powered by AI tools, it bridges design, development and 3D art into a single low-code workflow."
        },
        dioramas: {
            subtitle: "In 2018, Baltha Studio started as a 3D printing business, and then moved to the digital space.",
            subtitleMobile: "In 2018, Baltha Studio started as a 3D printing business before moving to the digital space.",
            florianopolisMuseum: {
                title: "Florianópolis Museum",
                text1: "We partnered with SESC to build a 3D printable scale model of the Florianópolis Museum that was about to open in the historic center of city.",
                text2: "This is a 100cm x 85cm x 60cm model placed in the entrance room of the museum. Entirely covered with epoxy resin, it's intended to last for several years as a tactile model."
            },
            santaCatarinaIsland: {
                title: "Santa Catarina Island",
                text1: "Also as part of the Florianópolis Museum project with SESC, we created this 3m x 1m scale model of the Santa Catarina Island where the museum lives.",
                text2: "This is also a tactile model of the real island relief, with a vertical scale factor of 2.5x, and and entire room dedicated for it."
            },
            catarinenseMuseum: {
                title: "Santa Catarina School Museum",
                text1: "Also an important building of the historic center of Florianópolis is the Santa Catarina School, which later became not only a museum, but a center for creativity and innovation with the CoCreation Lab, a startup incubator coworking space.",
                text2: "Following the previous trend, we were also contacted to make a 3D printable scale model of the building."
            }
        },
        petwheels: {
            title: "Petwheels",
            subtitle: "A patented, fully 3D printable parametric wheelchair for dogs.",
            text1: "A customizable parametric wheelchair for dogs that is fully 3D printable, Petwheels was born from the capstone project of Artur Balthazar, product designer and creative director at Baltha Studio.",
            text2: "The product differs from every other in the market due to its flexible lateral bars and was patented as such. It quickly gained attention from the Brazilian media and some units were sold."
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
            headerSubtitle: "Director at Baltha Studio",
            placeholder: "Type your message here...",
            errorMessage: "Oops! Something went wrong.",
            suggestion1: "What is Baltha Studio specialized in?",
            suggestion2: "Which projects have you worked on?",
            suggestion3: "How do I get in touch or start a project?"
        },
        common: {
            previous: "Previous",
            next: "Next",
            close: "Close",
            open: "Open",
            goToModel: "Go to model"
        }
    },

    PT: {
        header: {
            welcomeText: "Criamos experiências web interativas com a essência da sua marca e acessíveis a todos."
        },
        menu: {
            welcome: "Início",
            carCustomizer: "Configurador\nde Carros",
            musecraftEditor: "Editor\nMusecraft",
            digitalDioramas: "Dioramas\nDigitais",
            petwheels: "Petwheels",
            letsConnect: "Vamos\nConectar!"
        },
        state3: {
            navigationTitle: "Navegação",
            guided: "Guiado",
            free: "Livre",
            audioTitle: "Áudio",
            on: "-",
            off: "-",
            typingText: "Bem-vindo a Baltha Studio! Escolha um modo de navegação para continuar..."
        },
        controls: {
            turnAudioOff: "Desligar áudio",
            turnAudioOn: "Ligar áudio",
            information: "Informações"
        },
        geely: {
            title: "Configurador GEELY",
            subtitle: "Criamos desde configuradores 3D de carros a pistas de test-drive, showrooms virtuais e muito mais.",
            bodyColor: "Cor",
            version: "Versão",
            interiorView: "Vista interior",
            exteriorView: "Vista exterior",
            tapToSeeMore: "Toque para ver mais"
        },
        musecraft: {
            title: "Editor Musecraft",
            subtitle: "Crie cenas 3D interativas para a web em nosso editor colaborativo.",
            text1: "Um poderoso editor de cenas 3D baseado na web, projetado para criar experiências interativas em tempo real diretamente para o navegador.",
            text2: "Musecraft permite que designers, desenvolvedores e estúdios montem cenas 3D completas, definam interações, gerenciem assets e implementem experiências sem a fricção de engines de jogos tradicionais ou pipelines pesados.",
            text3: "Construído em tecnologias web modernas e alimentado por ferramentas de IA, ele conecta design, desenvolvimento e arte 3D em um único fluxo de trabalho low-code."
        },
        dioramas: {
            subtitle: "Em 2018, Baltha Studio começou como um negócio de impressão 3D e depois migrou para o espaço digital.",
            subtitleMobile: "Em 2018, Baltha Studio começou como um negócio de impressão 3D antes de migrar para o espaço digital.",
            florianopolisMuseum: {
                title: "Museu de Florianópolis",
                text1: "Fizemos parceria com o SESC para construir uma maquete imprimível em 3D do Museu de Florianópolis que estava prestes a abrir no centro histórico da cidade.",
                text2: "Esta é uma maquete de 100cm x 85cm x 60cm colocada na sala de entrada do museu. Totalmente coberta com resina epóxi, foi projetada para durar vários anos como modelo tátil."
            },
            santaCatarinaIsland: {
                title: "Ilha de Santa Catarina",
                text1: "Também como parte do projeto do Museu de Florianópolis com o SESC, criamos esta maquete de 3m x 1m da Ilha de Santa Catarina onde o museu está localizado.",
                text2: "Este também é um modelo tátil do relevo real da ilha, com um fator de escala vertical de 2,5x e uma sala inteira dedicada a ele."
            },
            catarinenseMuseum: {
                title: "Museu da Escola Catarinense",
                text1: "Também um edifício importante do centro histórico de Florianópolis é a Escola Catarinense, que mais tarde se tornou não apenas um museu, mas um centro de criatividade e inovação com o CoCreation Lab, um espaço de coworking incubador de startups.",
                text2: "Seguindo a tendência anterior, também fomos contatados para fazer uma maquete imprimível em 3D do edifício."
            }
        },
        petwheels: {
            title: "Petwheels",
            subtitle: "Uma cadeira de rodas paramétrica patenteada e totalmente imprimível em 3D para cães.",
            text1: "Uma cadeira de rodas paramétrica personalizável para cães que é totalmente imprimível em 3D, Petwheels nasceu do projeto de conclusão de curso de Artur Balthazar, designer de produto e diretor criativo do Baltha Studio.",
            text2: "O produto se diferencia de todos os outros no mercado devido às suas barras laterais flexíveis e foi patenteado como tal. Rapidamente ganhou atenção da mídia brasileira e algumas unidades foram vendidas."
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
            headerSubtitle: "Diretor na Baltha Studio",
            placeholder: "Digite sua mensagem aqui...",
            errorMessage: "Ops! Algo deu errado.",
            suggestion1: "Qual a especialidade da Baltha Studio?",
            suggestion2: "Em quais projetos vocês já trabalharam?",
            suggestion3: "Como entro em contato ou inicio um projeto?"
        },
        common: {
            previous: "Anterior",
            next: "Próximo",
            close: "Fechar",
            open: "Abrir",
            goToModel: "Ir para modelo"
        }
    },

    ES: {
        header: {
            welcomeText: "Diseñamos experiencias web interactivas adaptadas a la esencia de tu marca y accesibles para todos."
        },
        menu: {
            welcome: "Inicio",
            carCustomizer: "Configurador\nde Autos",
            musecraftEditor: "Editor\nMusecraft",
            digitalDioramas: "Dioramas\nDigitales",
            petwheels: "Petwheels",
            letsConnect: "¡Conectemos!"
        },
        state3: {
            navigationTitle: "Navegación",
            guided: "Guiado",
            free: "Libre",
            audioTitle: "Audio",
            on: "-",
            off: "-",
            typingText: "¡Bienvenido a Baltha Studio! Elige un modo de navegación para continuar..."
        },
        controls: {
            turnAudioOff: "Apagar audio",
            turnAudioOn: "Encender audio",
            information: "Información"
        },
        geely: {
            title: "Configurador GEELY",
            subtitle: "Creamos desde configuradores 3D de autos hasta pistas de prueba, salas de exposición virtuales y mucho más.",
            bodyColor: "Color de Carrocería",
            version: "Versión",
            interiorView: "Vista interior",
            exteriorView: "Vista exterior",
            tapToSeeMore: "Toca para ver más"
        },
        musecraft: {
            title: "Editor Musecraft",
            subtitle: "Crea escenas 3D interactivas para la web en nuestro editor colaborativo.",
            text1: "Un potente editor de escenas 3D basado en web diseñado para crear experiencias interactivas en tiempo real directamente para el navegador.",
            text2: "Musecraft permite a diseñadores, desarrolladores y estudios ensamblar completamente escenas 3D, definir interacciones, gestionar assets e implementar experiencias sin la fricción de los motores de juegos tradicionales o pipelines pesados.",
            text3: "Construido con tecnologías web modernas y potenciado por herramientas de IA, conecta diseño, desarrollo y arte 3D en un único flujo de trabajo low-code."
        },
        dioramas: {
            subtitle: "En 2018, Baltha Studio comenzó como un negocio de impresión 3D y luego se trasladó al espacio digital.",
            subtitleMobile: "En 2018, Baltha Studio comenzó como un negocio de impresión 3D antes de trasladarse al espacio digital.",
            florianopolisMuseum: {
                title: "Museo de Florianópolis",
                text1: "Nos asociamos con SESC para construir una maqueta imprimible en 3D del Museo de Florianópolis que estaba a punto de abrir en el centro histórico de la ciudad.",
                text2: "Esta es una maqueta de 100cm x 85cm x 60cm colocada en la sala de entrada del museo. Completamente cubierta con resina epoxi, está diseñada para durar varios años como modelo táctil."
            },
            santaCatarinaIsland: {
                title: "Isla de Santa Catarina",
                text1: "También como parte del proyecto del Museo de Florianópolis con SESC, creamos esta maqueta de 3m x 1m de la Isla de Santa Catarina donde se encuentra el museo.",
                text2: "Este también es un modelo táctil del relieve real de la isla, con un factor de escala vertical de 2.5x, y una sala entera dedicada a él."
            },
            catarinenseMuseum: {
                title: "Museo de la Escuela Catarinense",
                text1: "También un edificio importante del centro histórico de Florianópolis es la Escuela Catarinense, que luego se convirtió no solo en un museo, sino en un centro de creatividad e innovación con el CoCreation Lab, un espacio de coworking incubador de startups.",
                text2: "Siguiendo la tendencia anterior, también nos contactaron para hacer una maqueta imprimible en 3D del edificio."
            }
        },
        petwheels: {
            title: "Petwheels",
            subtitle: "Una silla de ruedas paramétrica patentada y totalmente imprimible en 3D para perros.",
            text1: "Una silla de ruedas paramétrica personalizable para perros que es totalmente imprimible en 3D, Petwheels nació del proyecto de fin de carrera de Artur Balthazar, diseñador de productos y director creativo de Baltha Studio.",
            text2: "El producto se diferencia de todos los demás en el mercado debido a sus barras laterales flexibles y fue patentado como tal. Rápidamente ganó atención de los medios brasileños y se vendieron algunas unidades."
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
            headerSubtitle: "Director de Baltha Studio",
            placeholder: "Escribe tu mensaje aquí...",
            errorMessage: "¡Ups! Algo salió mal.",
            suggestion1: "¿En qué se especializa Baltha Studio?",
            suggestion2: "¿En qué proyectos han trabajado?",
            suggestion3: "¿Cómo me pongo en contacto o inicio un proyecto?"
        },
        common: {
            previous: "Anterior",
            next: "Siguiente",
            close: "Cerrar",
            open: "Abrir",
            goToModel: "Ir al modelo"
        }
    },

    DE: {
        header: {
            welcomeText: "Wir gestalten interaktive Web-Erlebnisse, die auf die Essenz Ihrer Marke zugeschnitten und für alle zugänglich sind."
        },
        menu: {
            welcome: "Willkommen",
            carCustomizer: "Auto\nKonfigurator",
            musecraftEditor: "Musecraft\nEditor",
            digitalDioramas: "Digitale\nDioramen",
            petwheels: "Petwheels",
            letsConnect: "Kontakt\naufnehmen!"
        },
        state3: {
            navigationTitle: "Navigation",
            guided: "Geführt",
            free: "Frei",
            audioTitle: "Audio",
            on: "-",
            off: "-",
            typingText: "Willkommen bei Baltha Studio! Wählen Sie einen Navigationsmodus, um fortzufahren..."
        },
        controls: {
            turnAudioOff: "Audio ausschalten",
            turnAudioOn: "Audio einschalten",
            information: "Information"
        },
        geely: {
            title: "GEELY Konfigurator",
            subtitle: "Wir erstellen alles von 3D-Autokonfiguratoren bis hin zu Testfahrtstrecken, virtuellen Ausstellungsräumen und vielem mehr.",
            bodyColor: "Karosseriefarbe",
            version: "Version",
            interiorView: "Innenansicht",
            exteriorView: "Außenansicht",
            tapToSeeMore: "Tippen für mehr"
        },
        musecraft: {
            title: "Musecraft Editor",
            subtitle: "Erstellen Sie interaktive 3D-Szenen für das Web in unserem kollaborativen Web-Editor.",
            text1: "Ein leistungsstarker webbasierter 3D-Szenen-Editor, der für die Erstellung interaktiver Echtzeit-Erlebnisse direkt für den Browser konzipiert wurde.",
            text2: "Musecraft ermöglicht Designern, Entwicklern und Studios, 3D-Szenen vollständig zusammenzustellen, Interaktionen zu definieren, Assets zu verwalten und Erlebnisse bereitzustellen – ohne die Reibung traditioneller Game-Engines oder schwerfälliger Pipelines.",
            text3: "Aufgebaut auf modernen Web-Technologien und unterstützt von KI-Tools, verbindet es Design, Entwicklung und 3D-Kunst in einem einzigen Low-Code-Workflow."
        },
        dioramas: {
            subtitle: "Im Jahr 2018 begann Baltha Studio als 3D-Druck-Unternehmen und wechselte dann in den digitalen Raum.",
            subtitleMobile: "Im Jahr 2018 begann Baltha Studio als 3D-Druck-Unternehmen, bevor es in den digitalen Raum wechselte.",
            florianopolisMuseum: {
                title: "Florianópolis Museum",
                text1: "Wir haben uns mit SESC zusammengetan, um ein 3D-druckbares Modell des Florianópolis Museums zu bauen, das im historischen Zentrum der Stadt eröffnet werden sollte.",
                text2: "Dies ist ein 100cm x 85cm x 60cm großes Modell, das im Eingangsbereich des Museums platziert wurde. Vollständig mit Epoxidharz überzogen, ist es als taktiles Modell für mehrere Jahre gedacht."
            },
            santaCatarinaIsland: {
                title: "Santa Catarina Insel",
                text1: "Ebenfalls als Teil des Florianópolis Museum-Projekts mit SESC haben wir dieses 3m x 1m große Modell der Santa Catarina Insel erstellt, auf der sich das Museum befindet.",
                text2: "Dies ist ebenfalls ein taktiles Modell des echten Inselreliefs mit einem vertikalen Skalierungsfaktor von 2,5x und einem ganzen Raum, der ihm gewidmet ist."
            },
            catarinenseMuseum: {
                title: "Santa Catarina Schulmuseum",
                text1: "Ein weiteres wichtiges Gebäude im historischen Zentrum von Florianópolis ist die Santa Catarina Schule, die später nicht nur ein Museum wurde, sondern auch ein Zentrum für Kreativität und Innovation mit dem CoCreation Lab, einem Startup-Inkubator-Coworking-Space.",
                text2: "Dem vorherigen Trend folgend wurden wir auch kontaktiert, um ein 3D-druckbares Modell des Gebäudes zu erstellen."
            }
        },
        petwheels: {
            title: "Petwheels",
            subtitle: "Ein patentierter, vollständig 3D-druckbarer parametrischer Rollstuhl für Hunde.",
            text1: "Ein anpassbarer parametrischer Rollstuhl für Hunde, der vollständig 3D-druckbar ist. Petwheels entstand aus dem Abschlussprojekt von Artur Balthazar, Produktdesigner und Kreativdirektor bei Baltha Studio.",
            text2: "Das Produkt unterscheidet sich von allen anderen auf dem Markt durch seine flexiblen Seitenstangen und wurde als solches patentiert. Es erlangte schnell Aufmerksamkeit in den brasilianischen Medien und einige Einheiten wurden verkauft."
        },
        connect: {
            title: "Kontakt aufnehmen!",
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
            headerSubtitle: "Direktor bei Baltha Studio",
            placeholder: "Schreiben Sie Ihre Nachricht hier...",
            errorMessage: "Ups! Etwas ist schief gelaufen.",
            suggestion1: "Worauf ist Baltha Studio spezialisiert?",
            suggestion2: "An welchen Projekten haben Sie gearbeitet?",
            suggestion3: "Wie kann ich mich melden oder ein Projekt starten?"
        },
        common: {
            previous: "Zurück",
            next: "Weiter",
            close: "Schließen",
            open: "Öffnen",
            goToModel: "Zum Modell"
        }
    },

    FR: {
        header: {
            welcomeText: "Nous concevons des expériences web interactives adaptées à l'essence de votre marque et accessibles à tous."
        },
        menu: {
            welcome: "Accueil",
            carCustomizer: "Configurateur\nAuto",
            musecraftEditor: "Éditeur\nMusecraft",
            digitalDioramas: "Dioramas\nNumériques",
            petwheels: "Petwheels",
            letsConnect: "Contactez-\nnous!"
        },
        state3: {
            navigationTitle: "Navigation",
            guided: "Guidé",
            free: "Libre",
            audioTitle: "Audio",
            on: "-",
            off: "-",
            typingText: "Bienvenue chez Baltha Studio! Choisissez un mode de navigation pour continuer..."
        },
        controls: {
            turnAudioOff: "Désactiver l'audio",
            turnAudioOn: "Activer l'audio",
            information: "Informations"
        },
        geely: {
            title: "Configurateur GEELY",
            subtitle: "Nous créons tout, des configurateurs 3D de voitures aux pistes d'essai, salles d'exposition virtuelles et bien plus encore.",
            bodyColor: "Couleur de Carrosserie",
            version: "Version",
            interiorView: "Vue intérieure",
            exteriorView: "Vue extérieure",
            tapToSeeMore: "Appuyez pour en voir plus"
        },
        musecraft: {
            title: "Éditeur Musecraft",
            subtitle: "Créez des scènes 3D interactives pour le web dans notre éditeur collaboratif.",
            text1: "Un puissant éditeur de scènes 3D basé sur le web conçu pour créer des expériences interactives en temps réel directement pour le navigateur.",
            text2: "Musecraft permet aux designers, développeurs et studios d'assembler entièrement des scènes 3D, de définir des interactions, de gérer des assets et de déployer des expériences sans la friction des moteurs de jeu traditionnels ou des pipelines lourds.",
            text3: "Construit sur des technologies web modernes et alimenté par des outils d'IA, il relie design, développement et art 3D dans un workflow low-code unique."
        },
        dioramas: {
            subtitle: "En 2018, Baltha Studio a débuté comme entreprise d'impression 3D, puis s'est tourné vers l'espace numérique.",
            subtitleMobile: "En 2018, Baltha Studio a débuté comme entreprise d'impression 3D avant de se tourner vers l'espace numérique.",
            florianopolisMuseum: {
                title: "Musée de Florianópolis",
                text1: "Nous nous sommes associés à SESC pour construire une maquette imprimable en 3D du Musée de Florianópolis qui allait ouvrir dans le centre historique de la ville.",
                text2: "C'est une maquette de 100cm x 85cm x 60cm placée dans la salle d'entrée du musée. Entièrement recouverte de résine époxy, elle est conçue pour durer plusieurs années comme modèle tactile."
            },
            santaCatarinaIsland: {
                title: "Île de Santa Catarina",
                text1: "Également dans le cadre du projet du Musée de Florianópolis avec SESC, nous avons créé cette maquette de 3m x 1m de l'île de Santa Catarina où se trouve le musée.",
                text2: "C'est aussi un modèle tactile du relief réel de l'île, avec un facteur d'échelle vertical de 2,5x, et une salle entière qui lui est dédiée."
            },
            catarinenseMuseum: {
                title: "Musée de l'École Catarinense",
                text1: "Un autre bâtiment important du centre historique de Florianópolis est l'École Catarinense, qui est ensuite devenue non seulement un musée, mais aussi un centre de créativité et d'innovation avec le CoCreation Lab, un espace de coworking incubateur de startups.",
                text2: "Suivant la tendance précédente, nous avons également été contactés pour réaliser une maquette imprimable en 3D du bâtiment."
            }
        },
        petwheels: {
            title: "Petwheels",
            subtitle: "Un fauteuil roulant paramétrique breveté et entièrement imprimable en 3D pour chiens.",
            text1: "Un fauteuil roulant paramétrique personnalisable pour chiens entièrement imprimable en 3D, Petwheels est né du projet de fin d'études d'Artur Balthazar, designer produit et directeur créatif chez Baltha Studio.",
            text2: "Le produit se distingue de tous les autres sur le marché grâce à ses barres latérales flexibles et a été breveté comme tel. Il a rapidement attiré l'attention des médias brésiliens et quelques unités ont été vendues."
        },
        connect: {
            title: "Contactez-nous!",
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
            headerSubtitle: "Directeur chez Baltha Studio",
            placeholder: "Tapez votre message ici...",
            errorMessage: "Oups! Quelque chose s'est mal passé.",
            suggestion1: "Quelle est la spécialité de Baltha Studio?",
            suggestion2: "Sur quels projets avez-vous travaillé?",
            suggestion3: "Comment puis-je vous contacter ou démarrer un projet?"
        },
        common: {
            previous: "Précédent",
            next: "Suivant",
            close: "Fermer",
            open: "Ouvrir",
            goToModel: "Aller au modèle"
        }
    },

    ZH: {
        header: {
            welcomeText: "我们设计符合您品牌精髓且人人可用的互动网页体验。"
        },
        menu: {
            welcome: "欢迎",
            carCustomizer: "汽车\n配置器",
            musecraftEditor: "Musecraft\n编辑器",
            digitalDioramas: "数字\n透视模型",
            petwheels: "Petwheels",
            letsConnect: "联系\n我们!"
        },
        state3: {
            navigationTitle: "导航",
            guided: "引导",
            free: "自由",
            audioTitle: "音频",
            on: "-",
            off: "-",
            typingText: "欢迎来到Baltha Studio！选择导航模式以继续..."
        },
        controls: {
            turnAudioOff: "关闭音频",
            turnAudioOn: "开启音频",
            information: "信息"
        },
        geely: {
            title: "吉利配置器",
            subtitle: "我们创建从3D汽车配置器到试驾赛道、虚拟展厅等一切内容。",
            bodyColor: "车身颜色",
            version: "版本",
            interiorView: "内饰视图",
            exteriorView: "外观视图",
            tapToSeeMore: "点击查看更多"
        },
        musecraft: {
            title: "Musecraft 编辑器",
            subtitle: "在我们的协作网页编辑器中为网页创建交互式3D场景。",
            text1: "一款功能强大的基于网页的3D场景编辑器，专为直接在浏览器中创建交互式实时体验而设计。",
            text2: "Musecraft允许设计师、开发者和工作室完整组装3D场景、定义交互、管理资产并部署体验──无需传统游戏引擎或繁重管道的摩擦。",
            text3: "基于现代网页技术并由AI工具驱动，它将设计、开发和3D艺术融合到单一的低代码工作流程中。"
        },
        dioramas: {
            subtitle: "2018年，Baltha Studio从3D打印业务起步，随后转向数字领域。",
            subtitleMobile: "2018年，Baltha Studio从3D打印业务起步，之后转向数字领域。",
            florianopolisMuseum: {
                title: "弗洛里亚诺波利斯博物馆",
                text1: "我们与SESC合作，为即将在城市历史中心开放的弗洛里亚诺波利斯博物馆制作了3D可打印比例模型。",
                text2: "这是一个100cm x 85cm x 60cm的模型，放置在博物馆入口大厅。完全覆盖环氧树脂，作为触觉模型可使用数年。"
            },
            santaCatarinaIsland: {
                title: "圣卡塔琳娜岛",
                text1: "同样作为与SESC合作的弗洛里亚诺波利斯博物馆项目的一部分，我们创建了博物馆所在的圣卡塔琳娜岛3m x 1m比例模型。",
                text2: "这也是真实岛屿地形的触觉模型，垂直比例因子为2.5倍，并有一个专门的房间展示。"
            },
            catarinenseMuseum: {
                title: "圣卡塔琳娜学校博物馆",
                text1: "弗洛里亚诺波利斯历史中心另一座重要建筑是圣卡塔琳娜学校，后来它不仅成为博物馆，还成为创意创新中心──CoCreation Lab，一个创业孵化器共享办公空间。",
                text2: "延续之前的趋势，我们也被联系制作该建筑的3D可打印比例模型。"
            }
        },
        petwheels: {
            title: "Petwheels",
            subtitle: "一款获得专利的全3D可打印参数化狗轮椅。",
            text1: "一款可定制的参数化狗轮椅，完全3D可打印，Petwheels诞生于Artur Balthazar的毕业设计项目，他是Baltha Studio的产品设计师和创意总监。",
            text2: "该产品因其灵活的侧杆而与市场上所有其他产品不同，并因此获得专利。它迅速引起巴西媒体的关注，并售出了一些单位。"
        },
        connect: {
            title: "联系我们！",
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
            headerSubtitle: "Baltha Studio总监",
            placeholder: "在这里输入您的消息...",
            errorMessage: "糟糕！出了点问题。",
            suggestion1: "Baltha Studio专注于什么?",
            suggestion2: "你们参与过哪些项目?",
            suggestion3: "如何联系或启动项目?"
        },
        common: {
            previous: "上一个",
            next: "下一个",
            close: "关闭",
            open: "打开",
            goToModel: "前往模型"
        }
    }
};

// Helper to get translation by language code
export function getTranslations(languageCode: LanguageCode): TranslationKeys {
    return translations[languageCode] || translations.EN;
}
