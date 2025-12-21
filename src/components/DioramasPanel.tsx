import React, { useState, useEffect } from "react";
import cx from "classnames";
import { useUI } from "../state";
import { useI18n } from "../i18n";

interface DioramasPanelProps {
    visible: boolean;
}

// Content configuration - images only, text comes from translations
const dioramaConfig = [
    {
        id: "sesc-museum",
        file: "sesc-museum.glb",
        translationKey: "florianopolisMuseum" as const,
        image: "/assets/images/dioramas/florianopolis-museum.png",
    },
    {
        id: "sesc-island",
        file: "sesc-island.glb",
        translationKey: "santaCatarinaIsland" as const,
        image: "/assets/images/dioramas/island-museum.png",
    },
    {
        id: "dioramas",
        file: "dioramas.gltf",
        translationKey: "catarinenseMuseum" as const,
        image: "/assets/images/dioramas/catarinense-museum.png",
    }
];

// Custom scrollbar styles
const scrollbarStyles: React.CSSProperties = {
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(255,255,255,0.3) transparent'
};

export function DioramasPanel({ visible }: DioramasPanelProps) {
    const { t } = useI18n();
    const selectedDioramaModel = useUI((st) => st.selectedDioramaModel);
    const setSelectedDioramaModel = useUI((st) => st.setSelectedDioramaModel);

    // For animation when switching models
    const [isAnimating, setIsAnimating] = useState(false);

    const currentConfig = dioramaConfig[selectedDioramaModel];
    const currentContent = t.dioramas[currentConfig.translationKey];

    const handlePrevious = () => {
        if (isAnimating) return;
        setIsAnimating(true);

        const newIndex = selectedDioramaModel === 0
            ? dioramaConfig.length - 1
            : selectedDioramaModel - 1;
        setSelectedDioramaModel(newIndex);

        setTimeout(() => setIsAnimating(false), 300);
    };

    const handleNext = () => {
        if (isAnimating) return;
        setIsAnimating(true);

        const newIndex = selectedDioramaModel === dioramaConfig.length - 1
            ? 0
            : selectedDioramaModel + 1;
        setSelectedDioramaModel(newIndex);

        setTimeout(() => setIsAnimating(false), 300);
    };

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
                    <h2 className={cx(
                        "font-sans text-2xl font-semibold text-white text-left",
                        "transition-opacity duration-300",
                        isAnimating ? "opacity-50" : "opacity-100"
                    )}>
                        {currentContent.title}
                    </h2>
                    <span className="font-mono text-sm font-light text-white">{t.dioramas.subtitle}</span>
                    <div className="h-px bg-white/40 w-full mt-3" />
                </div>

                {/* Scrollable Content */}
                <div
                    className="flex-1 overflow-y-auto px-5 min-h-0"
                    style={scrollbarStyles}
                >
                    <style>{`
                        .dioramas-scroll::-webkit-scrollbar {
                            width: 6px;
                        }
                        .dioramas-scroll::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .dioramas-scroll::-webkit-scrollbar-thumb {
                            background: rgba(255,255,255,0.3);
                            border-radius: 3px;
                        }
                        .dioramas-scroll::-webkit-scrollbar-thumb:hover {
                            background: rgba(255,255,255,0.5);
                        }
                    `}</style>
                    <div className={cx(
                        "flex flex-col gap-4 transition-opacity duration-300 dioramas-scroll pb-2",
                        isAnimating ? "opacity-50" : "opacity-100"
                    )}>
                        {/* First text block */}
                        <p className="font-mono text-sm font-light text-white/90 leading-relaxed">
                            {currentContent.text1}
                        </p>

                        {/* Image */}
                        <div className="w-full aspect-[16/9] rounded-lg overflow-hidden border border-white/50 flex-shrink-0">
                            <img
                                src={currentConfig.image}
                                alt={currentContent.title}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Second text block */}
                        <p className="font-mono text-sm font-light text-white/90 leading-relaxed">
                            {currentContent.text2}
                        </p>
                    </div>
                </div>

                {/* Fixed Footer - Arrows and dots */}
                <div className="flex-shrink-0 px-5 py-2 border-t border-white/20">
                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={handlePrevious}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                            aria-label="Previous model"
                        >
                            <img
                                src="/assets/images/state_arrow.png"
                                alt="Previous"
                                className="w-5 h-5 rotate-180 opacity-60 hover:opacity-100 transition-opacity"
                            />
                        </button>

                        {/* Navigation dots */}
                        <div className="flex items-center gap-2">
                            {dioramaConfig.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        if (!isAnimating && index !== selectedDioramaModel) {
                                            setIsAnimating(true);
                                            setSelectedDioramaModel(index);
                                            setTimeout(() => setIsAnimating(false), 300);
                                        }
                                    }}
                                    className={cx(
                                        "h-2 rounded-full transition-all duration-300 cursor-pointer",
                                        index === selectedDioramaModel
                                            ? "bg-white w-4"
                                            : "bg-white/40 hover:bg-white/60 w-2"
                                    )}
                                    aria-label={`Go to model ${index + 1}`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={handleNext}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                            aria-label="Next model"
                        >
                            <img
                                src="/assets/images/state_arrow.png"
                                alt="Next"
                                className="w-5 h-5 opacity-60 hover:opacity-100 transition-opacity"
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile: Top collapsible panel */}
            <MobileDioramasPanel
                visible={visible}
                currentConfig={currentConfig}
                currentContent={currentContent}
                selectedIndex={selectedDioramaModel}
                isAnimating={isAnimating}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onDotClick={(index) => {
                    if (!isAnimating && index !== selectedDioramaModel) {
                        setIsAnimating(true);
                        setSelectedDioramaModel(index);
                        setTimeout(() => setIsAnimating(false), 300);
                    }
                }}
            />
        </>
    );
}

