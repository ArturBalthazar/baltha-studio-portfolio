/**
 * NextButtonTooltip Component
 * 
 * A tooltip that appears above the "Next" button 2 seconds after the home page loads.
 * Features a rounded rectangle with a triangle pointer below, all with a unified border.
 * The rectangle is offset slightly to the left while the triangle stays centered over the button.
 */

import React, { useState, useEffect } from 'react';
import { S, useUI } from '../state';
import { useI18n } from '../i18n';

interface NextButtonTooltipProps {
    /** Whether the tooltip should be visible based on parent state */
    visible: boolean;
}

// Colors from tailwind config
const BRAND_WHITE = 'rgba(8, 20, 40, 1)';

export function NextButtonTooltip({ visible }: NextButtonTooltipProps) {
    const [showTooltip, setShowTooltip] = useState(false);
    const [hasShown, setHasShown] = useState(false);
    const { t } = useI18n();
    const currentState = useUI((st) => st.state);

    // Show tooltip 2 seconds after becoming visible in state_0
    useEffect(() => {
        if (visible && currentState === S.state_0 && !hasShown) {
            const timer = setTimeout(() => {
                setShowTooltip(true);
                setHasShown(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [visible, currentState, hasShown]);

    // Hide tooltip when leaving state_0
    useEffect(() => {
        if (currentState !== S.state_0) {
            setShowTooltip(false);
        }
    }, [currentState]);

    // Don't render if not in state_0 or not visible
    if (currentState !== S.state_0 || !visible) return null;

    // Colors: brand-dark at 90%, brand-white at 20% for border
    const fillColor = `rgba(245, 242, 237, .9)`; // brand-dark with 90%
    const borderColor = `rgba(245, 242, 237, 0)`; // brand-white with 20%

    return (
        <>
            {/* Desktop tooltip */}
            <div
                className={`
          absolute z-40 pointer-events-none select-none
          transition-all duration-500 ease-out
          hidden md:block
          ${showTooltip ? 'opacity-100' : 'opacity-0'}
        `}
                style={{
                    // Same right position as button (right-4 = 16px)
                    right: '16px',
                    top: '50%',
                    transform: showTooltip
                        ? 'translateY(calc(-50% - 52px))'
                        : 'translateY(calc(-50% - 44px))',
                }}
            >
                <TooltipBody
                    text={t.common.next}
                    borderColor={borderColor}
                    fillColor={fillColor}
                />
            </div>

            {/* Mobile tooltip */}
            <div
                className={`
                    absolute z-40 pointer-events-none select-none
                    transition-all duration-500 ease-out 
                    block md:hidden
                    ${showTooltip ? 'opacity-100' : 'opacity-0'}
                `}
                style={{
                    // Same right position as mobile button (right-3 = 12px)
                    right: '12px',
                    top: '50%',
                    transform: showTooltip
                        ? 'translateY(calc(-50% - 54px))'
                        : 'translateY(calc(-50% - 40px))',
                }}
            >
                <TooltipBody
                    text={t.common.next}
                    borderColor={borderColor}
                    fillColor={fillColor}
                    isMobile
                />
            </div>
        </>
    );
}

interface TooltipBodyProps {
    text: string;
    borderColor: string;
    fillColor: string;
    isMobile?: boolean;
}

function TooltipBody({ text, borderColor, fillColor, isMobile = false }: TooltipBodyProps) {
    const borderWidth = 1;
    const triangleSize = isMobile ? 7 : 7;
    // Offset: how many pixels to shift the rectangle to the left
    const rectangleOffset = isMobile ? 8 : 10;

    return (
        <div className="relative flex flex-col items-center">
            {/* Rectangle body with border and rounded corners - OFFSET TO THE LEFT */}
            <div
                className="relative rounded-md"
                style={{
                    backgroundColor: fillColor,
                    border: `${borderWidth}px solid ${borderColor}`,
                    padding: isMobile ? '4px 12px 4px 12px' : '2px 10px 4px 10px',
                    // Offset the rectangle to the left
                    transform: `translateX(-${rectangleOffset}px)`,
                    // Subtle white glow
                    boxShadow: '0 0 8px rgba(255, 255, 255, .2)',
                }}
            >
                {/* Tooltip text - brand-white at 100%, proper case "Next" */}
                <span
                    className={`font-mono font-medium whitespace-nowrap tracking-wide ${isMobile ? 'text-sm' : 'text-sm'
                        }`}
                    style={{ color: BRAND_WHITE }}
                >
                    {text}
                </span>
            </div>

            {/* Triangle pointer - stays centered (not offset) */}
            <div
                className="relative flex flex-col items-center"
                style={{
                    marginTop: `-${borderWidth}px`, // Overlap to connect seamlessly
                }}
            >
                {/* Border triangle (larger, behind) */}
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: 0,
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: `${triangleSize + borderWidth}px solid transparent`,
                        borderRight: `${triangleSize + borderWidth}px solid transparent`,
                        borderTop: `${triangleSize + borderWidth}px solid ${borderColor}`,
                    }}
                />

                {/* Fill triangle (smaller, in front) */}
                <div
                    style={{
                        position: 'relative',
                        width: 0,
                        height: 0,
                        transform: 'translateY(1px)',
                        borderLeft: `${triangleSize}px solid transparent`,
                        borderRight: `${triangleSize}px solid transparent`,
                        borderTop: `${triangleSize}px solid ${fillColor}`,
                    }}
                />
            </div>
        </div>
    );
}
