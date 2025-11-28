import React, { useState } from "react";
import cx from "classnames";
import { useUI } from "../state";
import { trimConfigs } from "./carConfig";

interface BydCustomizerProps {
    visible: boolean;
    onColorSelect?: (color: string) => void;
    onTrimSelect?: (trim: string) => void;
    onToggleView?: () => void;
}

export function BydCustomizer({
    visible,
    onColorSelect,
    onTrimSelect,
    onToggleView
}: BydCustomizerProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [selectedColor, setSelectedColor] = useState("yellow");
    const [selectedTrim, setSelectedTrim] = useState("lightBlue");
    const bydCustomizeCallback = useUI((st) => st.bydCustomizeCallback);
    const isInteriorView = useUI((st) => st.isInteriorView);
    const setIsInteriorView = useUI((st) => st.setIsInteriorView);

    // Helper to check if color/trim is allowed
    const isColorAllowed = (color: string) => {
        if (isInteriorView) {
            // Interior: Color must be allowed by current trim
            return trimConfigs[selectedTrim]?.allowed.includes(color);
        }
        return true; // Exterior: All colors allowed
    };

    const isTrimAllowed = (trim: string) => {
        if (!isInteriorView) {
            // Exterior: Trim must allow current color
            return trimConfigs[trim]?.allowed.includes(selectedColor);
        }
        return true; // Interior: All trims allowed
    };

    const handleToggleView = () => {
        setIsInteriorView(!isInteriorView);
        onToggleView?.();
    };

    const handleColorClick = (color: string) => {
        if (!isColorAllowed(color)) return;

        setSelectedColor(color);
        onColorSelect?.(color);

        // Auto-switch trim if in exterior mode and current trim becomes invalid
        if (!isInteriorView) {
            const validTrims = Object.keys(trimConfigs).filter(t => trimConfigs[t].allowed.includes(color));
            if (!validTrims.includes(selectedTrim)) {
                const nextTrim = validTrims[0];
                if (nextTrim) {
                    setSelectedTrim(nextTrim);
                    onTrimSelect?.(nextTrim);
                    // Call callback with BOTH
                    if (bydCustomizeCallback) {
                        bydCustomizeCallback({ color, trim: nextTrim });
                    }
                    return;
                }
            }
        }

        // Call callback
        if (bydCustomizeCallback) {
            bydCustomizeCallback({ color });
        }
    };

    const handleTrimClick = (trim: string) => {
        if (!isTrimAllowed(trim)) return;

        setSelectedTrim(trim);
        onTrimSelect?.(trim);

        if (bydCustomizeCallback) {
            bydCustomizeCallback({ trim });
        }
    };

    // if (!visible) return null;

    return (
        <>
            {/* Desktop: Left side panel */}
            <div className={cx(
                "hidden md:flex absolute top-[50%] translate-y-[-50%] left-16 max-w-[400px]",
                "flex-col rounded-xl overflow-hidden",
                "bg-[rgba(12,20,40,0.6)] backdrop-blur-sm",
                "border-2 border-white/30",
                "transition-all duration-500",
                visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10 pointer-events-none"
            )}>
                <div className="flex flex-col gap-3 p-5 pt-4 overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-white/40">
                    <h2 className="font-sans text-3xl font-semibold text-white">Customize your BYD</h2>

                    <div className="h-px bg-white/50 w-full" />

                    {/* Body Color */}
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center font-mono text-base font-light text-white">
                            <span>Body Color</span>
                        </div>
                        <div className="flex gap-2.5">
                            {["yellow", "white", "black", "pink"].map((color) => (
                                <button
                                    key={color}
                                    onClick={() => handleColorClick(color)}
                                    className={cx(
                                        "relative bg-transparent border border-white/50 rounded-lg p-0",
                                        "cursor-pointer transition-transform duration-200 hover:scale-105",
                                        "h-16 aspect-square",
                                        !isColorAllowed(color) && "opacity-30 cursor-not-allowed grayscale hover:scale-100"
                                    )}
                                    disabled={!isColorAllowed(color)}
                                >
                                    <img
                                        src={`/assets/images/body_${color}.png`}
                                        alt={color}
                                        className="w-full h-full object-contain rounded-lg"
                                    />
                                    {selectedColor === color && (
                                        <div className="absolute inset-0 border border-white rounded-lg shadow-[0_0_5px_1px_rgba(255,255,255,0.6)] pointer-events-none" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-white/50 w-full" />

                    {/* Interior Trims */}
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center font-mono text-base font-light text-white">
                            <span>Interior Trims</span>
                        </div>
                        <div className="flex gap-2.5">
                            {["darkBlue", "lightBlue", "pink"].map((trim) => (
                                <button
                                    key={trim}
                                    onClick={() => handleTrimClick(trim)}
                                    className={cx(
                                        "relative bg-transparent border border-white/50 rounded-lg p-0",
                                        "cursor-pointer transition-transform duration-200 hover:scale-105",
                                        "h-16 aspect-[1.4/1]",
                                        !isTrimAllowed(trim) && "opacity-30 cursor-not-allowed grayscale hover:scale-100"
                                    )}
                                    disabled={!isTrimAllowed(trim)}
                                >
                                    <img
                                        src={`/assets/images/trim_${trim}.png`}
                                        alt={trim}
                                        className="w-full h-full object-cover rounded-lg"
                                    />
                                    {selectedTrim === trim && (
                                        <div className="absolute inset-0 border border-white rounded-lg shadow-[0_0_5px_1px_rgba(255,255,255,0.6)] pointer-events-none" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-white/50 w-full" />



                    {/* Interior View Button */}
                    <button
                        onClick={handleToggleView}
                        className={cx(
                            "flex items-center justify-center gap-2.5",
                            "font-sans font-medium text-xl text-white",
                            "bg-transparent border border-white/60 rounded-lg",
                            "py-2.5 px-4",
                            "cursor-pointer transition-all duration-200",
                            "hover:shadow-[0_0_5px_1px_rgba(255,255,255,0.6)]"
                        )}
                    >
                        <img
                            src={isInteriorView ? "/assets/images/exterior.png" : "/assets/images/interior.png"}
                            alt={isInteriorView ? "Exterior" : "Interior"}
                            className="w-5 h-5"
                        />
                        {isInteriorView ? "Exterior view" : "Interior view"}
                    </button>
                </div>
            </div>

            {/* Mobile: Top collapsible panel */}
            <div className={cx(
                "md:hidden absolute top-16 left-3 right-3",
                "flex flex-col rounded-xl overflow-hidden",
                "bg-[rgba(12,20,40,0.6)] backdrop-blur-sm",
                "border-2 border-white/30",
                "transition-all duration-300",
                isExpanded ? "max-h-[70vh]" : "max-h-[60px]",
                visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10 pointer-events-none"
            )}>
                {/* Mobile Header - Always visible */}
                <div
                    className="flex items-center justify-between p-4 pt-2 pb-1 cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <h2 className="font-sans text-xl font-semibold text-white">Customize your BYD</h2>
                    <img
                        src="/assets/images/state_arrow.png"
                        alt="Expand"
                        className={cx(
                            "w-6 h-4 transition-transform duration-300",
                            isExpanded ? "-rotate-90" : "rotate-90"
                        )}
                    />
                </div>

                {/* Mobile Content - Hidden when collapsed */}
                {isExpanded && (
                    <div className="flex flex-col gap-4 px-3 pb-3 overflow-y-auto">
                        <div className="h-px bg-white w-full" />

                        {/* Body Color */}
                        <div className="flex flex-col gap-2">
                            <div className="-mt-2 flex justify-between items-center font-mono text-sm font-light text-white">
                                <span>Body Color</span>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {["yellow", "white", "black", "pink"].map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => handleColorClick(color)}
                                        disabled={!isColorAllowed(color)}
                                        className={cx(
                                            "relative flex justify-center items-center bg-transparent border border-white/50 rounded-lg p-0",
                                            "cursor-pointer transition-transform duration-200 hover:scale-105",
                                            "h-12 flex-1 min-w-[60px]",
                                            !isColorAllowed(color) && "opacity-30 cursor-not-allowed grayscale hover:scale-100"
                                        )}
                                    >
                                        <img
                                            src={`/assets/images/body_${color}.png`}
                                            alt={color}
                                            className="w-[100%] h-[100%] object-contain rounded-lg"
                                        />
                                        {selectedColor === color && (
                                            <div className="absolute inset-0 border border-white rounded-lg shadow-[0_0_5px_1px_rgba(255,255,255,0.6)] pointer-events-none" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-px bg-white w-full" />

                        {/* Interior Trims */}
                        <div className="flex flex-col gap-2">
                            <div className="-mt-2 flex justify-between items-center font-mono text-sm font-light text-white">
                                <span>Interior Trims</span>
                            </div>
                            <div className="flex gap-2.5 flex-wrap">
                                {["darkBlue", "lightBlue", "pink"].map((trim) => (
                                    <button
                                        key={trim}
                                        onClick={() => handleTrimClick(trim)}
                                        disabled={!isTrimAllowed(trim)}
                                        className={cx(
                                            "relative bg-transparent border border-white/50 rounded-lg p-0",
                                            "cursor-pointer transition-transform duration-200 hover:scale-105",
                                            "h-14 flex-1 min-w-[80px]",
                                            !isTrimAllowed(trim) && "opacity-30 cursor-not-allowed grayscale hover:scale-100"
                                        )}
                                    >
                                        <img
                                            src={`/assets/images/trim_${trim}.png`}
                                            alt={trim}
                                            className="w-full h-full object-cover rounded-lg"
                                        />
                                        {selectedTrim === trim && (
                                            <div className="absolute inset-0 border border-white rounded-lg shadow-[0_0_5px_1px_rgba(255,255,255,0.6)] pointer-events-none" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-px bg-white w-full" />

                        {/* Interior View Button */}
                        <button
                            onClick={handleToggleView}
                            className={cx(
                                "flex items-center justify-center gap-2.5",
                                "font-sans font-medium text-base text-white",
                                "bg-transparent border border-white/60 rounded-lg",
                                "py-2 px-3",
                                "cursor-pointer transition-all duration-200",
                                "hover:shadow-[0_0_5px_1px_rgba(255,255,255,0.6)]"
                            )}
                        >
                            <img
                                src={isInteriorView ? "/assets/images/exterior.png" : "/assets/images/interior.png"}
                                alt={isInteriorView ? "Exterior" : "Interior"}
                                className="w-5 h-5"
                            />
                            {isInteriorView ? "Exterior view" : "Interior view"}
                        </button>
                    </div>
                )}
            </div>

        </>
    );
}
