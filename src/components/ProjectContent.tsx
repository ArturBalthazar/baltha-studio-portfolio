import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ContentBlock, HeroImageBlock, TextBlock, ImageBlock, ImageGridBlock, ImageCompareBlock, VideoBlock, FeatureCardBlock, FloatImageBlock, TechStackBlock } from './workplaceConfig';
import { useUI } from '../state';
import { useI18n } from '../i18n';

interface ProjectContentProps {
    contentBlocks?: ContentBlock[];
    translatedContent?: string[];  // Array of translated text strings (titles, paragraphs) in order
}

// Render a hero image - full width, prominent
function HeroImage({ block }: { block: HeroImageBlock }) {
    return (
        <div className="w-full rounded-lg overflow-hidden">
            <img
                src={block.src}
                alt={block.alt || 'Project image'}
                className="w-full h-auto object-cover"
                loading="lazy"
            />
        </div>
    );
}

// Render a text block with optional title
function TextContent({ block, translatedTitle, translatedParagraphs }: {
    block: TextBlock;
    translatedTitle?: string;
    translatedParagraphs?: string[];
}) {
    const title = translatedTitle || block.title;
    const paragraphs = translatedParagraphs || block.paragraphs;

    return (
        <>
            {block.showSeparator && (
                <div className="w-full h-px bg-white/20" />
            )}
            <div className="flex flex-col gap-2">
                {title && (
                    <h4 className="font-sans text-base font-semibold text-white/90 leading-tight">
                        {title}
                    </h4>
                )}
                <div className="flex flex-col gap-2">
                    {paragraphs.map((paragraph, idx) => (
                        <p
                            key={idx}
                            className="font-mono text-sm text-white/70 leading-relaxed"
                        >
                            {paragraph}
                        </p>
                    ))}
                </div>
            </div>
        </>
    );
}

// Render a single image with optional caption
function ImageContent({ block }: { block: ImageBlock }) {
    return (
        <figure className="w-full flex flex-col gap-1.5">
            <div className="w-full rounded-lg overflow-hidden border border-white/20">
                <img
                    src={block.src}
                    alt={block.alt || 'Project image'}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                />
            </div>
            {block.caption && (
                <figcaption className="text-xs font-mono text-white/50 italic text-center">
                    {block.caption}
                </figcaption>
            )}
        </figure>
    );
}

