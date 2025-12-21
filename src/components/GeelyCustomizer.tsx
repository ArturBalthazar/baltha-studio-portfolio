import React, { useState, useEffect, useRef } from "react";
import cx from "classnames";
import { useUI } from "../state";
import { useI18n } from "../i18n";

interface GeelyCustomizerProps {
    visible: boolean;
    onColorSelect?: (color: string) => void;
    onTrimSelect?: (trim: string) => void;
    onToggleView?: () => void;
}

// Content configuration (non-text values only - text comes from translations)
const geelyConfig = {
    colors: ["green", "gray", "white", "silver"] as const,
    versions: [
        { id: "pro", label: "EX2 PRO" },
        { id: "max", label: "EX2 MAX" }
    ] as const
};

export function GeelyCustomizer({
    visible,
    onColorSelect,
    onTrimSelect,
    onToggleView
}: GeelyCustomizerProps) {
    // Mobile expand states
    const [isExpanded, setIsExpanded] = useState(false); // Start collapsed
    const [isBodyColorExpanded, setIsBodyColorExpanded] = useState(true); // Body Color starts expanded
    const [isVersionExpanded, setIsVersionExpanded] = useState(false); // Version starts collapsed

    // Save/restore states for interior view toggle
    const savedExpandStatesRef = useRef<{
        isExpanded: boolean;
        isBodyColorExpanded: boolean;
        isVersionExpanded: boolean;
    } | null>(null);

    const [selectedColor, setSelectedColor] = useState("green");
    const [selectedVersion, setSelectedVersion] = useState("max"); // Default to EX2 MAX

    const geelyCustomizeCallback = useUI((st) => st.geelyCustomizeCallback);
    const isInteriorView = useUI((st) => st.isInteriorView);
    const setIsInteriorView = useUI((st) => st.setIsInteriorView);
    const { t } = useI18n();

    // Handle interior view changes - save/restore expand states
    useEffect(() => {
        if (isInteriorView) {
            // Entering interior view - save current states but keep panel expanded
            savedExpandStatesRef.current = {
                isExpanded,
                isBodyColorExpanded,
                isVersionExpanded
            };
            // Panel stays expanded as-is when entering interior view
        } else if (savedExpandStatesRef.current) {
            // Leaving interior view - restore saved states
            setIsExpanded(savedExpandStatesRef.current.isExpanded);
            setIsBodyColorExpanded(savedExpandStatesRef.current.isBodyColorExpanded);
            setIsVersionExpanded(savedExpandStatesRef.current.isVersionExpanded);
            savedExpandStatesRef.current = null;
        }
    }, [isInteriorView]);

    // Reset to collapsed when visible becomes true (approaching the car)
    useEffect(() => {
        if (visible && !isInteriorView) {
            setIsExpanded(false);
            setIsBodyColorExpanded(true);
            setIsVersionExpanded(false);
        }
    }, [visible]);

    const handleToggleView = () => {
        setIsInteriorView(!isInteriorView);
        onToggleView?.();
    };

    const handleColorClick = (color: string) => {
        setSelectedColor(color);
        onColorSelect?.(color);

        if (geelyCustomizeCallback) {
            geelyCustomizeCallback({ color });
        }
    };

    const handleVersionClick = (version: string) => {
        setSelectedVersion(version);
        onTrimSelect?.(version);

        if (geelyCustomizeCallback) {
            geelyCustomizeCallback({ trim: version });
        }
    };

    // Mobile section toggle handlers - mutually exclusive
    const handleBodyColorToggle = () => {
        if (isBodyColorExpanded) {
            setIsBodyColorExpanded(false);
        } else {
            setIsBodyColorExpanded(true);
            setIsVersionExpanded(false); // Collapse version when expanding body color
        }
    };

    const handleVersionToggle = () => {
        if (isVersionExpanded) {
            setIsVersionExpanded(false);
        } else {
            setIsVersionExpanded(true);
            setIsBodyColorExpanded(false); // Collapse body color when expanding version
        }
    };

    // Shared color button renderer
    const renderColorButton = (color: string, isMobile: boolean = false) => (
        <button
            key={color}
            onClick={() => handleColorClick(color)}
            className={cx(
                "relative border border-white/50 rounded-lg p-0 cursor-pointer",
                "transition-all duration-200 hover:scale-105 hover:border-white/80",
                isMobile
                    ? "h-12 flex-1 min-w-[60px] flex justify-center items-center"
                    : "h-14 w-full aspect-square",
                selectedColor === color
                    ? isMobile
                        ? "bg-gradient-to-t from-[rgba(180,173,230,0.4)] to-[rgba(255,181,218,0.2)]"
                        : "bg-gradient-to-t from-[rgba(180,173,230,0.3)] to-[rgba(255,181,218,0.15)]"
                    : "bg-transparent"
            )}
        >
            <img
                src={`/assets/images/body_${color}.png`}
                alt={t.geely.bodyColor}
                className={cx(
                    "object-contain rounded-lg",
                    isMobile ? "w-[100%] h-[100%]" : "w-full h-full"
                )}
            />

            {selectedColor === color && (
                <div className="absolute inset-0 border-1 border-white rounded-lg pointer-events-none" />
            )}
        </button>
    );

    // Shared version button renderer
    const renderVersionButton = (version: typeof geelyConfig.versions[number], isMobile: boolean = false) => {
        const isSelected = selectedVersion === version.id;

        return (
            <button
                key={version.id}
                onClick={() => handleVersionClick(version.id)}
                className={cx(
                    "relative rounded-lg overflow-hidden",
                    "cursor-pointer transition-all duration-200 hover:scale-[1.02]",
                    "flex items-center justify-center select-none",
                    isMobile ? "flex-1 min-w-[100px] h-12" : "flex-1 h-12",
                    !isSelected && "border border-white/50 hover:border-white/80"
                )}
            >
                {/* Selected state: gradient + halo + crisp border */}
                {isSelected && (
                    <>
                        <div
                            className="absolute inset-0 rounded-lg"
                            style={{
                                background: isMobile
                                    ? "linear-gradient(to top, rgba(180, 173, 230, 0.4), rgba(255, 181, 218, 0.2))"
                                    : "linear-gradient(to top, rgba(180, 173, 230, 0.3), rgba(255, 181, 218, 0.15))"
                            }}
                        />
                        <div
                            className="pointer-events-none absolute inset-0 rounded-lg border border-white"
                            style={{ filter: "blur(2px)", transform: "scale(1.02)", transformOrigin: "center" }}
                            aria-hidden
                        />
                        <div
                            className="pointer-events-none absolute inset-0 rounded-lg border border-white/70"
                            aria-hidden
                        />
                    </>
                )}
                <span className="text-white text-lg font-medium tracking-wide relative z-10">
                    {version.label}
                </span>
            </button>
        );
    };

    // Shared interior/exterior button renderer
    const renderViewToggleButton = (isMobile: boolean = false) => (
        <button
            onClick={handleToggleView}
            className={cx(
                "flex items-center justify-center gap-2.5",
                "font-sans font-medium text-white",
                "bg-transparent border border-white/60 rounded-lg",
                "cursor-pointer transition-all duration-200",
                "hover:border-white hover:shadow-[0_0_8px_2px_rgba(255,255,255,0.3)]",
                isMobile ? "text-base py-2.5 px-3 mt-3" : "text-lg py-3 px-4"
            )}
        >
            <img
                src={isInteriorView ? "/assets/images/exterior.png" : "/assets/images/interior.png"}
                alt={isInteriorView ? t.geely.exteriorView : t.geely.interiorView}
                className="w-5 h-5"
            />
            {isInteriorView ? t.geely.exteriorView : t.geely.interiorView}
        </button>
    );

    return (
        <>
            {/* Desktop: Left side panel */}
            <div className={cx(
                "hidden md:flex absolute top-[50%] translate-y-[-50%] left-16 w-[400px] max-h-[65vh]",
                "flex-col rounded-xl overflow-hidden scrollbar-thin",
                "bg-[rgba(12,20,40,0.75)] backdrop-blur-lg",
                "border border-white/30",
                "transition-all duration-500",
                visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10 pointer-events-none"
            )}>
                <div className="flex flex-col gap-4 p-5 overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-white/40">
                    {/* Header */}
                    <h2 className="font-sans text-2xl font-semibold text-white">{t.geely.title}</h2>
                    <span className="-mt-2 font-mono text-sm font-light text-white">{t.geely.subtitle}</span>

                    <div className="h-px bg-white/40 -mt-2 w-full flex-shrink-0" />

                    {/* Body Color */}
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center font-mono text-sm font-light text-white/90">
                            <span>{t.geely.bodyColor}</span>
                        </div>
                        <div className="flex gap-2">
                            {geelyConfig.colors.map((color) => renderColorButton(color, false))}
                        </div>
                    </div>

                    <div className="h-px bg-white/40 w-full flex-shrink-0" />

                    {/* Version */}
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center font-mono text-sm font-light text-white/90">
                            <span>{t.geely.version}</span>
                        </div>
                        <div className="flex gap-3">
                            {geelyConfig.versions.map((version) => renderVersionButton(version, false))}
                        </div>
                    </div>

                    <div className="h-px bg-white/40 w-full flex-shrink-0" />

                    {/* Interior View Button */}
                    {renderViewToggleButton(false)}
                </div>
            </div>

            {/* Mobile: Top collapsible panel */}
            <div
                className={cx(
                    "md:hidden absolute top-16 left-3 right-3",
                    "flex flex-col rounded-xl overflow-visible",
                    "transition-all duration-300",
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
                <div className={cx(
                    "relative flex flex-col rounded-xl overflow-hidden",
                    "bg-[rgba(12,20,40,0.9)] backdrop-blur-lg",
                    "border-2 border-white/30 max-h-[calc(50vh-96px)]"
                )}>
                    {/* Mobile Header - Always visible */}
                    <div
                        className="flex items-center justify-between p-4 pt-3 pb-2 cursor-pointer"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <h2 className="font-sans text-xl font-semibold text-white ">{t.geely.title}</h2>
                        <img
                            src="/assets/images/state_arrow.png"
                            alt="Expand"
                            className={cx(
                                "w-6 h-4 transition-transform duration-300",
                                isExpanded ? "-rotate-90" : "rotate-90"
                            )}
                        />
                    </div>

                    {/* Description text - only visible when collapsed, clickable to expand */}
                    {!isExpanded && (
                        <div
                            className="font-mono text-sm p-4 pt-0 font-light text-white cursor-pointer"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {t.geely.subtitle}
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
                    {isExpanded && (
                        <div className="flex flex-col px-3 pb-3 overflow-y-auto">
                            <div className="h-px bg-white/50 w-full flex-shrink-0" />

                            {/* Body Color Section - Collapsible */}
                            <div className="flex flex-col">
                                <div
                                    className="flex justify-between items-center py-3 cursor-pointer"
                                    onClick={handleBodyColorToggle}
                                >
                                    <span className="font-mono text-sm font-light text-white">{t.geely.bodyColor}</span>
                                    <img
                                        src="/assets/images/state_arrow.png"
                                        alt="Expand"
                                        className={cx(
                                            "w-5 h-3 transition-transform duration-300",
                                            isBodyColorExpanded ? "-rotate-90" : "rotate-90"
                                        )}
                                    />
                                </div>
                                {isBodyColorExpanded && (
                                    <div className="flex gap-2 flex-wrap pb-3">
                                        {geelyConfig.colors.map((color) => renderColorButton(color, true))}
                                    </div>
                                )}
                            </div>

                            <div className="h-px bg-white/50 w-full flex-shrink-0" />

                            {/* Version Section - Collapsible */}
                            <div className="flex flex-col">
                                <div
                                    className="flex justify-between items-center py-3 cursor-pointer"
                                    onClick={handleVersionToggle}
                                >
                                    <span className="font-mono text-sm font-light text-white">{t.geely.version}</span>
                                    <img
                                        src="/assets/images/state_arrow.png"
                                        alt="Expand"
                                        className={cx(
                                            "w-5 h-3 transition-transform duration-300",
                                            isVersionExpanded ? "-rotate-90" : "rotate-90"
                                        )}
                                    />
                                </div>
                                {isVersionExpanded && (
                                    <div className="flex gap-2.5 flex-wrap pb-3">
                                        {geelyConfig.versions.map((version) => renderVersionButton(version, true))}
                                    </div>
                                )}
                            </div>

                            <div className="h-px bg-white/50 w-full flex-shrink-0" />

                            {/* Interior View Button */}
                            {renderViewToggleButton(true)}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
