import React, { useState } from "react";
import cx from "classnames";

interface InfoPanelProps {
    visible: boolean;
    onClose: () => void;
}

// Placeholder content for Tutorial
function TutorialContent() {
    return (
        <div className="flex flex-col gap-4">
            <div className="w-full h-24 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                <span className="text-white/40 font-mono text-sm">Tutorial content placeholder</span>
            </div>
            <div className="w-full h-16 rounded-lg bg-white/10 border border-white/20" />
            <div className="w-3/4 h-16 rounded-lg bg-white/10 border border-white/20" />
        </div>
    );
}

// Placeholder content for About
function AboutContent() {
    return (
        <div className="flex flex-col gap-4">
            <div className="w-full h-24 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                <span className="text-white/40 font-mono text-sm">About content placeholder</span>
            </div>
            <div className="w-full h-16 rounded-lg bg-white/10 border border-white/20" />
            <div className="w-2/3 h-16 rounded-lg bg-white/10 border border-white/20" />
        </div>
    );
}

export function InfoPanel({ visible, onClose }: InfoPanelProps) {
    const [activeTab, setActiveTab] = useState<0 | 1>(0); // 0 = Tutorial, 1 = About
    const tabs = ["Tutorial", "About"];

    return (
        <>
            {/* Desktop: Centered modal */}
            <div
                className={cx(
                    "hidden md:flex fixed inset-0 z-[70] items-center justify-center",
                    "transition-all duration-300",
                    visible ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
            >
                {/* Backdrop */}
                <div
                    className={cx(
                        "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
                        visible ? "opacity-100" : "opacity-0"
                    )}
                    onClick={onClose}
                />

                {/* Panel */}
                <div
                    className={cx(
                        "relative w-[90%] max-w-[500px] max-h-[70vh] flex flex-col rounded-xl overflow-hidden",
                        "bg-[rgba(12,20,40,0.9)] backdrop-blur-lg",
                        "border border-white/40",
                        "transition-all duration-300",
                        visible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
                    )}
                >
                    {/* Header with tabs and close button */}
                    <div className="flex-shrink-0 px-5 pt-4 pb-3">
                        <div className="flex items-center justify-between">
                            {/* Spacer for centering */}
                            <div className="w-6" />

                            {/* Tab buttons */}
                            <div className="flex items-center gap-4">
                                {tabs.map((tab, index) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(index as 0 | 1)}
                                        className={cx(
                                            "px-4 py-2 rounded-full font-mono text-sm transition-all duration-300",
                                            activeTab === index
                                                ? "bg-white/20 text-white"
                                                : "text-white/50 hover:text-white/80"
                                        )}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity"
                                aria-label="Close"
                            >
                                <img src="/assets/images/close.png" alt="Close" className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="h-px bg-white/30 w-full mt-3" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-5 pb-5 min-h-0">
                        {activeTab === 0 ? <TutorialContent /> : <AboutContent />}
                    </div>
                </div>
            </div>

            {/* Mobile: Full panel like chat window */}
            <div
                className={cx(
                    "md:hidden fixed left-4 right-4 z-[70]",
                    "transition-all duration-300",
                    "[--info-top:84px]",
                    visible ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                style={{
                    top: "var(--info-top)",
                    height: "calc(var(--app-vh, 100dvh) - var(--info-top) - max(env(safe-area-inset-bottom,0px), 16px))"
                }}
            >
                <div
                    className={cx(
                        "relative w-full h-full flex flex-col rounded-xl overflow-hidden",
                        "bg-[rgba(12,20,40,0.9)] backdrop-blur-lg",
                        "border border-white/40",
                        "transition-all duration-300",
                        visible ? "translate-y-0" : "translate-y-6"
                    )}
                >
                    {/* Header with tabs and close button */}
                    <div className="flex-shrink-0 px-4 pt-3 pb-2">
                        <div className="flex items-center justify-between">
                            {/* Spacer for centering */}
                            <div className="w-5" />

                            {/* Tab buttons */}
                            <div className="flex items-center gap-3">
                                {tabs.map((tab, index) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(index as 0 | 1)}
                                        className={cx(
                                            "px-3 py-1.5 rounded-full font-mono text-sm transition-all duration-300",
                                            activeTab === index
                                                ? "bg-white/20 text-white"
                                                : "text-white/50 hover:text-white/80"
                                        )}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="w-5 h-5 flex items-center justify-center hover:opacity-70 transition-opacity"
                                aria-label="Close"
                            >
                                <img src="/assets/images/close.png" alt="Close" className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="h-px bg-white/30 w-full mt-2" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
                        {activeTab === 0 ? <TutorialContent /> : <AboutContent />}
                    </div>
                </div>
            </div>
        </>
    );
}

export default InfoPanel;
