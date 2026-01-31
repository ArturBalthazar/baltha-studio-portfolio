import { useEffect, useRef, useCallback } from "react";
import { useUI, S } from "../state";

/**
 * Click Sound Configuration
 * Centralized settings for all click sounds in the application
 */
export const CLICK_SOUND_CONFIG = {
    // Volume settings (0-1)
    volume: 0.6,

    // Short click sound - starts at 0.15s into the audio for a quick click
    shortClickStart: 0.15,

    // Long click sound - starts at 0s for full sound
    longClickStart: 0,

    // Audio file path
    audioPath: "/assets/audio/click.m4a",
};

// Global audio instances - shared across all components
let shortClickAudio: HTMLAudioElement | null = null;
let longClickAudio: HTMLAudioElement | null = null;
let audioInitialized = false;

/**
 * Initialize audio instances (called once on app start)
 */
function initializeAudio() {
    if (audioInitialized) return;

    // Create two audio instances for short and long click sounds
    // Using the same audio file but starting at different positions
    shortClickAudio = new Audio(CLICK_SOUND_CONFIG.audioPath);
    shortClickAudio.volume = CLICK_SOUND_CONFIG.volume;
    shortClickAudio.preload = "auto";

    longClickAudio = new Audio(CLICK_SOUND_CONFIG.audioPath);
    longClickAudio.volume = CLICK_SOUND_CONFIG.volume;
    longClickAudio.preload = "auto";

    audioInitialized = true;
}

/**
 * Play the short click sound
 * Used for button clicks
 */
export function playShortClick() {
    const state = useUI.getState();

    // Check if click sounds should play:
    // 1. Audio must be enabled (not muted)
    // 2. Click sounds must have been activated (user reached state_3 at some point)
    if (!state.audioEnabled || !state.clickSoundActivated) {
        return;
    }

    if (!shortClickAudio) {
        initializeAudio();
    }

    if (shortClickAudio) {
        // Reset to short click start position and play
        shortClickAudio.currentTime = CLICK_SOUND_CONFIG.shortClickStart;
        shortClickAudio.volume = CLICK_SOUND_CONFIG.volume * state.audioVolume;
        shortClickAudio.play().catch(() => {
            // Ignore autoplay errors - user interaction required first
        });
    }
}

/**
 * Play the long click sound
 * Used for more impactful interactions
 */
export function playLongClick() {
    const state = useUI.getState();

    if (!state.audioEnabled || !state.clickSoundActivated) {
        return;
    }

    if (!longClickAudio) {
        initializeAudio();
    }

    if (longClickAudio) {
        longClickAudio.currentTime = CLICK_SOUND_CONFIG.longClickStart;
        longClickAudio.volume = CLICK_SOUND_CONFIG.volume * state.audioVolume;
        longClickAudio.play().catch(() => {
            // Ignore autoplay errors
        });
    }
}

/**
 * Custom hook for click sound functionality
 * Returns a function to play the short click sound
 */
export function useClickSound() {
    return useCallback(() => {
        playShortClick();
    }, []);
}

/**
 * Custom hook for long click sound
 */
export function useLongClickSound() {
    return useCallback(() => {
        playLongClick();
    }, []);
}

/**
 * ClickSoundManager Component
 * 
 * This component manages the click sound system lifecycle:
 * - Initializes audio on mount
 * - Activates click sounds when reaching state_3 (and keeps them active afterwards)
 * - Syncs volume with global audio settings
 */
export function ClickSoundManager() {
    const state = useUI((st) => st.state);
    const audioVolume = useUI((st) => st.audioVolume);
    const clickSoundActivated = useUI((st) => st.clickSoundActivated);
    const setClickSoundActivated = useUI((st) => st.setClickSoundActivated);

    // Initialize audio on mount
    useEffect(() => {
        initializeAudio();
    }, []);

    // Activate click sounds when reaching state_3 or beyond
    // Once activated, they stay active even if going back to earlier states
    useEffect(() => {
        // state_3 is enum value 1 (S.state_3 = 1)
        if (state >= S.state_3 && !clickSoundActivated) {
            setClickSoundActivated(true);
        }
    }, [state, clickSoundActivated, setClickSoundActivated]);

    // Sync volume when audioVolume changes
    useEffect(() => {
        if (shortClickAudio) {
            shortClickAudio.volume = CLICK_SOUND_CONFIG.volume * audioVolume;
        }
        if (longClickAudio) {
            longClickAudio.volume = CLICK_SOUND_CONFIG.volume * audioVolume;
        }
    }, [audioVolume]);

    // This component renders nothing
    return null;
}
