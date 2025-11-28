import React, { useState, useEffect } from "react";
import cx from "classnames";

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
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);

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

    const handleCopyEmail = () => {
        navigator.clipboard.writeText("arturbalhazar@gmail.com");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const links = [
        {
            label: "Baltha Studio",
            url: "#",
            icon: "/assets/images/website.png",
            type: "action",
            action: () => window.location.reload()
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
        {
            label: "Email",
            url: "#",
            icon: "/assets/images/email.png",
            type: "action",
            action: () => setEmailModalOpen(true)
        },
    ];

    return (
        <>
            <div className="w-full h-full relative overflow-hidden flex items-start justify-center pointer-events-none">
                <div className="w-full max-w-md p-6 flex flex-col items-center pointer-events-auto">
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
                                    "select-none bg-brand-white/00"
                                )}
                                style={{
                                    animation: `fadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
                                    animationDelay: `${index * 0.15}s`,
                                    opacity: 0,
                                    transform: 'translateY(10px)'
                                }}
                            >
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
                                        <TypingLabel text={link.label} delay={index * 150} />
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {emailModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-sm">
                        <div className="relative rounded-canvas bg-[#081428]/90 backdrop-blur-md p-6 border border-white/20 shadow-2xl">
                            <button
                                onClick={() => setEmailModalOpen(false)}
                                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                            >
                                ✕
                            </button>

                            <h3 className="text-white text-xl font-medium mb-6 text-center font-sans">Contact Email</h3>

                            <div className="bg-white/5 rounded-lg p-3 mb-6 text-center border border-white/10">
                                <p className="text-white font-mono text-sm break-all">arturbalhazar@gmail.com</p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleCopyEmail}
                                    className="flex-1 h-12 rounded-bigButton bg-white/10 hover:bg-white/20 text-white font-medium transition-colors border border-white/10 flex items-center justify-center gap-2 font-mono"
                                >
                                    {copied ? "Copied!" : "Copy"}
                                </button>
                                <a
                                    href="mailto:arturbalhazar@gmail.com"
                                    className="flex-1 h-12 rounded-bigButton bg-brand-purple hover:bg-brand-purple/80 text-white font-medium transition-colors flex items-center justify-center font-mono"
                                >
                                    Open App
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
