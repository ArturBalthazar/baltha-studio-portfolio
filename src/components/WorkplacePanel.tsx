import React, { useState, useEffect, useRef } from "react";
import cx from "classnames";
import { useUI, S } from "../state";
import { getWorkplaceConfig, WorkplaceConfig, ProjectConfig, isSingleProjectSection } from "./workplaceConfig";
import { ProjectContent } from "./ProjectContent";
import { playShortClick } from "./ClickSoundManager";
import { useI18n } from "../i18n";
import { WorkplaceTranslation } from "../i18n/translations";

// Map workplace config IDs to translation keys
type WorkplaceTranslationKey = 'musecraft' | 'meetkai' | 'morethanreal' | 'balthamaker' | 'ufsc';

const WORKPLACE_ID_TO_TRANSLATION_KEY: Record<string, WorkplaceTranslationKey> = {
    'personal': 'musecraft',
    'meetkai': 'meetkai',
    'morethanreal': 'morethanreal',
    'balthamaker': 'balthamaker',
    'ufsc': 'ufsc'
};

interface WorkplacePanelProps {
    visible: boolean;
}

// Collapse arrow component
function CollapseArrow({ isCollapsed }: { isCollapsed: boolean }) {
    return (
        <img
            src="/assets/images/arrow.png"
            alt={isCollapsed ? "Expand" : "Collapse"}
            className={cx(
                "w-4 h-4 opacity-60 transition-transform duration-300",
                isCollapsed ? "rotate-180" : "rotate-0"
            )}
        />
    );
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
    const navigationMode = useUI((st) => st.navigationMode);

    // Get translations
    const { t } = useI18n();

    // Get workplace config based on which anchor the ship is near (not navigation state)
    const currentConfig = activeWorkplaceState !== null ? getWorkplaceConfig(activeWorkplaceState) : null;

    // Get workplace translations based on config ID
    const workplaceKey = currentConfig ? WORKPLACE_ID_TO_TRANSLATION_KEY[currentConfig.id] : null;
    const workplaceTranslations = workplaceKey ? t.workplaces[workplaceKey] : null;

    // For animation when switching projects
    const [isAnimating, setIsAnimating] = useState(false);

    // Keep track of last valid config for smooth fade-out
    const lastValidConfig = useRef<WorkplaceConfig | null>(null);
    const [shouldRender, setShouldRender] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Collapse state - default based on navigation mode
    const [isCollapsed, setIsCollapsed] = useState(navigationMode === 'free');

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

    // Reset project index and collapse state when active workplace changes
    useEffect(() => {
        if (activeWorkplaceState !== null) {
            setSelectedProjectIndex(0);
            // Reset collapse state based on current navigation mode
            setIsCollapsed(navigationMode === 'free');
        }
    }, [activeWorkplaceState, setSelectedProjectIndex, navigationMode]);

    // Scroll to top when project changes
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [selectedProjectIndex]);

    // Auto-expand/collapse when navigation mode changes
    useEffect(() => {
        setIsCollapsed(navigationMode === 'free');
    }, [navigationMode]);

    // Handle header click to toggle collapse
    const handleHeaderClick = () => {
        playShortClick();
        setIsCollapsed(!isCollapsed);
    };

    // Use current config if available, otherwise use last valid for fade-out
    const workplaceConfig = currentConfig || lastValidConfig.current;

    if (!shouldRender || !workplaceConfig) return null;

    const currentProject = workplaceConfig.projects[selectedProjectIndex] || workplaceConfig.projects[0];
    const projectCount = workplaceConfig.projects.length;

    // Get project translations if available
    const projectTranslations = (workplaceTranslations && currentProject)
        ? workplaceTranslations.projects[currentProject.id]
        : null;

    const handlePrevious = () => {
        if (isAnimating || projectCount <= 1) return;
        playShortClick();
        setIsAnimating(true);
        const newIndex = selectedProjectIndex === 0 ? projectCount - 1 : selectedProjectIndex - 1;
        setSelectedProjectIndex(newIndex);
        setTimeout(() => setIsAnimating(false), 300);
    };

    const handleNext = () => {
        if (isAnimating || projectCount <= 1) return;
        playShortClick();
        setIsAnimating(true);
        const newIndex = selectedProjectIndex === projectCount - 1 ? 0 : selectedProjectIndex + 1;
        setSelectedProjectIndex(newIndex);
        setTimeout(() => setIsAnimating(false), 300);
    };

    return (
        <>
            {/* Desktop: Left side panel */}
            <div className={cx(
                "hidden md:flex absolute left-16 w-[35%]",
                "flex-col rounded-xl overflow-hidden",
                "bg-[rgba(12,20,40,0.75)] backdrop-blur-lg",
                "border border-white/30",
                "transition-all duration-500",
                isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10 pointer-events-none"
            )}
                style={{
                    top: '4.5rem',
                    bottom: isCollapsed ? 'auto' : '5rem',
                    height: isCollapsed ? 'auto' : undefined,
                    maxHeight: isCollapsed ? 'none' : 'calc(100vh - 9.5rem)'
                }}
            >
                {/* Fixed Header - Company Info (clickable to toggle collapse) */}
                <div
                    className="flex-shrink-0 px-5 pt-4 pb-3 cursor-pointer"
                    onClick={handleHeaderClick}
                >
                    {/* Two-column layout: Logo | Text Info (3 rows) | Arrow */}
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

                        {/* Right column: Three rows of text + arrow at title level */}
                        <div className="flex flex-col justify-center min-w-0 flex-1">
                            {/* Row 1: Company Name + Arrow */}
                            <div className="flex items-center justify-between">
                                <h2 className="font-sans text-xl font-semibold text-white -mb-1.5">
                                    {workplaceTranslations?.companyName || workplaceConfig.companyName}
                                </h2>
                                {/* Collapse arrow indicator - aligned with title */}
                                <div className="flex-shrink-0 ml-2">
                                    <CollapseArrow isCollapsed={isCollapsed} />
                                </div>
                            </div>

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
                                {workplaceTranslations?.role || workplaceConfig.role}
                            </p>
                        </div>
                    </div>

                    {/* Separator - only show when expanded */}
                    {!isCollapsed && <div className="h-px bg-white/40 w-full mt-3" />}
                </div>

                {/* Scrollable Content - Project Details (hidden when collapsed) */}
                {!isCollapsed && (
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
                                            {projectTranslations?.title || currentProject?.title}
                                        </h3>
                                        <p className="font-mono text-sm font-light text-white/70 leading-snug">
                                            {projectTranslations?.description || currentProject?.description}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Project Content - Always uses English from config for now */}
                            <ProjectContent contentBlocks={currentProject?.contentBlocks} />
                        </div>
                    </div>
                )}

                {/* Fixed Footer - Arrows and dots (visible even when collapsed for project switching) */}
                {projectCount > 1 && (
                    <div className="flex-shrink-0 px-5 py-0.5 border-t border-white/20">
                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
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
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isAnimating && index !== selectedProjectIndex) {
                                                playShortClick();
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
                                onClick={(e) => { e.stopPropagation(); handleNext(); }}
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
                isCollapsed={isCollapsed}
                workplaceTranslations={workplaceTranslations}
                projectTranslations={projectTranslations}
                onToggleCollapse={handleHeaderClick}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onDotClick={(index) => {
                    if (!isAnimating && index !== selectedProjectIndex) {
                        playShortClick();
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
    isCollapsed,
    workplaceTranslations,
    projectTranslations,
    onToggleCollapse,
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
    isCollapsed: boolean;
    workplaceTranslations: WorkplaceTranslation | null;
    projectTranslations: { title: string; description: string; content: string[] } | null | undefined;
    onToggleCollapse: () => void;
    onPrevious: () => void;
    onNext: () => void;
    onDotClick: (index: number) => void;
}) {
    // Ref for scrollable content container
    const mobileScrollRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    // Draggable resize state
    const MIN_HEIGHT_VH = 50; // Minimum height in vh (subtract 100px for header offset)
    const BOTTOM_SAFE_ZONE = 110; // Pixels from bottom to stop (for bottom buttons)
    const TOP_OFFSET = 64; // top-16 = 4rem = 64px

    const [panelHeight, setPanelHeight] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartY = useRef<number>(0);
    const dragStartHeight = useRef<number>(0);

    // Calculate min and max heights
    const getMinHeight = () => {
        return (window.innerHeight * MIN_HEIGHT_VH / 100) - 90;
    };

    const getMaxHeight = () => {
        // Max height = viewport height - top offset - bottom safe zone
        return window.innerHeight - TOP_OFFSET - BOTTOM_SAFE_ZONE;
    };

    // Handle drag start
    const handleDragStart = (clientY: number) => {
        setIsDragging(true);
        dragStartY.current = clientY;
        dragStartHeight.current = panelHeight ?? getMinHeight();
    };

    // Handle drag move
    const handleDragMove = (clientY: number) => {
        if (!isDragging) return;

        const deltaY = clientY - dragStartY.current;
        const newHeight = Math.min(
            getMaxHeight(),
            Math.max(getMinHeight(), dragStartHeight.current + deltaY)
        );
        setPanelHeight(newHeight);
    };

    // Handle drag end
    const handleDragEnd = () => {
        setIsDragging(false);
    };

    // Mouse event handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        handleDragStart(e.clientY);
    };

    // Touch event handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        handleDragStart(e.touches[0].clientY);
    };

    // Global mouse/touch move and up handlers
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            handleDragMove(e.clientY);
        };

        const handleTouchMove = (e: TouchEvent) => {
            handleDragMove(e.touches[0].clientY);
        };

        const handleMouseUp = () => {
            handleDragEnd();
        };

        const handleTouchEnd = () => {
            handleDragEnd();
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isDragging]);

    // Reset panel height when visibility changes
    useEffect(() => {
        if (!visible) {
            setPanelHeight(null);
        }
    }, [visible]);

    // Scroll to top when project changes
    useEffect(() => {
        if (mobileScrollRef.current) {
            mobileScrollRef.current.scrollTop = 0;
        }
    }, [selectedIndex]);

    // Check if this is personal projects (no period/location)
    const isPersonalProjects = !workplaceConfig.period && !workplaceConfig.location;

    // Calculate current height style - collapsed uses auto height
    const heightStyle = isCollapsed
        ? { height: 'auto', maxHeight: 'auto' }
        : panelHeight !== null
            ? { height: `${panelHeight}px`, maxHeight: 'none' }
            : { maxHeight: "calc(50vh - 90px)" };

    return (
        <div
            ref={panelRef}
            className={cx(
                "md:hidden absolute top-16 left-3 right-3",
                "flex flex-col rounded-xl overflow-hidden",
                isDragging ? "" : "transition-all duration-300",
                visible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-10 pointer-events-none"
            )}
            style={{ maxWidth: "380px", margin: "0 auto", ...heightStyle }}
        >
            {/* Panel content */}
            <div
                className={cx(
                    "relative flex flex-col rounded-xl overflow-hidden",
                    "bg-[rgba(12,20,40,0.9)] backdrop-blur-lg",
                    "border border-white/30"
                )}
                style={{ maxHeight: "100%" }}
            >
                {/* Scrollable container - wraps header and content */}
                <div
                    ref={mobileScrollRef}
                    className={cx(
                        "flex-1 overflow-y-auto min-h-0",
                        isCollapsed ? "overflow-hidden" : ""
                    )}
                    style={scrollbarStyles}
                >
                    {/* Header - scrolls with content, still clickable to toggle collapse */}
                    <div
                        className="px-4 py-3 cursor-pointer"
                        onClick={onToggleCollapse}
                    >
                        {/* Two-column layout: Logo | Text Info */}
                        <div className="flex items-start gap-3">
                            {/* Left column: Logo */}
                            {workplaceConfig.showCompanyLogo && workplaceConfig.companyLogoPath && (
                                <img
                                    src={workplaceConfig.companyLogoPath}
                                    alt={workplaceConfig.companyName}
                                    className="h-12 w-auto object-contain rounded-md border border-white/80 flex-shrink-0"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                            )}

                            {/* Right column: Text info + arrow */}
                            <div className="flex flex-col justify-center min-w-0 flex-1">
                                {/* Row 1: Company Name + Arrow */}
                                <div className="flex items-center justify-between">
                                    <h2 className="font-sans text-xl font-semibold text-white">
                                        {workplaceTranslations?.companyName || workplaceConfig.companyName}
                                    </h2>
                                    {/* Collapse arrow indicator */}
                                    <div className="flex-shrink-0 ml-2">
                                        <CollapseArrow isCollapsed={isCollapsed} />
                                    </div>
                                </div>

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
                        <p className="text-white/90 text-sm font-mono mt-1">
                            {workplaceTranslations?.role || workplaceConfig.role}
                        </p>

                        {/* Separator - only when expanded */}
                        {!isCollapsed && <div className="h-px bg-white/30 w-full mt-3" />}
                    </div>

                    {/* Content - hidden when collapsed */}
                    {!isCollapsed && (
                        <div className="px-4 pb-3">
                            {/* Separator and Project Header - Only show if multiple projects */}
                            {!isSingleProjectSection(workplaceConfig) && (
                                <>
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
                                                {projectTranslations?.title || currentProject?.title}
                                            </h3>
                                            <p className="font-mono text-xs font-light text-white/70 leading-snug">
                                                {projectTranslations?.description || currentProject?.description}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Project Content */}
                            <ProjectContent
                                contentBlocks={currentProject?.contentBlocks}
                            />
                        </div>
                    )}
                </div>

                {/* Fixed Footer - entire area is draggable, nav buttons sit on top */}
                {projectCount > 1 && (
                    <div
                        className={cx(
                            "flex-shrink-0 px-3 border-t border-white/20 cursor-ns-resize select-none touch-none",
                            !isCollapsed ? "py-1" : "pb-1"
                        )}
                        onMouseDown={!isCollapsed ? handleMouseDown : undefined}
                        onTouchStart={!isCollapsed ? handleTouchStart : undefined}
                    >
                        {/* Navigation controls - higher z-index to capture clicks */}
                        <div className="flex items-center justify-center gap-3 relative z-10">
                            <button
                                onClick={(e) => { e.stopPropagation(); onPrevious(); }}
                                onMouseDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                                aria-label="Previous project"
                            >
                                <img
                                    src="/assets/images/state_arrow.png"
                                    alt="Previous"
                                    className="w-5 h-5 rotate-180 opacity-60"
                                />
                            </button>

                            {/* Navigation dots - non-interactive, allows drag through */}
                            <div className="flex items-center gap-2">
                                {workplaceConfig.projects.map((_, index) => (
                                    <div
                                        key={index}
                                        className={cx(
                                            "h-2 rounded-full transition-all duration-300",
                                            index === selectedIndex
                                                ? "bg-white w-4"
                                                : "bg-white/40 w-2"
                                        )}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); onNext(); }}
                                onMouseDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
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

                        {/* Drag indicator pill with shadow - only show when expanded */}
                        {!isCollapsed && (
                            <div className="flex items-center justify-center pt-1 pb-0.5">
                                <div
                                    className={cx(
                                        "w-20 h-[5px] rounded-full transition-colors duration-200",
                                        isDragging ? "bg-white/70" : "bg-white/40"
                                    )}
                                    style={{
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3)'
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Fallback drag handle when there's only 1 project */}
                {projectCount <= 1 && !isCollapsed && (
                    <div
                        className={cx(
                            "flex items-center justify-center py-1 cursor-ns-resize",
                            "select-none touch-none border-t border-white/20"
                        )}
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                        aria-label="Drag to resize panel"
                    >
                        {/* Pill indicator with shadow */}
                        <div
                            className={cx(
                                "w-20 h-[5px] rounded-full transition-colors duration-200",
                                isDragging ? "bg-white/70" : "bg-white/40"
                            )}
                            style={{
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3)'
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default WorkplacePanel;
