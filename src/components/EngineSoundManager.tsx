import { useEffect, useRef } from "react";
import { useUI, S } from "../state";

/**
 * Engine Sound Configuration
 * Centralized settings for the spaceship engine sound
 */
export const ENGINE_SOUND_CONFIG = {
    // Base volume for engine sound (will be multiplied by global audio volume)
    baseVolume: 0.4,

    // Fade durations in milliseconds
    fadeInDuration: 800,  // How fast engine ramps up when ship starts moving
    fadeOutDuration: 1200, // How fast engine fades out when ship stops

    // Velocity thresholds
    minVelocityThreshold: 0.5,  // Minimum velocity to consider ship "moving"
    maxVelocityForFullVolume: 15, // Velocity at which engine reaches full volume

    // Audio file path
    audioPath: "/assets/audio/engine2.m4a",

    // Loop settings
    loop: true,
};

// Shared velocity tracking - updated by canvasBabylon.tsx
// This allows the BabylonCanvas component to report ship velocity to the engine sound manager
let currentShipVelocity = 0;
let isGuidedAnimationActive = false;

/**
 * Update the ship velocity from external sources (canvasBabylon.tsx)
 * This should be called from the render loop to keep velocity accurate
 */
export function updateEngineVelocity(velocity: number) {
    currentShipVelocity = velocity;
}

/**
 * Notify engine sound manager that a guided animation is active/inactive
 * During guided mode animations, the ship is moving even if velocity tracking might lag
 */
export function setGuidedAnimationActive(active: boolean) {
    isGuidedAnimationActive = active;
}

/**
 * Get current ship velocity (for debugging or external use)
 */
export function getEngineVelocity(): number {
    return currentShipVelocity;
}

/**
 * EngineSoundManager Component
 * 
 * Manages the spaceship engine sound:
 * - Plays looping engine sound when ship is moving
 * - Fades in/out based on ship velocity
 * - Disabled in states 0, 3, and final
 * - Respects global audio settings
 */