// Render an image grid (stacked or side-by-side)
function ImageGrid({ block }: { block: ImageGridBlock }) {
    const columns = block.columns || 1;
    const [aspectRatios, setAspectRatios] = useState<number[]>([]);

    // For 2 columns, calculate aspect ratios and distribute width proportionally
    if (columns === 2) {
        const handleImageLoad = (idx: number, e: React.SyntheticEvent<HTMLImageElement>) => {
            const img = e.currentTarget;
            const ratio = img.naturalWidth / img.naturalHeight;
            setAspectRatios(prev => {
                const newRatios = [...prev];
                newRatios[idx] = ratio;
                return newRatios;
            });
        };

        // Calculate flex values based on aspect ratios
        // If not all loaded yet, use equal flex
        const allLoaded = aspectRatios.length === block.images.length && aspectRatios.every(r => r > 0);
        const totalRatio = allLoaded ? aspectRatios.reduce((a, b) => a + b, 0) : block.images.length;

        return (
            <div className="w-full flex gap-3">
                {block.images.map((img, idx) => {
                    // Flex value is the aspect ratio (wider images get more space)
                    const flexValue = allLoaded ? aspectRatios[idx] : 1;
                    return (
                        <div
                            key={idx}
                            className="rounded-lg overflow-hidden border border-white/20"
                            style={{ flex: flexValue }}
                        >
                            <img
                                src={img.src}
                                alt={img.alt || `Image ${idx + 1}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onLoad={(e) => handleImageLoad(idx, e)}
                            />
                        </div>
                    );
                })}
            </div>
        );
    }

    // For 1 column, stack vertically
    return (
        <div className="w-full flex flex-col gap-3">
            {block.images.map((img, idx) => (
                <div
                    key={idx}
                    className="w-full rounded-lg overflow-hidden border border-white/20"
                >
                    <img
                        src={img.src}
                        alt={img.alt || `Image ${idx + 1}`}
                        className="w-full h-auto object-cover"
                        loading="lazy"
                    />
                </div>
            ))}
        </div>
    );
}

// Render a video (YouTube embed or local) with play state detection
function VideoContent({ block }: { block: VideoBlock }) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const { setVideoPlaying } = useUI();

    // Handle YouTube IFrame API messages for play state detection
    useEffect(() => {
        if (!block.isYoutube) return;

        // Listen for messages from YouTube iframe
        const handleMessage = (event: MessageEvent) => {
            // Only handle messages from YouTube
            if (event.origin !== 'https://www.youtube.com') return;

            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

                // Look for player state changes
                // State values: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
                if (data.event === 'onStateChange') {
                    const playerState = data.info;
                    if (playerState === 1) {
                        // Video started playing
                        setVideoPlaying(true);
                    } else if (playerState === 0 || playerState === 2 || playerState === -1) {
                        // Video ended, paused, or unstarted
                        setVideoPlaying(false);
                    }
                }

                // Also check for infoDelivery events (alternative state reporting)
                if (data.info && typeof data.info.playerState !== 'undefined') {
                    const playerState = data.info.playerState;
                    if (playerState === 1) {
                        setVideoPlaying(true);
                    } else if (playerState === 0 || playerState === 2 || playerState === -1) {
                        setVideoPlaying(false);
                    }
                }
            } catch {
                // Ignore parse errors from other messages
            }
        };

        window.addEventListener('message', handleMessage);

        // Enable JS API by posting a message to the iframe once it loads
        const enableJsApi = () => {
            if (iframeRef.current?.contentWindow) {
                // Request video info and enable event listening
                iframeRef.current.contentWindow.postMessage(
                    JSON.stringify({ event: 'listening' }),
                    'https://www.youtube.com'
                );
            }
        };

        // Wait for iframe to load
        const iframe = iframeRef.current;
        if (iframe) {
            iframe.addEventListener('load', enableJsApi);
        }

        return () => {
            window.removeEventListener('message', handleMessage);
            if (iframe) {
                iframe.removeEventListener('load', enableJsApi);
            }
            // Reset video playing state when component unmounts
            setVideoPlaying(false);
        };
    }, [block.isYoutube, setVideoPlaying]);

    if (block.isYoutube) {
        // Add enablejsapi=1 to URL to enable JS API
        const srcWithApi = block.src.includes('?')
            ? `${block.src}&enablejsapi=1&origin=${window.location.origin}`
            : `${block.src}?enablejsapi=1&origin=${window.location.origin}`;

        return (
            <div className="w-full aspect-video rounded-lg overflow-hidden border border-white/20">
                <iframe
                    ref={iframeRef}
                    src={srcWithApi}
                    title="YouTube video"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>
        );
    }

    return (
        <div className="w-full rounded-lg overflow-hidden border border-white/20">
            <video
                src={block.src}
                controls
                className="w-full h-auto"
            />
        </div>
    );
}

// Render a feature card with image and text side by side
function FeatureCard({ block, translatedTitle, translatedParagraphs }: {
    block: FeatureCardBlock;
    translatedTitle?: string;
    translatedParagraphs?: string[];
}) {
    const imageOnLeft = block.imagePosition !== 'right';
    const title = translatedTitle || block.title;
    const paragraphs = translatedParagraphs || block.paragraphs;

    const imageElement = (
        <div className="w-2/5 flex-shrink-0">
            <div className="rounded-lg overflow-hidden border border-white/20 bg-white/5">
                <img
                    src={block.imageSrc}
                    alt={block.imageAlt || block.title}
                    className="w-full h-auto object-contain"
                    loading="lazy"
                />
            </div>
        </div>
    );

    const textElement = (
        <div className="w-3/5 flex flex-col gap-2 justify-center">
            <h4 className="font-sans text-base font-semibold text-white/90 leading-tight">
                {title}
            </h4>
            <div className="flex flex-col gap-2">
                {paragraphs.map((paragraph, idx) => (
                    <p
                        key={idx}
                        className="font-mono text-sm text-white/70 leading-relaxed"
                    >
                        {paragraph}
                    </p>
                ))}
            </div>
        </div>
    );

    return (
        <>
            {block.showSeparator && (
                <div className="w-full h-px bg-white/20" />
            )}
            <div className="flex gap-4 items-start">
                {imageOnLeft ? (
                    <>
                        {imageElement}
                        {textElement}
                    </>
                ) : (
                    <>
                        {textElement}
                        {imageElement}
                    </>
                )}
            </div>
        </>
    );
}

// Render a float image with text wrapping around it (like Word)
function FloatImage({ block, translatedTitle, translatedParagraphs }: {
    block: FloatImageBlock;
    translatedTitle?: string;
    translatedParagraphs?: string[];
}) {
    const paragraphs = translatedParagraphs || block.paragraphs;
    const title = translatedTitle || block.title;
    const width = block.width || '2/5';

    // Full width: image below text
    if (width === 'full') {
        return (
            <>
                {block.showSeparator && (
                    <div className="w-full h-px bg-white/20" />
                )}
                <div className="flex flex-col gap-3">
                    {title && (
                        <h4 className="font-sans text-base font-semibold text-white/90 leading-tight">
                            {title}
                        </h4>
                    )}
                    {paragraphs.map((paragraph, idx) => (
                        <p
                            key={idx}
                            className="font-mono text-sm text-white/70 leading-relaxed"
                        >
                            {paragraph}
                        </p>
                    ))}
                    <div className="w-full rounded-lg overflow-hidden border border-white/20 bg-white/5">
                        <img
                            src={block.imageSrc}
                            alt={block.imageAlt || 'Project image'}
                            className="w-full h-auto object-contain"
                            loading="lazy"
                        />
                    </div>
                </div>
            </>
        );
    }

    // Float image with text wrapping
    const floatClass = block.imagePosition === 'right' ? 'float-right ml-4' : 'float-left mr-4';
    const widthClass = width === '1/2' ? 'w-1/2' : 'w-2/5';

    return (
        <>
            {block.showSeparator && (
                <div className="w-full h-px bg-white/20" />
            )}
            <div className="flex flex-col gap-2">
                {title && (
                    <h4 className="font-sans text-base font-semibold text-white/90 leading-tight">
                        {title}
                    </h4>
                )}
                <div className="overflow-hidden">
                    <div className={`${floatClass} mb-2 ${widthClass}`}>
                        <div className="rounded-lg overflow-hidden border border-white/20 bg-white/5">
                            <img
                                src={block.imageSrc}
                                alt={block.imageAlt || 'Project image'}
                                className="w-full h-auto object-contain"
                                loading="lazy"
                            />
                        </div>
                    </div>
                    {paragraphs.map((paragraph, idx) => (
                        <p
                            key={idx}
                            className="font-mono text-sm text-white/70 leading-relaxed mb-2"
                        >
                            {paragraph}
                        </p>
                    ))}
                </div>
            </div>
        </>
    );
}

// Render a tech stack grid with icons and labels
function TechStack({ block }: { block: TechStackBlock }) {
    const [iconErrors, setIconErrors] = useState<Set<string>>(new Set());

    const handleIconError = (id: string) => {
        setIconErrors(prev => new Set(prev).add(id));
    };

    const getIconPath = (id: string): string => {
        // If this icon has errored, use placeholder
        if (iconErrors.has(id)) {
            return '/assets/images/stack-icons/placeholder.svg';
        }
        // Try the specific icon first (will fallback on error)
        return `/assets/images/stack-icons/${id}.png`;
    };

    return (
        <>
            {block.showSeparator && (
                <div className="w-full h-px bg-white/20" />
            )}
            <div className="flex flex-col gap-3">
                {block.title && (
                    <h4 className="font-sans text-base font-semibold text-white/90 leading-tight">
                        {block.title}
                    </h4>
                )}
                <div className="flex flex-wrap gap-6">
                    {block.items.map((item) => (
                        <div
                            key={item.id}
                            className="flex flex-col items-center gap-1.5 w-16"
                        >
                            <div className="w-12 h-12 bg-white/10 flex border border-white/50 items-center rounded-lg justify-center transition-all duration-200">
                                <img
                                    src={getIconPath(item.id)}
                                    alt={item.label}
                                    className="w-[80%] h-[80%] object-contain "
                                    onError={() => handleIconError(item.id)}
                                />
                            </div>
                            <span className="text-xs font-mono text-white/60 text-center leading-tight">
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

// Render a before/after image comparison slider
function ImageCompare({ block }: { block: ImageCompareBlock }) {
    const [sliderPosition, setSliderPosition] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const updateSliderPosition = useCallback((clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
        setSliderPosition(percentage);
    }, []);

    // Use global event listeners to handle dragging outside the container
    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return;
            updateSliderPosition(e.clientX);
        };

        const handleGlobalMouseUp = () => {
            isDragging.current = false;
        };

        const handleGlobalTouchMove = (e: TouchEvent) => {
            if (!isDragging.current) return;
            updateSliderPosition(e.touches[0].clientX);
        };

        const handleGlobalTouchEnd = () => {
            isDragging.current = false;
        };

        document.addEventListener('mousemove', handleGlobalMouseMove);
        document.addEventListener('mouseup', handleGlobalMouseUp);
        document.addEventListener('touchmove', handleGlobalTouchMove);
        document.addEventListener('touchend', handleGlobalTouchEnd);

        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
            document.removeEventListener('touchmove', handleGlobalTouchMove);
            document.removeEventListener('touchend', handleGlobalTouchEnd);
        };
    }, [updateSliderPosition]);

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        updateSliderPosition(e.clientX);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        isDragging.current = true;
        updateSliderPosition(e.touches[0].clientX);
    };

    return (
        <figure className="w-full flex flex-col gap-1.5">
            <div
                ref={containerRef}
                className="relative w-full aspect-video rounded-lg overflow-hidden border border-white/20 cursor-ew-resize select-none"
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                {/* After image (full width, behind) */}
                <img
                    src={block.afterSrc}
                    alt="After"
                    className="absolute inset-0 w-full h-full object-cover"
                    draggable={false}
                />

                {/* Before image (clipped) */}
                <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${sliderPosition}%` }}
                >
                    <img
                        src={block.beforeSrc}
                        alt="Before"
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ width: `${100 / (sliderPosition / 100)}%`, maxWidth: 'none' }}
                        draggable={false}
                    />
                </div>

                {/* Slider line */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                    style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                >
                    {/* Slider handle */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 border-2 border-white shadow-lg flex items-center justify-center">
                        <div className="flex items-center gap-0.5">
                            <svg className="w-3 h-3 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                            </svg>
                            <svg className="w-3 h-3 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Labels */}
                {block.beforeLabel && (
                    <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 rounded text-xs font-mono text-white/90">
                        {block.beforeLabel}
                    </div>
                )}
                {block.afterLabel && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 rounded text-xs font-mono text-white/90">
                        {block.afterLabel}
                    </div>
                )}
            </div>
            {block.caption && (
                <figcaption className="text-xs font-mono text-white/50 italic text-center">
                    {block.caption}
                </figcaption>
            )}
        </figure>
    );
}

// Main component that renders content blocks
export function ProjectContent({ contentBlocks, translatedContent }: ProjectContentProps) {
    if (!contentBlocks || contentBlocks.length === 0) {
        // Fallback placeholder
        return (
            <div className="w-full aspect-[16/9] rounded-lg overflow-hidden border border-white/30 flex-shrink-0 bg-white/5 flex items-center justify-center">
                <span className="text-white/40 font-mono text-sm">
                    [Project Content Placeholder]
                </span>
            </div>
        );
    }

    // Track index into translatedContent array
    // Each text item (paragraph or title) consumes one index
    let translationIndex = 0;

    // Helper to get translated text for a block
    const getTranslatedTexts = (paragraphCount: number, hasTitle: boolean) => {
        if (!translatedContent) return { title: undefined, paragraphs: undefined };

        let translatedTitle: string | undefined;
        let translatedParagraphs: string[] | undefined;

        // If block has a title, it's the first item
        if (hasTitle && translatedContent[translationIndex]) {
            translatedTitle = translatedContent[translationIndex];
            translationIndex++;
        }

        // Get translated paragraphs
        if (paragraphCount > 0) {
            translatedParagraphs = [];
            for (let i = 0; i < paragraphCount; i++) {
                if (translatedContent[translationIndex]) {
                    translatedParagraphs.push(translatedContent[translationIndex]);
                    translationIndex++;
                }
            }
        }

        return { title: translatedTitle, paragraphs: translatedParagraphs };
    };

    const renderBlock = (block: ContentBlock, index: number) => {
        switch (block.type) {
            case 'hero-image':
                return <HeroImage key={index} block={block} />;
            case 'text': {
                const { title, paragraphs } = getTranslatedTexts(
                    block.paragraphs.length,
                    !!block.title
                );
                return (
                    <TextContent
                        key={index}
                        block={block}
                        translatedTitle={title}
                        translatedParagraphs={paragraphs}
                    />
                );
            }
            case 'image':
                return <ImageContent key={index} block={block} />;
            case 'image-grid':
                return <ImageGrid key={index} block={block} />;
            case 'image-compare':
                return <ImageCompare key={index} block={block} />;
            case 'video':
                return <VideoContent key={index} block={block} />;
            case 'feature-card': {
                const { title, paragraphs } = getTranslatedTexts(
                    block.paragraphs.length,
                    true // feature-card always has title
                );
                return (
                    <FeatureCard
                        key={index}
                        block={block}
                        translatedTitle={title}
                        translatedParagraphs={paragraphs}
                    />
                );
            }
            case 'float-image': {
                const { title, paragraphs } = getTranslatedTexts(
                    block.paragraphs.length,
                    !!block.title // float-image may have a title
                );
                return (
                    <FloatImage
                        key={index}
                        block={block}
                        translatedTitle={title}
                        translatedParagraphs={paragraphs}
                    />
                );
            }
            case 'tech-stack':
                return <TechStack key={index} block={block} />;
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {contentBlocks.map((block, index) => renderBlock(block, index))}
        </div>
    );
}

export default ProjectContent;
