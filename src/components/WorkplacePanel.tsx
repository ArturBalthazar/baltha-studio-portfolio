import React, { useState, useEffect, useRef } from "react";
import cx from "classnames";
import { useUI, S } from "../state";
import { getWorkplaceConfig, WorkplaceConfig, ProjectConfig, TitleButton, isSingleProjectSection } from "./workplaceConfig";
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

// Title buttons component - renders action buttons next to titles
function TitleButtons({ buttons, size = 'md' }: { buttons?: TitleButton[]; size?: 'sm' | 'md' }) {
    if (!buttons || buttons.length === 0) return null;

    const sizeClasses = size === 'sm'
        ? 'w-6 h-6'
        : 'w-6 h-6';

    const iconSizeClasses = size === 'sm'
        ? 'w-5 h-5'
        : 'w-5 h-5';

    const handleClick = (e: React.MouseEvent, button: TitleButton) => {
        e.stopPropagation(); // Prevent header collapse toggle
        playShortClick();

        if (button.url) {
            window.open(button.url, '_blank', 'noopener,noreferrer');
        } else if (button.action) {
            // Handle internal actions (can be extended later)
            console.log('Action:', button.action);
        }
    };

    return (
        <div className="flex items-center gap-1 ml-2">
            {buttons.map((button, index) => (
                <button
                    key={index}
                    onClick={(e) => handleClick(e, button)}
                    className={cx(
                        sizeClasses,
                        "flex items-center justify-center rounded-full",
                        "transition-all duration-200 cursor-pointer",
                        "hover:scale-110"
                    )}
                    title={button.tooltip}
                    aria-label={button.tooltip || `Open ${button.icon}`}
                >
                    <img
                        src={`/assets/images/${button.icon}`}
                        alt=""
                        className={cx(iconSizeClasses, "object-contain opacity-50 hover:opacity-100")}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                </button>
            ))}
        </div>
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

    // Reset project index when active workplace changes (section change)
    // BUT check for pending navigation first!
    // Note: We use a ref to track the previous state to only reset on actual section changes
    const prevActiveWorkplaceState = useRef<S | null>(null);

    useEffect(() => {
        if (activeWorkplaceState !== null) {
            // Only reset project if the section actually changed
            const sectionChanged = prevActiveWorkplaceState.current !== activeWorkplaceState;
            prevActiveWorkplaceState.current = activeWorkplaceState;

            if (sectionChanged) {
                // Check if there's a pending project navigation for this state
                const pending = useUI.getState().pendingProjectNavigation;
                if (pending && pending.targetState === activeWorkplaceState) {
                    // Apply the pending project index
                    setSelectedProjectIndex(pending.projectIndex);
                    useUI.getState().setPendingProjectNavigation(null);
                } else {
                    // No pending navigation, reset to first project
                    setSelectedProjectIndex(0);
                }
                // Reset collapse state based on current navigation mode
                setIsCollapsed(navigationMode === 'free');
            }
        }
    }, [activeWorkplaceState, setSelectedProjectIndex, navigationMode]);

    // Scroll to top when project changes
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [selectedProjectIndex]);

    // Auto-expand/collapse when navigation mode changes
    // BUT don't expand if we have a pending navigation (we're about to travel somewhere)
    useEffect(() => {
        const pending = useUI.getState().pendingProjectNavigation;
        if (pending) {
            // We're about to travel, stay collapsed until we arrive
            setIsCollapsed(true);
        } else {
            setIsCollapsed(navigationMode === 'free');
        }
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
                            {/* Row 1: Company Name + Title Buttons + Arrow */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <h2 className="font-sans text-xl font-semibold text-white -mb-1.5">
                                        {workplaceTranslations?.companyName || workplaceConfig.companyName}
                                    </h2>
                                    {/* For single-project sections, show project buttons; otherwise show company buttons */}
                                    <TitleButtons buttons={
                                        isSingleProjectSection(workplaceConfig)
                                            ? currentProject?.titleButtons
                                            : workplaceConfig.titleButtons
                                    } />
                                </div>
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
                                        <div className="flex items-center">
                                            <h3 className="font-sans text-lg font-medium text-white leading-tight">
                                                {projectTranslations?.title || currentProject?.title}
                                            </h3>
                                            <TitleButtons buttons={currentProject?.titleButtons} size="sm" />
                                        </div>
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
                                    className="w-5 h-5 rotate-180 opacity-100 hover:opacity-100 transition-opacity"
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
                                    className="w-5 h-5 opacity-100 hover:opacity-100 transition-opacity"
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
                setIsCollapsed={setIsCollapsed}
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
    setIsCollapsed,
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
    setIsCollapsed: (collapsed: boolean) => void;
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
    const headerRef = useRef<HTMLDivElement>(null);

    // Draggable resize state
    const COLLAPSE_THRESHOLD = 125; // Height below which panel collapses (approx header height)
    const EXPAND_DRAG_THRESHOLD = 30; // How far to drag down from collapsed to expand
    const BOTTOM_SAFE_ZONE = 110; // Pixels from bottom to stop (for bottom buttons)
    const TOP_OFFSET = 64; // top-16 = 4rem = 64px
    const DEFAULT_EXPANDED_HEIGHT_VH = 50; // Default expanded height in vh

    const [panelHeight, setPanelHeight] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartY = useRef<number>(0);
    const dragStartHeight = useRef<number>(0);
    const wasCollapsedOnDragStart = useRef<boolean>(false);

    // Calculate default expanded height
    const getDefaultExpandedHeight = () => {
        return (window.innerHeight * DEFAULT_EXPANDED_HEIGHT_VH / 100) - 100;
    };

    const getMaxHeight = () => {
        // Max height = viewport height - top offset - bottom safe zone
        return window.innerHeight - TOP_OFFSET - BOTTOM_SAFE_ZONE;
    };

    // Handle drag start
    const handleDragStart = (clientY: number) => {
        setIsDragging(true);
        dragStartY.current = clientY;
        wasCollapsedOnDragStart.current = isCollapsed;

        if (isCollapsed) {
            // Start from a small height when collapsed (header area)
            dragStartHeight.current = COLLAPSE_THRESHOLD;
        } else {
            dragStartHeight.current = panelHeight ?? getDefaultExpandedHeight();
        }
    };

    // Handle drag move
    const handleDragMove = (clientY: number) => {
        if (!isDragging) return;

        const deltaY = clientY - dragStartY.current;

        // Clamp height: minimum is COLLAPSE_THRESHOLD (header height), maximum is screen limit
        const newHeight = Math.min(
            getMaxHeight(),
            Math.max(COLLAPSE_THRESHOLD, dragStartHeight.current + deltaY)
        );

        // If we were collapsed and start dragging down, expand immediately
        if (wasCollapsedOnDragStart.current && deltaY > EXPAND_DRAG_THRESHOLD) {
            setIsCollapsed(false);
            wasCollapsedOnDragStart.current = false;
        }

        // Only set height if not collapsed or if we're expanding
        if (!isCollapsed || deltaY > EXPAND_DRAG_THRESHOLD) {
            setPanelHeight(newHeight);
        }

        // If we hit the minimum (COLLAPSE_THRESHOLD), immediately collapse
        if (newHeight <= COLLAPSE_THRESHOLD && !wasCollapsedOnDragStart.current) {
            setIsCollapsed(true);
            setPanelHeight(null);
        }
    };

    // Handle drag end - determine if should collapse or expand
    const handleDragEnd = () => {
        setIsDragging(false);

        // If height is at threshold or below, ensure collapsed
        if (panelHeight !== null && panelHeight <= COLLAPSE_THRESHOLD) {
            setIsCollapsed(true);
            setPanelHeight(null);
        } else if (panelHeight !== null && panelHeight > COLLAPSE_THRESHOLD && isCollapsed) {
            // If we have height above threshold and were collapsed, expand
            setIsCollapsed(false);
        }
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

    // Track previous collapsed state to detect click-expand vs drag-expand
    const prevIsCollapsed = useRef(isCollapsed);
    useEffect(() => {
        // If transitioning from collapsed to expanded and NOT dragging, reset height to default
        if (prevIsCollapsed.current && !isCollapsed && !isDragging) {
            setPanelHeight(null);
        }
        prevIsCollapsed.current = isCollapsed;
    }, [isCollapsed, isDragging]);

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
            : { maxHeight: "calc(50vh - 100px)" };

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
                                {/* Row 1: Company Name + Title Buttons + Arrow */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <h2 className="font-sans text-xl font-semibold text-white">
                                            {workplaceTranslations?.companyName || workplaceConfig.companyName}
                                        </h2>
                                        {/* For single-project sections, show project buttons; otherwise show company buttons */}
                                        <TitleButtons buttons={
                                            isSingleProjectSection(workplaceConfig)
                                                ? currentProject?.titleButtons
                                                : workplaceConfig.titleButtons
                                        } size="sm" />
                                    </div>
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
                                            <div className="flex items-center">
                                                <h3 className="font-sans text-base font-medium text-white leading-tight">
                                                    {projectTranslations?.title || currentProject?.title}
                                                </h3>
                                                <TitleButtons buttons={currentProject?.titleButtons} size="sm" />
                                            </div>
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
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
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
                                    className="w-5 h-5 rotate-180 opacity-100"
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
                                    className="w-5 h-5 opacity-100"
                                />
                            </button>
                        </div>
                    </div>
                )}

                {/* Fallback spacer when there's only 1 project (border-t line) */}
                {projectCount <= 1 && (
                    <div className="flex-shrink-0 border-t border-white/20" />
                )}
            </div>

            {/* Drag pill - positioned OUTSIDE the bordered panel for "floating" effect */}
            <div
                className={cx(
                    "flex items-center justify-center cursor-ns-resize select-none touch-none",
                    "py-2 -mt-1"  // Negative margin to overlap with panel border
                )}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                aria-label="Drag to resize panel"
            >
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
        </div>
    );
}

export default WorkplacePanel;
