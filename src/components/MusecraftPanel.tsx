import React, { useState, useEffect } from "react";
import cx from "classnames";

interface MusecraftPanelProps {
    visible: boolean;
}

// Shared content configuration - single source of truth for both mobile and desktop
const musecraftContent = {
    title: "Musecraft Editor",
    titleMobile: "Musecraft Editor",
    subtitle: "Create interactive 3D scenes for the web in our collaborative web editor.",
    text1: "A powerful web-based 3D scene editor designed to create interactive, real-time experiences directly for the browser.",
    image: "/assets/images/musecraft/editor.png",
    text2: "Musecraft allows designers, developers, and studios to fully assemble 3D scenes, define interactions, manage assets, and deploy experiences without the friction of traditional game engines or heavyweight pipelines.",
    text3: "Built on modern web technologies and powered by AI tools, it bridges design, development and 3D art into a single low-code workflow."
};

// Custom scrollbar styles
const scrollbarStyles: React.CSSProperties = {
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(255,255,255,0.3) transparent'
};

export function MusecraftPanel({ visible }: MusecraftPanelProps) {
    return (
        <>
            {/* Desktop: Left side panel */}
            <div className={cx(
                "hidden md:flex absolute top-[50%] translate-y-[-50%] left-16 w-[30%] h-[75%]",
                "flex-col rounded-xl overflow-hidden",
                "bg-[rgba(12,20,40,0.75)] backdrop-blur-lg",
                "border border-white/30",
                "transition-all duration-500",
                visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10 pointer-events-none"
            )}>
                {/* Fixed Header - Title aligned left */}
                <div className="flex-shrink-0 px-5 pt-5 pb-3">
                    <h2 className="font-sans text-2xl mb-1 font-semibold text-white text-left">
                        {musecraftContent.title}
                    </h2>
                    <span className="font-mono text-sm font-light text-white">{musecraftContent.subtitle}</span>
                    <div className="h-px bg-white/40 w-full mt-3" />
                </div>

                {/* Scrollable Content */}
                <div
                    className="flex-1 overflow-y-auto px-5 min-h-0"
                    style={scrollbarStyles}
                >
                    <style>{`
                        .musecraft-scroll::-webkit-scrollbar {
                            width: 6px;
                        }
                        .musecraft-scroll::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .musecraft-scroll::-webkit-scrollbar-thumb {
                            background: rgba(255,255,255,0.3);
                            border-radius: 3px;
                        }
                        .musecraft-scroll::-webkit-scrollbar-thumb:hover {
                            background: rgba(255,255,255,0.5);
                        }
                    `}</style>
                    <div className="flex flex-col gap-4 musecraft-scroll pb-2">

                        {/* First text block */}
                        <p className="font-mono text-sm font-light text-white/90 leading-relaxed">
                            {musecraftContent.text1}
                        </p>

                        <div className="w-full rounded-lg overflow-hidden border border-white/50 flex-shrink-0 bg-black">
                            <img
                                src={musecraftContent.image}
                                alt="Editor preview"
                                className="w-full h-full object-fit"
                            />
                        </div>

                        <p className="font-mono text-sm font-light text-white/90 leading-relaxed">
                            {musecraftContent.text2}
                        </p>
                        <p className="font-mono text-sm font-light text-white/90 leading-relaxed">
                            {musecraftContent.text3}
                        </p>
                    </div>
                </div>
            </div>

            {/* Mobile: Top collapsible panel */}
            <MobileMusecraftPanel visible={visible} content={musecraftContent} />
        </>
    );
}

// Separate mobile component for cleaner code
function MobileMusecraftPanel({ visible, content }: { visible: boolean; content: typeof musecraftContent }) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Reset to collapsed when visible becomes true
    useEffect(() => {
        if (visible) {
            setIsExpanded(false);
        }
    }, [visible]);

    return (
        <div
            className={cx(
                "md:hidden absolute top-16 left-3 right-3",
                "flex flex-col rounded-xl overflow-visible",
                "transition-all duration-300 max-h-[calc(50vh-96px)]",
                visible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-10 pointer-events-none"
            )}
        >
            {/* Glow effect - only visible when collapsed */}
            <div
                className={cx(
                    "absolute -inset-1 rounded-xl pointer-events-none transition-opacity duration-300",
                    !isExpanded ? "opacity-100 animate-pulse" : "opacity-0"
                )}
                style={{
                    background: "linear-gradient(180deg,rgba(155,146,210,0.7) 0%,rgba(255,153,204,0.6) 70%,rgba(255,136,0,0.4) 100%)",
                    filter: "blur(8px)",
                }}
            />
            {/* Panel content */}
            <div
                className={cx(
                    "relative flex flex-col rounded-xl overflow-hidden",
                    "bg-[rgba(12,20,40,.9)] backdrop-blur-lg",
                    "border-2 border-white/30"
                )}
                style={{ maxHeight: "calc(35%)" }}
            >
                {/* Mobile Header - Always visible, Title left-aligned */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 pt-3 pb-2">
                    <h2
                        className="font-sans text-lg font-semibold text-white text-left flex-1 cursor-pointer"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {content.titleMobile}
                    </h2>

                    <img
                        src="/assets/images/state_arrow.png"
                        alt="Expand"
                        className={cx(
                            "w-6 h-4 transition-transform duration-300 ml-2 cursor-pointer",
                            isExpanded ? "-rotate-90" : "rotate-90"
                        )}
                        onClick={() => setIsExpanded(!isExpanded)}
                    />
                </div>

                {/* Description text - only visible when collapsed, clickable to expand */}
                {!isExpanded && (
                    <div
                        className="font-mono text-sm p-4 pt-0 font-light text-white cursor-pointer"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {content.subtitle}
                        {/* Tap to see more hint */}
                        <div className="flex justify-center items-center mt-2 -mb-2 text-white/60">
                            <span className="text-xs font-mono">⮟ Tap to see more</span>
                        </div>
                    </div>
                )}

                {/* Mobile Content - Hidden when collapsed */}
                {isExpanded && (
                    <>
                        <div className="h-px bg-white/50 w-full mx-3 flex-shrink-0" style={{ width: 'calc(100% - 24px)' }} />

                        {/* Scrollable content area */}
                        <div
                            className="flex-1 overflow-y-auto px-3 py-3 min-h-0"
                            style={scrollbarStyles}
                        >
                            <style>{`
                                .mobile-musecraft-scroll::-webkit-scrollbar {
                                    width: 4px;
                                }
                                .mobile-musecraft-scroll::-webkit-scrollbar-track {
                                    background: transparent;
                                }
                                .mobile-musecraft-scroll::-webkit-scrollbar-thumb {
                                    background: rgba(255,255,255,0.3);
                                    border-radius: 2px;
                                }
                            `}</style>
                            <div className="flex flex-col gap-3 mobile-musecraft-scroll">
                                {/* First text block */}
                                <p className="font-mono text-xs font-light text-white/90 leading-relaxed">
                                    {content.text1}
                                </p>

                                {/* Image */}
                                <div className="w-full aspect-[16/9] rounded-lg overflow-hidden border border-white/50 flex-shrink-0 bg-black">
                                    <img
                                        src={content.image}
                                        alt="Editor preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Second text block */}
                                <p className="font-mono text-xs font-light text-white/90 leading-relaxed">
                                    {content.text2}
                                </p>

                                {/* Third text block */}
                                <p className="font-mono text-xs font-light text-white/90 leading-relaxed">
                                    {content.text3}
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
