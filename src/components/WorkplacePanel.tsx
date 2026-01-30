import React, { useState, useEffect, useRef } from "react";
import cx from "classnames";
import { useUI, S } from "../state";
import { getWorkplaceConfig, WorkplaceConfig, ProjectConfig, isSingleProjectSection } from "./workplaceConfig";
import { ProjectContent } from "./ProjectContent";

interface WorkplacePanelProps {
    visible: boolean;
}

// Custom scrollbar styles
const scrollbarStyles: React.CSSProperties = {
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(255,255,255,0.3) transparent'
};

export function WorkplacePanel({ visible }: WorkplacePanelProps) {
    // Use activeWorkplaceState instead of navigation state - this is set by proximity detection
    const activeWorkplaceState = useUI((st) => st.activeWorkplaceState);
    const selectedProjectIndex = useUI((st) => st.selectedProjectIndex);
    const setSelectedProjectIndex = useUI((st) => st.setSelectedProjectIndex);

    // Get workplace config based on which anchor the ship is near (not navigation state)
    const currentConfig = activeWorkplaceState !== null ? getWorkplaceConfig(activeWorkplaceState) : null;

    // For animation when switching projects
    const [isAnimating, setIsAnimating] = useState(false);

    // Keep track of last valid config for smooth fade-out
    const lastValidConfig = useRef<WorkplaceConfig | null>(null);
    const [shouldRender, setShouldRender] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Ref for scrollable content container
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Update last valid config when we have one
    useEffect(() => {
        if (currentConfig) {
            lastValidConfig.current = currentConfig;
        }
    }, [currentConfig]);

    // Handle delayed show/hide for smooth transitions
    useEffect(() => {
        if (visible && currentConfig) {
            // Show: render immediately, then animate in
            setShouldRender(true);
            // Small delay to ensure DOM is ready for transition
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setIsVisible(true);
                });
            });
        } else if (!visible) {
            // Hide: animate out, then remove from DOM
            setIsVisible(false);
            const timer = setTimeout(() => {
                setShouldRender(false);
            }, 500); // Match transition duration
            return () => clearTimeout(timer);
        }
    }, [visible, currentConfig]);

    // Reset project index when active workplace changes
    useEffect(() => {
        if (activeWorkplaceState !== null) {
            setSelectedProjectIndex(0);
        }
    }, [activeWorkplaceState, setSelectedProjectIndex]);

    // Scroll to top when project changes
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [selectedProjectIndex]);

    // Use current config if available, otherwise use last valid for fade-out
    const workplaceConfig = currentConfig || lastValidConfig.current;

    if (!shouldRender || !workplaceConfig) return null;

    const currentProject = workplaceConfig.projects[selectedProjectIndex] || workplaceConfig.projects[0];
    const projectCount = workplaceConfig.projects.length;

    const handlePrevious = () => {
        if (isAnimating || projectCount <= 1) return;
        setIsAnimating(true);
        const newIndex = selectedProjectIndex === 0 ? projectCount - 1 : selectedProjectIndex - 1;
        setSelectedProjectIndex(newIndex);
        setTimeout(() => setIsAnimating(false), 300);
    };

    const handleNext = () => {
        if (isAnimating || projectCount <= 1) return;
        setIsAnimating(true);
        const newIndex = selectedProjectIndex === projectCount - 1 ? 0 : selectedProjectIndex + 1;
        setSelectedProjectIndex(newIndex);
        setTimeout(() => setIsAnimating(false), 300);
    };

    return (
        <>
            {/* Desktop: Left side panel */}
            <div className={cx(
                "hidden md:flex absolute top-18 bottom-20 left-16 w-[35%]",
                "flex-col rounded-xl overflow-hidden",
                "bg-[rgba(12,20,40,0.75)] backdrop-blur-lg",
                "border border-white/30",
                "transition-all duration-500",
                isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10 pointer-events-none"
            )}
                style={{ maxHeight: 'calc(100vh - 9.5rem)' }}
            >
                {/* Fixed Header - Company Info */}
                <div className="flex-shrink-0 px-5 pt-4 pb-3">
                    {/* Two-column layout: Logo | Text Info (3 rows) */}
                    <div className="flex items-start gap-4">
                        {/* Left column: Logo */}
                        {workplaceConfig.showCompanyLogo && workplaceConfig.companyLogoPath && (
                            <img
                                src={workplaceConfig.companyLogoPath}
                                alt={workplaceConfig.companyName}
                                className="h-16 w-auto object-contain rounded-md border border-white/80 flex-shrink-0"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                        )}

                        {/* Right column: Three rows of text */}
                        <div className="flex flex-col justify-center min-w-0">
                            {/* Row 1: Company Name */}
                            <h2 className="font-sans text-xl font-semibold text-white -mb-1.5">
                                {workplaceConfig.companyName}
                            </h2>

                            {/* Row 2: Period • Location */}
                            {(workplaceConfig.period || workplaceConfig.location) && (
                                <div className="flex items-center gap-x-2 flex-wrap">
                                    {workplaceConfig.period && (
                                        <span className="text-white/60 text-xs font-mono whitespace-nowrap">{workplaceConfig.period}</span>
                                    )}
                                    {workplaceConfig.period && workplaceConfig.location && (
                                        <span className="text-white/60">•</span>
                                    )}
                                    {workplaceConfig.location && (
                                        <span className="text-white/60 text-xs font-mono whitespace-nowrap">{workplaceConfig.location}</span>
                                    )}
                                </div>
                            )}

                            {/* Row 3: Role */}
                            <p className="text-white/90 text-sm font-mono">
                                {workplaceConfig.role}
                            </p>
                        </div>
                    </div>

                    <div className="h-px bg-white/40 w-full mt-3" />
                </div>

                {/* Scrollable Content - Project Details */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto px-5 min-h-0"
                    style={scrollbarStyles}
                >
                    <style>{`
                        .workplace-scroll::-webkit-scrollbar {
                            width: 6px;
                        }
                        .workplace-scroll::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .workplace-scroll::-webkit-scrollbar-thumb {
                            background: rgba(255,255,255,0.3);
                            border-radius: 3px;
                        }
                        .workplace-scroll::-webkit-scrollbar-thumb:hover {
                            background: rgba(255,255,255,0.5);
                        }
                    `}</style>
                    <div className="flex flex-col gap-4 workplace-scroll pb-2">
                        {/* Project Info - Two column layout: Logo | Title + Description */}
                        {!isSingleProjectSection(workplaceConfig) && (
                            <div className="flex items-start gap-4 pt-2">
                                {/* Left column: Logo */}
                                {currentProject?.showLogo && currentProject?.logoPath && (
                                    <img
                                        src={currentProject.logoPath}
                                        alt={currentProject.title}
                                        className="h-12 w-auto object-contain rounded-3xl border border-white"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                )}
                                {/* Right column: Title (row 1) + Description (row 2) */}
                                <div className="flex flex-col gap-1 flex-1 min-w-0">
                                    <h3 className="font-sans text-lg font-medium text-white leading-tight">
                                        {currentProject?.title}
                                    </h3>
                                    <p className="font-mono text-sm font-light text-white/70 leading-snug">
                                        {currentProject?.description}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Project Content */}
                        <ProjectContent contentBlocks={currentProject?.contentBlocks} />
                    </div>
                </div>

                {/* Fixed Footer - Arrows and dots (only if multiple projects) */}
                {projectCount > 1 && (
                    <div className="flex-shrink-0 px-5 py-2 border-t border-white/20">
                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={handlePrevious}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                                aria-label="Previous project"
                            >
                                <img
                                    src="/assets/images/state_arrow.png"
                                    alt="Previous"
                                    className="w-5 h-5 rotate-180 opacity-60 hover:opacity-100 transition-opacity"
                                />
                            </button>

                            {/* Navigation dots */}
                            <div className="flex items-center gap-2">
                                {workplaceConfig.projects.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            if (!isAnimating && index !== selectedProjectIndex) {
                                                setIsAnimating(true);
                                                setSelectedProjectIndex(index);
                                                setTimeout(() => setIsAnimating(false), 300);
                                            }
                                        }}
                                        className={cx(
                                            "h-2 rounded-full transition-all duration-300 cursor-pointer",
                                            index === selectedProjectIndex
                                                ? "bg-white w-4"
                                                : "bg-white/40 hover:bg-white/60 w-2"
                                        )}
                                        aria-label={`Go to project ${index + 1}`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={handleNext}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                                aria-label="Next project"
                            >
                                <img
                                    src="/assets/images/state_arrow.png"
                                    alt="Next"
                                    className="w-5 h-5 opacity-60 hover:opacity-100 transition-opacity"
                                />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile: Top collapsible panel */}
            <MobileWorkplacePanel
                visible={isVisible}
                workplaceConfig={workplaceConfig}
                currentProject={currentProject}
                selectedIndex={selectedProjectIndex}
                projectCount={projectCount}
                isAnimating={isAnimating}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onDotClick={(index) => {
                    if (!isAnimating && index !== selectedProjectIndex) {
                        setIsAnimating(true);
                        setSelectedProjectIndex(index);
                        setTimeout(() => setIsAnimating(false), 300);
                    }
                }}
            />
        </>
    );
}

// Separate mobile component for cleaner code
function MobileWorkplacePanel({
    visible,
    workplaceConfig,
    currentProject,
    selectedIndex,
    projectCount,
    isAnimating,
    onPrevious,
    onNext,
    onDotClick
}: {
    visible: boolean;
    workplaceConfig: WorkplaceConfig;
    currentProject: ProjectConfig | undefined;
    selectedIndex: number;
    projectCount: number;
    isAnimating: boolean;
    onPrevious: () => void;
    onNext: () => void;
    onDotClick: (index: number) => void;
}) {
    // Ref for scrollable content container
    const mobileScrollRef = useRef<HTMLDivElement>(null);

    // Scroll to top when project changes
    useEffect(() => {
        if (mobileScrollRef.current) {
            mobileScrollRef.current.scrollTop = 0;
        }
    }, [selectedIndex]);

    // Check if this is personal projects (no period/location)
    const isPersonalProjects = !workplaceConfig.period && !workplaceConfig.location;

    return (
        <div
            className={cx(
                "md:hidden absolute top-16 left-3 right-3",
                "flex flex-col rounded-xl overflow-hidden",
                "transition-all duration-300",
                visible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-10 pointer-events-none"
            )}
            style={{ maxWidth: "380px", margin: "0 auto", maxHeight: "calc(50vh - 100px)" }}
        >
            {/* Panel content */}
            <div
                className={cx(
                    "relative flex flex-col rounded-xl overflow-hidden",
                    "bg-[rgba(12,20,40,0.9)] backdrop-blur-lg",
                    "border-2 border-white/30"
                )}
                style={{ maxHeight: "100%" }}
            >
                {/* Scrollable content - everything scrolls together */}
                <div
                    ref={mobileScrollRef}
                    className="flex-1 overflow-y-auto px-4 py-3 min-h-0"
                    style={scrollbarStyles}
                >
                    {/* Two-column layout: Logo | Text Info */}
                    <div className="flex items-start gap-3 mb-3">
                        {/* Left column: Logo */}
                        {workplaceConfig.showCompanyLogo && workplaceConfig.companyLogoPath && (
                            <img
                                src={workplaceConfig.companyLogoPath}
                                alt={workplaceConfig.companyName}
                                className="h-12 w-auto object-contain rounded-md border border-white/80 flex-shrink-0"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                        )}

                        {/* Right column: Two rows of text */}
                        <div className="flex flex-col justify-center min-w-0">
                            {/* Row 1: Company Name */}
                            <h2 className="font-sans text-xl font-semibold text-white">
                                {workplaceConfig.companyName}
                            </h2>

                            {/* Row 2: Period • Location */}
                            {(workplaceConfig.period || workplaceConfig.location) && (
                                <div className="flex items-center gap-x-1.5 mt-0.5 flex-wrap">
                                    {workplaceConfig.period && (
                                        <span className="text-white/60 text-xs font-mono whitespace-nowrap">{workplaceConfig.period}</span>
                                    )}
                                    {workplaceConfig.period && workplaceConfig.location && (
                                        <span className="text-white/60 text-xs">•</span>
                                    )}
                                    {workplaceConfig.location && (
                                        <span className="text-white/60 text-xs font-mono whitespace-nowrap">{workplaceConfig.location}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Role - Full width below the two columns */}
                    <p className="text-white/90 text-sm font-mono mb-3">
                        {workplaceConfig.role}
                    </p>

                    {/* Separator and Project Header - Only show if multiple projects */}
                    {!isSingleProjectSection(workplaceConfig) && (
                        <>
                            <div className="h-px bg-white/30 w-full mb-3" />

                            {/* Project Info - Two column layout (same as desktop) */}
                            <div className="flex items-start gap-3 mb-3">
                                {/* Left column: Logo */}
                                {currentProject?.showLogo && currentProject?.logoPath && (
                                    <img
                                        src={currentProject.logoPath}
                                        alt={currentProject.title}
                                        className="h-10 w-auto object-contain rounded-3xl border border-white flex-shrink-0"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                )}
                                {/* Right column: Title + Description */}
                                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                    <h3 className="font-sans text-base font-medium text-white leading-tight">
                                        {currentProject?.title}
                                    </h3>
                                    <p className="font-mono text-xs font-light text-white/70 leading-snug">
                                        {currentProject?.description}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Separator for single-project sections */}
                    {isSingleProjectSection(workplaceConfig) && (
                        <div className="h-px bg-white/20 w-full mb-3" />
                    )}

                    {/* Project Content */}
                    <ProjectContent contentBlocks={currentProject?.contentBlocks} />
                </div>

                {/* Fixed Footer - Arrows and dots (only if multiple projects) */}
                {projectCount > 1 && (
                    <div className="flex-shrink-0 px-3 py-1 border-t border-white/20">
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={onPrevious}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                                aria-label="Previous project"
                            >
                                <img
                                    src="/assets/images/state_arrow.png"
                                    alt="Previous"
                                    className="w-5 h-5 rotate-180 opacity-60"
                                />
                            </button>

                            {/* Navigation dots */}
                            <div className="flex items-center gap-2">
                                {workplaceConfig.projects.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => onDotClick(index)}
                                        className={cx(
                                            "h-2 rounded-full transition-all duration-300 cursor-pointer",
                                            index === selectedIndex
                                                ? "bg-white w-4"
                                                : "bg-white/40 hover:bg-white/60 w-2"
                                        )}
                                        aria-label={`Go to project ${index + 1}`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={onNext}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                                aria-label="Next project"
                            >
                                <img
                                    src="/assets/images/state_arrow.png"
                                    alt="Next"
                                    className="w-5 h-5 opacity-60"
                                />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default WorkplacePanel;