// Separate mobile component for cleaner code
function MobileDioramasPanel({
    visible,
    currentConfig,
    currentContent,
    selectedIndex,
    isAnimating,
    onPrevious,
    onNext,
    onDotClick
}: {
    visible: boolean;
    currentConfig: typeof dioramaConfig[0];
    currentContent: { title: string; text1: string; text2: string; };
    selectedIndex: number;
    isAnimating: boolean;
    onPrevious: () => void;
    onNext: () => void;
    onDotClick: (index: number) => void;
}) {
    const { t } = useI18n();
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
            style={{ maxWidth: "380px", margin: "0 auto" }}
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
                    "bg-[rgba(12,20,40,0.9)] backdrop-blur-lg",
                    "border-2 border-white/30"
                )}
                style={{ maxHeight: "calc(38%)" }}
            >
                {/* Mobile Header - Always visible, Title left-aligned */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 pt-3 pb-2">
                    <h2
                        className={cx(
                            "font-sans text-lg font-semibold text-white text-left flex-1 cursor-pointer",
                            "transition-opacity duration-300",
                            isAnimating ? "opacity-50" : "opacity-100"
                        )}
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {currentContent.title}
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
                        {t.dioramas.subtitleMobile}
                        {/* Tap to see more hint */}
                        <div className="flex justify-center items-center gap-1.5 mt-2 -mb-2 text-white/60">
                            <img
                                src="/assets/images/state_arrow.png"
                                alt="Expand"
                                className="w-4 h-2.5 rotate-90"
                            />
                            <span className="text-xs font-mono">{t.geely.tapToSeeMore}</span>
                        </div>
                    </div>
                )}

                {/* Mobile Content - Hidden when collapsed */}
                {
                    isExpanded && (
                        <>
                            <div className="h-px bg-white/50 w-full mx-3 flex-shrink-0" style={{ width: 'calc(100% - 24px)' }} />

                            {/* Scrollable content area */}
                            <div
                                className={cx(
                                    "flex-1 overflow-y-auto px-4 py-3 min-h-0",
                                    isAnimating ? "opacity-50" : "opacity-100"
                                )}
                                style={scrollbarStyles}
                            >
                                <style>{`
                            .mobile-dioramas-scroll::-webkit-scrollbar {
                                width: 4px;
                            }
                            .mobile-dioramas-scroll::-webkit-scrollbar-track {
                                background: transparent;
                            }
                            .mobile-dioramas-scroll::-webkit-scrollbar-thumb {
                                background: rgba(255,255,255,0.3);
                                border-radius: 2px;
                            }
                        `}</style>
                                <div className="flex flex-col gap-3 mobile-dioramas-scroll">
                                    {/* First text block */}
                                    <p className="font-mono text-xs font-light text-white/90 leading-relaxed">
                                        {currentContent.text1}
                                    </p>

                                    {/* Image */}
                                    <div className="w-full aspect-[16/9] rounded-lg overflow-hidden border border-white/50 flex-shrink-0">
                                        <img
                                            src={currentConfig.image}
                                            alt={currentContent.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Second text block */}
                                    <p className="font-mono text-xs font-light text-white/90 leading-relaxed">
                                        {currentContent.text2}
                                    </p>
                                </div>
                            </div>

                            {/* Fixed Footer - Arrows and dots */}
                            <div className="flex-shrink-0 px-3 py-1 border-t border-white/20">
                                <div className="flex items-center justify-center gap-3">
                                    <button
                                        onClick={onPrevious}
                                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                                        aria-label="Previous model"
                                    >
                                        <img
                                            src="/assets/images/state_arrow.png"
                                            alt="Previous"
                                            className="w-5 h-5 rotate-180 opacity-60"
                                        />
                                    </button>

                                    {/* Navigation dots */}
                                    <div className="flex items-center gap-2">
                                        {dioramaConfig.map((_: typeof dioramaConfig[0], index: number) => (
                                            <button
                                                key={index}
                                                onClick={() => onDotClick(index)}
                                                className={cx(
                                                    "h-2 rounded-full transition-all duration-300 cursor-pointer",
                                                    index === selectedIndex
                                                        ? "bg-white w-4"
                                                        : "bg-white/40 hover:bg-white/60 w-2"
                                                )}
                                                aria-label={`Go to model ${index + 1}`}
                                            />
                                        ))}
                                    </div>

                                    <button
                                        onClick={onNext}
                                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                                        aria-label="Next model"
                                    >
                                        <img
                                            src="/assets/images/state_arrow.png"
                                            alt="Next"
                                            className="w-5 h-5 opacity-60"
                                        />
                                    </button>
                                </div>
                            </div>
                        </>
                    )
                }
            </div>
        </div>
    );
}

// Export the diorama config for use in canvasBabylon.tsx
export { dioramaConfig };