export function EngineSoundManager() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const fadeAnimationRef = useRef<number | null>(null);
    const isPlayingRef = useRef(false);
    const currentVolumeRef = useRef(0);
    const velocityCheckIntervalRef = useRef<number | null>(null);

    // Subscribe to relevant state
    const s = useUI((st) => st.state);
    const audioEnabled = useUI((st) => st.audioEnabled);
    const audioVolume = useUI((st) => st.audioVolume);
    const navigationMode = useUI((st) => st.navigationMode);

    // Determine if engine sound should be allowed based on state
    // Engine is disabled in states 0, 3, and final
    const engineAllowedInState = s !== S.state_0 && s !== S.state_3 && s !== S.state_final;

    // Initialize audio element
    useEffect(() => {
        if (!audioRef.current) {
            const audio = new Audio(ENGINE_SOUND_CONFIG.audioPath);
            audio.loop = ENGINE_SOUND_CONFIG.loop;
            audio.volume = 0;
            audio.preload = "auto";
            audioRef.current = audio;
        }

        return () => {
            // Cleanup on unmount
            if (fadeAnimationRef.current) {
                cancelAnimationFrame(fadeAnimationRef.current);
            }
            if (velocityCheckIntervalRef.current) {
                clearInterval(velocityCheckIntervalRef.current);
            }
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Handle visibility change (pause when browser goes to background)
    useEffect(() => {
        const handleVisibilityChange = () => {
            const audio = audioRef.current;
            if (!audio) return;

            if (document.hidden) {
                audio.pause();
            } else if (isPlayingRef.current && useUI.getState().audioEnabled) {
                audio.play().catch(() => { /* Ignore autoplay errors */ });
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);

    // Smart fade function
    const fadeToVolume = (targetVolume: number, duration: number) => {
        const audio = audioRef.current;
        if (!audio) return;

        // Cancel any ongoing fade
        if (fadeAnimationRef.current) {
            cancelAnimationFrame(fadeAnimationRef.current);
            fadeAnimationRef.current = null;
        }

        const startVolume = currentVolumeRef.current;
        const startTime = performance.now();

        const fade = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Use ease-out cubic for smooth fade
            const eased = 1 - Math.pow(1 - progress, 3);
            const newVolume = startVolume + (targetVolume - startVolume) * eased;

            audio.volume = newVolume;
            currentVolumeRef.current = newVolume;

            if (progress < 1) {
                fadeAnimationRef.current = requestAnimationFrame(fade);
            } else {
                audio.volume = targetVolume;
                currentVolumeRef.current = targetVolume;
                fadeAnimationRef.current = null;

                // If we've faded to 0, pause the audio
                if (targetVolume === 0 && isPlayingRef.current) {
                    audio.pause();
                    isPlayingRef.current = false;
                }
            }
        };

        fade();
    };

    // Main velocity monitoring and sound control
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // If audio is globally disabled or not allowed in this state, stop engine
        if (!audioEnabled || !engineAllowedInState) {
            if (isPlayingRef.current) {
                fadeToVolume(0, ENGINE_SOUND_CONFIG.fadeOutDuration);
            }
            return;
        }

        // Start velocity monitoring loop
        const checkVelocity = () => {
            const velocity = currentShipVelocity;
            const isMoving = velocity > ENGINE_SOUND_CONFIG.minVelocityThreshold || isGuidedAnimationActive;

            // Calculate target volume based on velocity
            const globalVolume = useUI.getState().audioVolume;
            let targetVolume = 0;

            if (isMoving) {
                // Scale volume based on velocity (louder when faster)
                const velocityFactor = Math.min(
                    velocity / ENGINE_SOUND_CONFIG.maxVelocityForFullVolume,
                    1
                );
                // Use square root for more perceptible volume scaling at low velocities
                const scaledFactor = Math.sqrt(velocityFactor);
                targetVolume = ENGINE_SOUND_CONFIG.baseVolume * globalVolume * Math.max(scaledFactor, 0.3);
            }

            // Start playing if not already playing and should be moving
            if (isMoving && !isPlayingRef.current) {
                audio.currentTime = 0;
                audio.play().catch(() => { /* Ignore autoplay errors */ });
                isPlayingRef.current = true;
                fadeToVolume(targetVolume, ENGINE_SOUND_CONFIG.fadeInDuration);
            }
            // Fade out if stopped moving
            else if (!isMoving && isPlayingRef.current) {
                fadeToVolume(0, ENGINE_SOUND_CONFIG.fadeOutDuration);
            }
            // Adjust volume if already playing (smooth velocity-based adjustment)
            else if (isMoving && isPlayingRef.current) {
                // Only adjust if difference is significant (avoid constant micro-adjustments)
                const volumeDiff = Math.abs(targetVolume - currentVolumeRef.current);
                if (volumeDiff > 0.02) {
                    // Use shorter duration for velocity-based adjustments
                    fadeToVolume(targetVolume, 300);
                }
            }
        };

        // Check velocity frequently for responsive sound
        velocityCheckIntervalRef.current = window.setInterval(checkVelocity, 50);

        return () => {
            if (velocityCheckIntervalRef.current) {
                clearInterval(velocityCheckIntervalRef.current);
                velocityCheckIntervalRef.current = null;
            }
        };
    }, [audioEnabled, engineAllowedInState]);

    // Sync with global volume changes
    useEffect(() => {
        if (isPlayingRef.current && audioRef.current) {
            const velocity = currentShipVelocity;
            const velocityFactor = Math.min(
                velocity / ENGINE_SOUND_CONFIG.maxVelocityForFullVolume,
                1
            );
            const scaledFactor = Math.sqrt(velocityFactor);
            const targetVolume = ENGINE_SOUND_CONFIG.baseVolume * audioVolume * Math.max(scaledFactor, 0.3);

            // Immediate volume sync when user adjusts volume
            if (audioRef.current) {
                audioRef.current.volume = targetVolume;
                currentVolumeRef.current = targetVolume;
            }
        }
    }, [audioVolume]);

    // This component renders nothing
    return null;
}
