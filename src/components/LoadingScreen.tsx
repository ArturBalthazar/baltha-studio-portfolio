import React, { useState } from 'react';
import { useUI } from '../state';

export const LoadingScreen: React.FC = () => {
    const loadingProgress = useUI((state) => state.loadingProgress);
    const isLoading = useUI((state) => state.isLoading);
    const [isVisible, setIsVisible] = useState(true);
    const [isFadingOut, setIsFadingOut] = useState(false);

    React.useEffect(() => {
        if (!isLoading) {
            setIsFadingOut(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 300); // Wait for transition
            return () => clearTimeout(timer);
        } else {
            setIsVisible(true);
            setIsFadingOut(false);
        }
    }, [isLoading]);

    if (!isVisible) return null;

    return (
        <div id="loading-screen" style={{ opacity: isFadingOut ? 0 : 1, pointerEvents: isFadingOut ? 'none' : 'auto' }}>
            <div className="logo-overlay">
                <img
                    src="/assets/brand/vector/Baltha_Studio_Icon.svg"
                    alt="Logo Top"
                    className="logo-top"
                />
            </div>
            <div className="loading-bar-container">
                <div
                    className="loading-bar"
                    style={{ width: `${loadingProgress}%` }}
                />
            </div>
            <div className="logo-overlay">
                <img
                    src="/assets/brand/vector/Baltha_Studio_Text_Sign.svg"
                    alt="Logo Bottom"
                    className="logo-bottom"
                />
            </div>
        </div>
    );
};
