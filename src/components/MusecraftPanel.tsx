import React, { useState, useEffect } from "react";
import cx from "classnames";

interface MusecraftPanelProps {
    visible: boolean;
}

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
                    <h2 className="font-sans text-2xl font-semibold text-white text-left">
                        Musecraft
                    </h2>
                    <span className="font-mono text-sm font-light text-white">Create interactive 3D scenes in our fully web-based and AI-powered 3D editor.</span>
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
                            Musecraft is an experimental project that explores the intersection of artificial intelligence and musical creativity. Using cutting-edge generative models, it allows users to describe their vision in natural language and receive unique, royalty-free compositions.
                        </p>

                        {/* Placeholder Image area - using a gradient for now */}
                        <div className="w-full aspect-[16/9] rounded-lg overflow-hidden border border-white/50 flex-shrink-0 bg-gradient-to-br from-purple-900/50 via-blue-800/50 to-teal-700/50 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-4xl mb-2">🎵</div>
                                <span className="font-mono text-xs text-white/60">Coming Soon</span>
                            </div>
                        </div>

                        {/* Second text block */}
                        <p className="font-mono text-sm font-light text-white/90 leading-relaxed">
                            Whether you're a content creator needing background music, a game developer looking for adaptive soundtracks, or an artist seeking inspiration, Musecraft provides a seamless creative experience powered by the latest in AI research.
                        </p>

                        {/* Features list */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-white/80">
                                <span className="text-lg">✨</span>
                                <span className="font-mono text-sm font-light">Natural language prompts</span>
                            </div>
                            <div className="flex items-center gap-2 text-white/80">
                                <span className="text-lg">🎹</span>
                                <span className="font-mono text-sm font-light">Multiple genres & styles</span>
                            </div>
                            <div className="flex items-center gap-2 text-white/80">
                                <span className="text-lg">🔄</span>
                                <span className="font-mono text-sm font-light">Iterative refinement</span>
                            </div>
                            <div className="flex items-center gap-2 text-white/80">
                                <span className="text-lg">📦</span>
                                <span className="font-mono text-sm font-light">Export in multiple formats</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile: Top collapsible panel */}
            <MobileMusecraftPanel visible={visible} />
        </>
    );
}

// Separate mobile component for cleaner code
function MobileMusecraftPanel({ visible }: { visible: boolean }) {
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
                "transition-all duration-300 max-h-[38vh]",
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
                        Musecraft
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
                        Create interactive 3D scenes in our fully web-based and AI-powered 3D editor.
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
                                    Musecraft is an experimental project that explores the intersection of artificial intelligence and musical creativity. Using generative models, it allows users to describe their vision and receive unique compositions.
                                </p>

                                {/* Placeholder Image */}
                                <div className="w-full aspect-[16/9] rounded-lg overflow-hidden border border-white/50 flex-shrink-0 bg-gradient-to-br from-purple-900/50 via-blue-800/50 to-teal-700/50 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-3xl mb-1">🎵</div>
                                        <span className="font-mono text-xs text-white/60">Coming Soon</span>
                                    </div>
                                </div>

                                {/* Second text block */}
                                <p className="font-mono text-xs font-light text-white/90 leading-relaxed">
                                    Perfect for content creators, game developers, and artists seeking AI-powered musical inspiration with natural language prompts.
                                </p>

                                {/* Features list - condensed for mobile */}
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-white/80">✨ Natural prompts</span>
                                    <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-white/80">🎹 Multiple genres</span>
                                    <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-white/80">📦 Export options</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

