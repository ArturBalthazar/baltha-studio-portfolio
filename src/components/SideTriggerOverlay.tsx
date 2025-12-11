import React, { useEffect, useState } from "react";
import { useUI } from "../state";

/**
 * SideTriggerOverlay component
 * Shows a visual effect on the left or right side of the screen when the user
 * reaches the edge threshold during ship control (camera rotation without movement zone).
 * 
 * The image fills exactly 100vh height x 10vw/20vw width, aligned to the edge.
 * For the left side, the image is horizontally flipped since we only have the right-side PNG.
 * Includes fade in/out transition.
 */
export function SideTriggerOverlay() {
    const sideTrigger = useUI((st) => st.sideTrigger);
    const [visible, setVisible] = useState(false);
    const [currentSide, setCurrentSide] = useState<'left' | 'right' | null>(null);

    // Handle fade in/out transitions
    useEffect(() => {
        if (sideTrigger) {
            setCurrentSide(sideTrigger);
            // Small delay to trigger CSS transition
            requestAnimationFrame(() => {
                setVisible(true);
            });
        } else {
            setVisible(false);
            // Keep currentSide during fade out, then clear
            const timer = setTimeout(() => {
                setCurrentSide(null);
            }, 300); // Match transition duration
            return () => clearTimeout(timer);
        }
    }, [sideTrigger]);

    // Don't render if no side and not fading out
    if (!currentSide) return null;

    const isLeft = currentSide === "left";

    return (
        <div
            className="fixed inset-0 z-40 pointer-events-none"
            aria-hidden="true"
        >
            <img
                src="/assets/images/side-trigger.png"
                alt=""
                style={{
                    position: "absolute",
                    top: 0,
                    // Position on appropriate side
                    left: isLeft ? 0 : "auto",
                    right: isLeft ? "auto" : 0,
                    // Responsive width: 20vw on mobile, 10vw on desktop (768px+)
                    width: window.innerWidth >= 768 ? "10vw" : "20vw",
                    height: "100vh",
                    // Stretch to fill the exact bounds (no gaps)
                    objectFit: "fill",
                    // Flip horizontally for left side
                    transform: isLeft ? "scaleX(-1)" : "none",
                    // Fade transition
                    opacity: visible ? 0.9 : 0,
                    transition: "opacity 0.3s ease-in-out",
                }}
                draggable={false}
            />
        </div>
    );
}
