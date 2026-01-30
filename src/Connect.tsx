import React, { useState, useEffect, useRef } from "react";
import cx from "classnames";
import { Header } from "./components/header";
import { Chat } from "./components/Chat";
import { AudioManager } from "./components/AudioManager";
import { useUI, S } from "./state";

// Typing Label Component
const TypingLabel = ({ text, delay }: { text: string; delay: number }) => {
    const [displayedText, setDisplayedText] = useState("");

    useEffect(() => {
        // Start immediately if delay is 0, otherwise wait
        const startTimeout = setTimeout(() => {
            let currentIndex = 0;
            const interval = setInterval(() => {
                if (currentIndex <= text.length) {
                    setDisplayedText(text.slice(0, currentIndex));
                    currentIndex++;
                } else {
                    clearInterval(interval);
                }
            }, 30); // Typing speed
            return () => clearInterval(interval);
        }, delay);
        return () => clearTimeout(startTimeout);
    }, [text, delay]);

    // Reserve space to prevent layout shift, or just let it grow (user asked for typing effect)
    // Using a non-breaking space if empty to keep height correct if needed, but here flexbox handles it.
    return <span>{displayedText}</span>;
};

export default function Connect() {
    const [emailExpanded, setEmailExpanded] = useState(false);
    const [copied, setCopied] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [chatVisible, setChatVisible] = useState(false);
    const emailButtonRef = useRef<HTMLButtonElement>(null);

    // Force state 2 for smaller header sizing
    const setState = useUI((st) => st.setState);
    useEffect(() => {
        setState(S.state_3);

        // Hide the static HTML loading screen when Connect page mounts
        const staticScreen = document.getElementById('static-loading-screen');
        if (staticScreen) {
            staticScreen.style.display = 'none';
        }
    }, [setState]);

    // Close email section when clicking anywhere outside the email button
    useEffect(() => {
        if (!emailExpanded) return;

        const handleClick = (e: MouseEvent) => {
            // If click is on the email button itself, let the button's onClick handle it
            if (emailButtonRef.current?.contains(e.target as Node)) {
                return;
            }
            // Otherwise close
            setEmailExpanded(false);
        };

        // Use timeout to avoid the current click from triggering close
        const timeout = setTimeout(() => {
            window.addEventListener('click', handleClick);
        }, 0);

        return () => {
            clearTimeout(timeout);
            window.removeEventListener('click', handleClick);
        };
    }, [emailExpanded]);

    // Sync chatVisible with chatOpen, but with delay on close (copied from App.tsx)
    useEffect(() => {
        if (chatOpen) {
            setChatVisible(true);
        } else {
            const timer = setTimeout(() => setChatVisible(false), 500);
            return () => clearTimeout(timer);
        }
    }, [chatOpen]);

    const handleInstagramClick = () => {
        const webUrl = "https://instagram.com/baltha.studio";
        const appUrl = "instagram://user?username=baltha.studio";

        // Simple mobile detection
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
            const start = Date.now();
            // Try to open the app
            window.location.href = appUrl;

            // Fallback check
            setTimeout(() => {
                const end = Date.now();
                // If the browser wasn't backgrounded (meaning app didn't open), open web url
                if (end - start < 1500) {
                    window.open(webUrl, '_blank');
                }
            }, 1000);
        } else {
            window.open(webUrl, '_blank');
        }
    };

    const handleLinkedInClick = () => {
        const webUrl = "https://www.linkedin.com/in/artur-balthazar/";
        const appUrl = "linkedin://in/artur-balthazar";

        // Simple mobile detection
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
            const start = Date.now();
            // Try to open the app
            window.location.href = appUrl;

            // Fallback check
            setTimeout(() => {
                const end = Date.now();
                // If the browser wasn't backgrounded (meaning app didn't open), open web url
                if (end - start < 1500) {
                    window.open(webUrl, '_blank');
                }
            }, 1000);
        } else {
            window.open(webUrl, '_blank');
        }
    };

    const links = [
        {
            label: "Baltha Studio",
            url: "https://baltha.studio",
            icon: "/assets/brand/baltha-studio-1.png",
            type: "link"
        },
        {
            label: "LinkedIn",
            url: "#",
            icon: "/assets/images/linkedin.png",
            type: "action",
            action: handleLinkedInClick
        },
        {
            label: "Instagram",
            url: "#",
            icon: "/assets/images/instagram.png",
            type: "action",
            action: handleInstagramClick
        },
        {
            label: "WhatsApp",
            url: "https://wa.me/554891287795?text=Hello%2C%20I%27d%20like%20to%20get%20in%20touch%21",
            icon: "/assets/images/whatsapp.png",
            type: "link"
        },
    ];

    const handleCopyEmail = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText("artur@baltha.studio");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSendEmail = (e: React.MouseEvent) => {
        e.stopPropagation();
        window.location.href = "mailto:artur@baltha.studio";
    };

    const handleEmailClick = () => {
        setEmailExpanded(prev => !prev);
    };

    // Button styles based on expanded state
    const emailButtonStyle: React.CSSProperties = emailExpanded
        ? {
            border: '1px solid rgba(255,255,255,0.6)',
            transform: 'scale(1.02)',
            backgroundColor: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
        }
        : {
            border: '1px solid rgba(255,255,255,0.3)',
            transform: 'scale(1)',
            backgroundColor: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
        };

    return (
        <>
            <AudioManager />

            {/* Main Layout - Matches App.tsx structure */}
            <div
                className="h-[100dvh] min-h-[100svh] w-full overflow-hidden"
                style={{ height: "var(--app-vh)" }}
            >
                <main
                    className={cx(
                        "h-full w-full",
                        "grid grid-rows-[max-content,1fr]",
                        "justify-items-start",
                        "transition-all duration-500",
                        "gap-2 md:gap-4 px-2 md:px-4 pt-2 md:pt-4 pb-6 md:pb-8"
                    )}
                >
                    {/* Header Wrapper */}
                    <div
                        className={cx(
                            "justify-self-start transition-all duration-500",
                            "w-full md:w-[75%] md:ml-[12.5%]"
                        )}
                    >
                        <Header showWelcome={false} />
                    </div>

                    {/* Content Wrapper (Replaces Canvas) */}
                    <div
                        className={cx(
                            "h-full min-h-0 relative justify-self-start transition-all duration-500",
                            "w-full md:w-[75%] md:ml-[12.5%]"
                        )}
                    >
                        {/* The "Canvas" Box */}
                        <div className="w-full h-full rounded-canvas bg-[radial-gradient(150%_150%_at_50%_100%,_#49408D_0%,_#081428_60%)] relative overflow-hidden shadow-hero flex items-start justify-center">

                            {/* Link Tree Content */}
                            <div className="w-full max-w-md p-6 flex flex-col items-center">
                                <h2 className="font-sans text-white text-3xl font-medium mb-8 select-none">Let's connect!</h2>

                                <div className="w-full flex flex-col gap-4">
                                    {links.map((link, index) => (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                if (link.type === 'link') {
                                                    window.open(link.url, '_blank');
                                                } else if (link.action) {
                                                    link.action();
                                                }
                                            }}
                                            className={cx(
                                                "group relative w-full h-16 rounded-bigButton border border-white/30",
                                                "flex items-center justify-between px-6",
                                                "transition-all duration-300 hover:scale-[1.02] hover:border-white/60",
                                                "select-none bg-white/5 backdrop-blur-sm"
                                            )}
                                            style={{
                                                animation: `fadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
                                                animationDelay: `${index * 0.15}s`, // Staggered delay
                                                opacity: 0, // Start invisible
                                                transform: 'translateY(10px)' // Start slightly lower (handled by fadeIn keyframe, but good to be explicit if keyframe wasn't there, but fadeIn has it)
                                            }}
                                        >
                                            {/* Hover Gradient */}
                                            <div
                                                className="absolute inset-0 rounded-bigButton opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                                style={{
                                                    background: "linear-gradient(to right, rgba(180, 173, 230, 0.2), rgba(255, 181, 218, 0.1))",
                                                }}
                                            />

                                            <div className="flex items-center gap-4 z-10">
                                                <span className="text-2xl filter drop-shadow-md flex items-center justify-center w-10 h-10">
                                                    <img src={link.icon} alt={link.label} className="w-full h-full object-contain" />
                                                </span>
                                                <span className="text-white text-lg font-thin font-mono tracking-wide">
                                                    {/* Start typing immediately when button starts fading in */}
                                                    <TypingLabel text={link.label} delay={index * 150} />
                                                </span>
                                            </div>
                                        </button>
                                    ))}

                                    {/* Email Button with Expandable Section */}
                                    <div
                                        className="w-full"
                                        style={{
                                            animation: `fadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
                                            animationDelay: `${links.length * 0.15}s`,
                                            opacity: 0,
                                        }}
                                    >
                                        <button
                                            ref={emailButtonRef}
                                            onClick={handleEmailClick}
                                            className={cx(
                                                "group relative w-full h-16 flex items-center justify-between px-6 select-none rounded-bigButton transition-all duration-300 bg-white/5 backdrop-blur-sm",
                                                !emailExpanded && "hover:scale-[1.02] hover:border-white/60"
                                            )}
                                            style={emailButtonStyle}
                                        >
                                            {/* Hover gradient - only show when NOT expanded */}
                                            {!emailExpanded && (
                                                <div
                                                    className="absolute inset-0 rounded-bigButton opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                                    style={{
                                                        background: "linear-gradient(to right, rgba(180, 173, 230, 0.2), rgba(255, 181, 218, 0.1))",
                                                    }}
                                                />
                                            )}
                                            <div className="flex items-center gap-4 z-10">
                                                <span className="text-2xl filter drop-shadow-md flex items-center justify-center w-10 h-10">
                                                    <img src="/assets/images/email.png" alt="Email" className="w-full h-full object-contain" />
                                                </span>
                                                <span className="text-white text-lg font-thin font-mono tracking-wide">
                                                    <TypingLabel text="Email" delay={links.length * 150} />
                                                </span>
                                            </div>
                                        </button>

                                        {/* Expanded Email Section */}
                                        <div
                                            className={cx(
                                                "overflow-hidden transition-all duration-300 ease-out",
                                                emailExpanded ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                                            )}
                                        >
                                            <div className="relative px-5 pb-5 pt-3">
                                                {/* Triangle pointer */}
                                                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-0 h-0"
                                                    style={{
                                                        borderLeft: '8px solid transparent',
                                                        borderRight: '8px solid transparent',
                                                        borderBottom: '8px solid rgba(255, 255, 255, 0.9)',
                                                    }}
                                                />

                                                {/* Email address pill */}
                                                <div className="bg-brand-white rounded-lg py-2.5 px-5 mt-2 mb-3">
                                                    <p className="text-brand-dark font-mono text-sm text-center tracking-tight">
                                                        artur@baltha.studio
                                                    </p>
                                                </div>

                                                {/* Action buttons */}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleCopyEmail}
                                                        className="flex-1 h-10 rounded-lg hover:bg-brand-dark/80 text-white text-sm font-medium transition-colors flex items-center justify-center font-mono border border-white/20"
                                                    >
                                                        {copied ? "Copied!" : "Copy"}
                                                    </button>
                                                    <button
                                                        onClick={handleSendEmail}
                                                        className="flex-1 h-10 rounded-lg hover:bg-brand-dark/80 text-white text-sm font-medium transition-colors flex items-center justify-center font-mono border border-white/20"
                                                    >
                                                        Send
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Label - Positioned relative to the main grid area, matching App.tsx */}
                        <div
                            className={cx(
                                "absolute -bottom-6 left-1/2 -translate-x-1/2 z-20 text-xs font-mono tracking-wide transition-colors duration-500 select-none pointer-events-none text-brand-dark/70"
                            )}
                        >
                            BALTHA STUDIO 2026
                        </div>
                    </div>
                </main>
            </div>

            {/* Chat FAB */}
            <button
                onClick={() => setChatOpen(!chatOpen)}
                className={cx(
                    "fixed z-50 rounded-full",
                    // mobile (centered via right hack you used)
                    "bottom-[90px] -right-[50%] -translate-x-[25px]",
                    // desktop: push farther right, small bottom tweak
                    "sm:bottom-[70px] sm:-right-[100%] sm:-translate-x-[70px]",
                    "flex items-center justify-center cursor-pointer",
                    "backdrop-blur-sm shadow-[inset_0_0_4px_3px_rgba(255,255,255,0.452)]",
                    "relative overflow-visible",
                    "transition-all duration-300 ease-in-out hover:scale-105",
                    chatOpen ? "opacity-0" : "",
                    chatOpen ? "w-[50px] h-[50px]" : "w-[50px] h-[50px]"
                )}
                style={{
                    background: chatOpen
                        ? `rgba(255,255,255,0.233)`
                        : `radial-gradient(circle, transparent 30%, rgba(255,255,255,0.233) 70%)`,
                }}
                aria-label={chatOpen ? "Close chat" : "Open chat"}
            >
                <div
                    className="absolute top-[2.5px] left-[2.5px] w-[45px] h-[45px] -z-10 rounded-[35%] blur-[10px] opacity-100"
                    style={{
                        background: `conic-gradient(
                  from 0deg,
                  #9A92D2,
                  #7583ff,
                  #FF8800,
                  #FF99CC,
                  #9A92D2
                )`,
                        animation: "rotateGlow 5s linear infinite",
                    }}
                />

                <img
                    src={chatOpen ? "/assets/images/chatIcon.png" : "/assets/images/chatIcon.png"}
                    alt={chatOpen ? "Chat" : "Chat"}
                    className={chatOpen ? "w-[30px] h-[30px] mt-[5px]" : "w-[30px] h-[30px] mt-[5px]"}
                />
                <span className="sr-only">{chatOpen ? "Open chat" : "Open chat"}</span>
            </button>

            {/* Chat Component */}
            {chatVisible && <Chat onClose={() => setChatOpen(false)} />}
        </>
    );
}
