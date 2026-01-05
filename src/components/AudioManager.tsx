import { useEffect, useRef } from "react";
import { useUI, S } from "../state";

/**
 * Global audio manager that handles background music playback
 * Starts playing when entering state 4, then continues forever (like particles and rockring)
 */
export function AudioManager() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioHasStartedRef = useRef(false);
  const s = useUI((st) => st.state);
  const audioEnabled = useUI((st) => st.audioEnabled);

  useEffect(() => {
    // Create audio element on mount
    if (!audioRef.current) {
      const audio = new Audio("/assets/audio/spaceVoyage.m4a");
      audio.loop = true;
      audio.volume = 0; // Start at 0 for fade-in
      audioRef.current = audio;
    }

    // Handle visibility change (pause when browser goes to background, especially for mobile)
    const handleVisibilityChange = () => {
      const audio = audioRef.current;
      if (!audio) return;

      if (document.hidden) {
        // Browser went to background - pause immediately
        audio.pause();
      } else {
        // Browser is visible again - resume if conditions are met
        const shouldPlay = audioHasStartedRef.current && useUI.getState().audioEnabled;
        if (shouldPlay && audio.paused) {
          audio.play();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      // Cleanup on unmount
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Once we reach state 4 (index 4, S.state_4), mark audio as started (it will continue forever)
    if (s >= S.state_4 && !audioHasStartedRef.current) {
      audioHasStartedRef.current = true;
    }

    // Play music if it has started and audio is enabled
    const shouldPlay = audioHasStartedRef.current && audioEnabled;

    if (shouldPlay) {
      // If this is the first time starting, do a fade-in
      if (audio.paused) {
        audio.volume = 0; // Start from 0

        // Use play() with catch to handle autoplay restrictions
        audio.play();

        // Fade in over 1.5 seconds to 50% volume
        const fadeInDuration = 1500; // ms
        const targetVolume = 0.5;
        const startTime = performance.now();

        const fadeIn = () => {
          const elapsed = performance.now() - startTime;
          const progress = Math.min(elapsed / fadeInDuration, 1);

          // Ease out cubic for smooth fade
          const eased = 1 - Math.pow(1 - progress, 3);
          audio.volume = targetVolume * eased;

          if (progress < 1) {
            requestAnimationFrame(fadeIn);
          } else {
            audio.volume = targetVolume;
          }
        };

        fadeIn();
      }
    } else {
      audio.pause();
    }
  }, [s, audioEnabled]);

  // This component renders nothing
  return null;
}

