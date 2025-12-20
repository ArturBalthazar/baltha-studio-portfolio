import React, { useState, useEffect, useRef } from "react";
import cx from "classnames";
import { useUI, S } from "../state";

// Typing Label Component
const TypingLabel = ({ text, delay }: { text: string; delay: number }) => {
    const [displayedText, setDisplayedText] = useState("");

    useEffect(() => {
        const startTimeout = setTimeout(() => {
            let currentIndex = 0;
            const interval = setInterval(() => {
                if (currentIndex <= text.length) {
                    setDisplayedText(text.slice(0, currentIndex));
                    currentIndex++;
                } else {
                    clearInterval(interval);
                }
            }, 30);
            return () => clearInterval(interval);
        }, delay);
        return () => clearTimeout(startTimeout);
    }, [text, delay]);

    return <span>{displayedText}</span>;
};

export function ConnectOverlay() {
    const [emailExpanded, setEmailExpanded] = useState(false);
    const [copied, setCopied] = useState(false);
    const emailButtonRef = useRef<HTMLButtonElement>(null);
    const setState = useUI((st) => st.setState);
    const setNavigationMode = useUI((st) => st.setNavigationMode);

    const handleBalthaStudioClick = () => {
        // Navigate to state0 (welcome) without reloading
        setNavigationMode('guided');
        setState(S.state_0);
    };

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

    const handleLinkedInClick = () => {
        const webUrl = "https://www.linkedin.com/company/balthastudio";
        const appUrl = "linkedin://company/balthastudio";
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
            const start = Date.now();
            window.location.href = appUrl;
            setTimeout(() => {
                const end = Date.now();
                if (end - start < 1500) {
                    window.open(webUrl, '_blank');
                }
            }, 1000);
        } else {
            window.open(webUrl, '_blank');
        }
    };

    const handleInstagramClick = () => {
        const webUrl = "https://instagram.com/baltha.studio";
        const appUrl = "instagram://user?username=baltha.studio";
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
            const start = Date.now();
            window.location.href = appUrl;
            setTimeout(() => {
                const end = Date.now();
                if (end - start < 1500) {
                    window.open(webUrl, '_blank');
                }
            }, 1000);
        } else {
            window.open(webUrl, '_blank');
        }
    };

    const handleCopyEmail = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText("arturbalhazar@gmail.com");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSendEmail = (e: React.MouseEvent) => {
        e.stopPropagation();
        window.location.href = "mailto:arturbalhazar@gmail.com";
    };

    const handleEmailClick = () => {
        setEmailExpanded(prev => !prev);
    };

    const links = [
        {
            label: "Baltha Studio",
            url: "#",
            icon: "/assets/brand/baltha-studio-1.png",
            type: "action",
            action: handleBalthaStudioClick
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


    return (
        <div className="w-full h-full relative overflow-hidden flex items-start justify-center pointer-events-none">
            <div className="w-full md:max-w-sm max-w-xs p-6 flex flex-col items-center pointer-events-auto">
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
                                "group relative w-full h-14 md:h-16 rounded-bigButton border border-white/30",
                                "flex items-center justify-between px-5",
                                "transition-all duration-300 hover:scale-[1.02] hover:border-white/60",
                                "select-none bg-white/5 backdrop-blur-sm"
                            )}
                            style={{
                                animation: `fadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
                                animationDelay: `${index * 0.15}s`,
                                opacity: 0,
                            }}
                        >
                            <div
                                className="absolute inset-0 rounded-bigButton opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                style={{
                                    background: "linear-gradient(to right, rgba(180, 173, 230, 0.2), rgba(255, 181, 218, 0.1))",
                                }}
                            />

                            <div className="flex items-center gap-5 z-10">
                                <span className="text-xl filter drop-shadow-md flex items-center justify-center w-10 h-10">
                                    <img src={link.icon} alt={link.label} className="w-full h-full object-contain" />
                                </span>
                                <span className="text-white text-lg font-thin font-mono tracking-wide">
                                    <TypingLabel text={link.label} delay={index * 150} />
                                </span>
                            </div>
                        </button>
                    ))}

                    {/* Email Button with Expandable Section */}
                    <div className="w-full">
                        <button
                            ref={emailButtonRef}
                            onClick={handleEmailClick}
                            className={cx(
                                "group relative w-full h-14 md:h-16 rounded-bigButton border",
                                "flex items-center justify-between px-5",
                                "transition-all duration-300",
                                "select-none bg-white/5 backdrop-blur-sm",
                                emailExpanded
                                    ? "border-white/60 scale-[1.02]"
                                    : "border-white/30 hover:scale-[1.02] hover:border-white/60"
                            )}
                            style={{
                                animation: `fadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
                                animationDelay: `${links.length * 0.15}s`,
                                opacity: 0,
                            }}
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
                            <div className="flex items-center gap-5 z-10">
                                <span className="text-xl filter drop-shadow-md flex items-center justify-center w-10 h-10">
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
                            <div className="relative px-4 pb-4 pt-2">
                                {/* Triangle pointer */}
                                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-0 h-0"
                                    style={{
                                        borderLeft: '8px solid transparent',
                                        borderRight: '8px solid transparent',
                                        borderBottom: '8px solid rgba(255, 255, 255, 0.9)',
                                    }}
                                />

                                {/* Email address pill */}
                                <div className="bg-brand-white rounded-lg py-2 px-4 mt-2 mb-3 border-b border-brand-dark/40">
                                    <p className="text-brand-dark font-mono text-sm text-center tracking-tight">
                                        arturbalhazar@gmail.com
                                    </p>
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCopyEmail}
                                        className="flex-1 h-9 rounded-lg bg-brand-dark/80 hover:bg-brand-dark text-white text-sm font-medium transition-colors flex items-center justify-center font-mono border border-white/20"
                                    >
                                        {copied ? "Copied!" : "Copy"}
                                    </button>
                                    <button
                                        onClick={handleSendEmail}
                                        className="flex-1 h-9 rounded-lg bg-brand-dark/80 hover:bg-brand-dark text-white text-sm font-medium transition-colors flex items-center justify-center font-mono border border-white/20"
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
    );
}
