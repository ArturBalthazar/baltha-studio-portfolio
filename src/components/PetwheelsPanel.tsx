import React, { useState, useEffect } from "react";
import cx from "classnames";

interface PetwheelsPanelProps {
    visible: boolean;
}

// Custom scrollbar styles
const scrollbarStyles: React.CSSProperties = {
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(255,255,255,0.3) transparent'
};

export function PetwheelsPanel({ visible }: PetwheelsPanelProps) {
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
                        Petwheels
                    </h2>
                    <div className="h-px bg-white/40 w-full mt-3" />
                </div>

                {/* Scrollable Content */}
                <div
                    className="flex-1 overflow-y-auto px-5 min-h-0"
                    style={scrollbarStyles}
                >
                    <style>{`
                        .petwheels-scroll::-webkit-scrollbar {
                            width: 6px;
                        }
                        .petwheels-scroll::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .petwheels-scroll::-webkit-scrollbar-thumb {
                            background: rgba(255,255,255,0.3);
                            border-radius: 3px;
                        }
                        .petwheels-scroll::-webkit-scrollbar-thumb:hover {
                            background: rgba(255,255,255,0.5);
                        }
                    `}</style>
                    <div className="flex flex-col gap-4 petwheels-scroll pb-2">
                        {/* First text block */}
                        <p className="font-mono text-sm font-light text-white/90 leading-relaxed">
                            A customizable parametric wheelchair for dogs that is fully 3D printable, Petwheels was born from the capstone project of Artur Balthazar, product designer and creative director at Baltha Studio.
                        </p>

                        {/* Main Image - petwheels1.jpg */}
                        <div className="w-full aspect-[16/9] rounded-lg overflow-hidden border border-white/50 flex-shrink-0">
                            <img
                                src="/assets/images/petwheels/petwheels1.jpg"
                                alt="Petwheels main view"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Second text block */}
                        <p className="font-mono text-sm font-light text-white/90 leading-relaxed">
                            The product differs from every other in the market due to its flexible lateral bars and was patented as such. It quickly gained attention from the Brazilian media and some units were sold.
                        </p>

                        {/* Image Composition - Left large, Right stacked */}
                        <div className="flex gap-2 flex-shrink-0">
                            {/* Left - Large image (petwheels2.jpg) - rotated 90 degrees */}
                            <div className="w-2/5  rounded-lg overflow-hidden border border-white/50 flex items-center justify-center bg-white">
                                <img
                                    src="/assets/images/petwheels/petwheels2.jpg"
                                    alt="Petwheels patent diagram side"
                                    className="h-auto w-auto object-cover rotate-90"
                                />
                            </div>

                            {/* Right - Stacked images (petwheels3.jpg, petwheels4.jpg) */}
                            <div className="w-1/2 flex flex-col gap-2">
                                <div className="flex-1 rounded-lg overflow-hidden border border-white/50">
                                    <img
                                        src="/assets/images/petwheels/petwheels3.jpg"
                                        alt="Petwheels patent diagram top"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 rounded-lg overflow-hidden border border-white/50">
                                    <img
                                        src="/assets/images/petwheels/petwheels4.jpg"
                                        alt="Petwheels patent diagram bottom"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile: Top collapsible panel */}
            <MobilePetwheelsPanel visible={visible} />
        </>
    );
}

// Separate mobile component for cleaner code
function MobilePetwheelsPanel({ visible }: { visible: boolean }) {
    const [isExpanded, setIsExpanded] = useState(true);

    // Reset to expanded when visible becomes true
    useEffect(() => {
        if (visible) {
            setIsExpanded(true);
        }
    }, [visible]);

    return (
        <div
            className={cx(
                "md:hidden absolute top-16 left-3 right-3",
                "flex flex-col rounded-xl overflow-hidden",
                "bg-[rgba(12,20,40,0.6)] backdrop-blur-lg",
                "border-2 border-white/30",
                "transition-all duration-300",
                visible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-10 pointer-events-none"
            )}
            style={{ maxHeight: "calc(100% - 180px)" }}
        >
            {/* Mobile Header - Always visible, Title left-aligned */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 pt-3 pb-2">
                <h2
                    className="font-sans text-lg font-semibold text-white text-left flex-1 cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    Petwheels
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
                            .mobile-petwheels-scroll::-webkit-scrollbar {
                                width: 4px;
                            }
                            .mobile-petwheels-scroll::-webkit-scrollbar-track {
                                background: transparent;
                            }
                            .mobile-petwheels-scroll::-webkit-scrollbar-thumb {
                                background: rgba(255,255,255,0.3);
                                border-radius: 2px;
                            }
                        `}</style>
                        <div className="flex flex-col gap-3 mobile-petwheels-scroll">
                            {/* First text block */}
                            <p className="font-mono text-xs font-light text-white/90 leading-relaxed">
                                A customizable parametric wheelchair for dogs that is fully 3D printable, Petwheels was born from the capstone project of Artur Balthazar, product designer and creative director at Baltha Studio.
                            </p>

                            {/* Main Image */}
                            <div className="w-full aspect-[16/9] rounded-lg overflow-hidden border border-white/50 flex-shrink-0">
                                <img
                                    src="/assets/images/petwheels/petwheels1.jpg"
                                    alt="Petwheels main view"
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Second text block */}
                            <p className="font-mono text-xs font-light text-white/90 leading-relaxed">
                                The product differs from every other in the market due to its flexible lateral bars and was patented as such. It quickly gained attention from the Brazilian media and some units were sold.
                            </p>

                            {/* Image Composition - Left large, Right stacked */}
                            <div className="flex gap-2 flex-shrink-0">
                                {/* Left - Large image - rotated 90 degrees */}
                                <div className="w-2/5 aspect-[3/4] rounded-lg overflow-hidden border border-white/50 flex items-center justify-center bg-white">
                                    <img
                                        src="/assets/images/petwheels/petwheels2.jpg"
                                        alt="Petwheels patent diagram side"
                                        className="h-[133%] w-auto object-contain rotate-90"
                                    />
                                </div>

                                {/* Right - Stacked images */}
                                <div className="w-3/5 flex flex-col gap-2">
                                    <div className="flex-1 rounded-lg overflow-hidden border border-white/50">
                                        <img
                                            src="/assets/images/petwheels/petwheels3.jpg"
                                            alt="Petwheels patent diagram top"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 rounded-lg overflow-hidden border border-white/50">
                                        <img
                                            src="/assets/images/petwheels/petwheels4.jpg"
                                            alt="Petwheels patent diagram bottom"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
