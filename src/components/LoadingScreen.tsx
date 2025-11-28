import React from 'react';
import { useUI } from '../state';

export const LoadingScreen: React.FC = () => {
    const loadingProgress = useUI((state) => state.loadingProgress);
    const isLoading = useUI((state) => state.isLoading);

    if (!isLoading) return null;

    return (
        <div id="loading-screen">
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
