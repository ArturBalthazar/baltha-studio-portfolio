import React, { useState, useRef } from "react";
import cx from "classnames";
import { useUI } from "../state";
import { InfoPanel } from "./InfoPanel";
import { playShortClick } from "./ClickSoundManager";

interface BottomLeftControlsProps {
  visible: boolean;
  delay?: number;
  isState4?: boolean;
  chatOpen?: boolean;
  onChatToggle?: () => void;
}

export function BottomLeftControls({
  visible,
  delay = 0,
  isState4 = false,
  chatOpen = false,
  onChatToggle
}: BottomLeftControlsProps) {
  const audioEnabled = useUI((st) => st.audioEnabled);
  const audioVolume = useUI((st) => st.audioVolume);
  const navigationMode = useUI((st) => st.navigationMode);
  const { setAudioEnabled, setAudioVolume, setNavigationMode } = useUI();
  const [infoOpen, setInfoOpen] = useState(false);
  const [volumeSliderVisible, setVolumeSliderVisible] = useState(false);
  const previousVolumeRef = useRef(0.5); // Store volume before muting

  // Volume is effectively muted if it's 0
  const isMuted = audioVolume === 0;

  const toggleAudio = () => {
    playShortClick();
    if (isMuted) {
      // Unmute: restore previous volume (or default to 0.5)
      const restoreVolume = previousVolumeRef.current > 0 ? previousVolumeRef.current : 0.5;
      setAudioVolume(restoreVolume);
      setAudioEnabled(true);
    } else {
      // Mute: save current volume and set to 0
      previousVolumeRef.current = audioVolume;
      setAudioVolume(0);
      setAudioEnabled(false);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    // Save previous volume if we're above 0 (for mute/unmute button)
    if (audioVolume > 0) {
      previousVolumeRef.current = audioVolume;
    }
    setAudioVolume(newVolume);
    // Don't toggle audioEnabled during sliding - just update volume
    // The audio will keep playing, just at different volume
  };

  const toggleNavigation = () => {
    playShortClick();
    const newMode = navigationMode === 'guided' ? 'free' : 'guided';
    setNavigationMode(newMode);
  };

  const toggleInfo = () => {
    playShortClick();
    setInfoOpen(!infoOpen);
  };

  return (
    <div
      className={cx(
        "fixed z-50 flex items-center",
        "transition-all duration-500 ease-in-out",
        // Mobile: State 4 uses full width centered, other states left-aligned
        isState4 ? "bottom-[40px] left-3 right-3 justify-center px-4" : "bottom-[90px] left-[30px]",
        // Desktop: Always left-aligned at same position
        isState4 ? "sm:bottom-5 sm:left-[30px] sm:right-auto sm:justify-start sm:px-0" : "sm:bottom-5",
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      style={{
        transitionDelay: visible ? `${delay}ms` : '0ms'
      }}
    >
      <div className={cx(
        "flex items-center",
        // Mobile: State 4 spreads buttons, other states grouped
        isState4 ? "w-full max-w-[500px] justify-between sm:w-auto sm:justify-start sm:gap-4" : "gap-4"
      )}>
        {/* Info Button */}
        <button
          onClick={toggleInfo}
          className={cx(
            "control-btn relative w-[50px] h-[50px] rounded-full",
            "flex items-center justify-center",
            "backdrop-blur-[10px]",
            "transition-all duration-300 hover:scale-[1.07]",
            "shadow-[inset_0_0_1px_1px_rgba(255,255,255,0.452)]"
          )}
          style={{
            backgroundColor: '#08142830'
          }}
          aria-label="Information"
        >
          <img
            src={infoOpen ? "/assets/images/close.png" : "/assets/images/info.png"}
            alt="Info"
            className={cx(
              "w-[22px] h-[22px] transition-transform duration-300",
              infoOpen && "rotate-90"
            )}
          />
        </button>

        {/* Audio Control Container - Desktop has volume slider on hover */}
        <div
          className="relative"
          onMouseEnter={() => setVolumeSliderVisible(true)}
          onMouseLeave={() => setVolumeSliderVisible(false)}
        >
          {/* Invisible hover bridge - extends the hover zone upward */}
          <div
            className={cx(
              "absolute bottom-full left-1/2 -translate-x-1/2",
              "hidden sm:block",
              "w-[180px] h-[55px]", // 45px slider + 10px gap
              volumeSliderVisible ? "pointer-events-auto" : "pointer-events-none"
            )}
          >
            {/* Volume Slider - positioned at bottom of bridge (just above button) */}
            <div
              className={cx(
                "absolute bottom-[10px] left-0",
                "flex items-center justify-center",
                "w-[225px] h-[45px] rounded-full",
                "backdrop-blur-[10px]",
                "shadow-[inset_0_0_1px_1px_rgba(255,255,255,0.452)]",
                "transition-all duration-300",
                volumeSliderVisible ? "opacity-100" : "opacity-0"
              )}
              style={{
                backgroundColor: '#08142830'
              }}
            >
              {/* Custom Range Slider */}
              <div className="relative w-[180px] h-[6px] flex items-center">
                <div
                  className="absolute inset-0 rounded-full bg-white/20"
                />
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-white/60"
                  style={{ width: `${audioVolume * 100}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={audioVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Volume"
                />
                {/* Slider Knob */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-[16px] h-[16px] rounded-full bg-white shadow-md pointer-events-none"
                  style={{ left: `calc(${audioVolume * 100}% - 8px)` }}
                />
              </div>
            </div>
          </div>

          {/* Audio Toggle Button */}
          <button
            onClick={toggleAudio}
            className={cx(
              "control-btn relative w-[50px] h-[50px] rounded-full",
              "flex items-center justify-center",
              "backdrop-blur-[10px]",
              "transition-all duration-300 hover:scale-[1.07]",
              "shadow-[inset_0_0_1px_1px_rgba(255,255,255,0.452)]"
            )}
            style={{
              backgroundColor: '#08142830'
            }}
            aria-label={audioEnabled ? "Mute audio" : "Unmute audio"}
          >
            <img
              src={isMuted ? "/assets/images/audio_off.png" : "/assets/images/audio_on.png"}
              alt={isMuted ? "Audio Off" : "Audio On"}
              className="w-[22px] h-[22px]"
            />
          </button>
        </div>

        {/* Navigation Mode Toggle - Pill Shape with Slider */}
        <div
          onClick={toggleNavigation}
          className={cx(
            "nav-toggle relative w-[90px] h-[50px] rounded-[25px]",
            "flex items-center justify-between px-[14px]",
            "backdrop-blur-[10px]",
            "transition-all duration-300 hover:scale-[1.02]",
            "shadow-[inset_0_0_1px_1px_rgba(255,255,255,0.45)]",
            "cursor-pointer overflow-hidden",
            navigationMode
          )}
          style={{
            backgroundColor: '#08142830'
          }}
          aria-label={`Navigation mode: ${navigationMode}`}
        >
          {/* Guided Icon */}
          <img
            src="/assets/images/guided_mode.png"
            alt="Guided"
            className="mode-icon w-[22px] h-[22px] pointer-events-none transition-opacity duration-300"
            style={{
              opacity: navigationMode === 'free' ? 0.45 : 1
            }}
          />

          {/* Free Icon */}
          <img
            src="/assets/images/free_mode.png"
            alt="Free"
            className="mode-icon w-[22px] h-[22px] pointer-events-none transition-opacity duration-300"
            style={{
              opacity: navigationMode === 'guided' ? 0.45 : 1
            }}
          />

          {/* Sliding Knob */}
          <div
            className={cx(
              "nav-knob absolute top-1/2 -translate-y-1/2",
              "w-[42px] h-[42px] rounded-full",
              "shadow-[inset_0_0_4px_3px_rgba(255,255,255,0.45)]",
              "transition-all duration-[350ms]"
            )}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              left: navigationMode === 'guided' ? '4px' : 'calc(100% - 46px)',
              transitionTimingFunction: 'cubic-bezier(0.45, 0.2, 0.2, 1)'
            }}
          />
        </div>

        {/* Chat Button (only in State 4 on mobile) */}
        {isState4 && onChatToggle && (
          <button
            onClick={() => { playShortClick(); onChatToggle(); }}
            className={cx(
              "control-btn relative w-[50px] h-[50px] rounded-full",
              "flex items-center justify-center",
              "backdrop-blur-sm shadow-[inset_0_0_4px_3px_rgba(255,255,255,0.452)]",
              "transition-all duration-300 hover:scale-[1.07]",
              "relative overflow-visible",
              // Hide on desktop (regular chat button will show)
              "sm:hidden",
              chatOpen && "opacity-0"
            )}
            style={{
              background: chatOpen
                ? `rgba(255,255,255,0.233)`
                : `radial-gradient(circle, transparent 30%, rgba(255,255,255,0.233) 70%)`,
            }}
            aria-label={chatOpen ? "Close chat" : "Open chat"}
          >
            <div
              className="absolute top-[2.5px] left-[2.5px] w-[45px] h-[45px] -z-10 rounded-[35%] blur-[10px] opacity-100"
              style={{
                background: `conic-gradient(
                from 0deg,
                #9A92D2,
                #7583ff,
                #FF8800,
                #FF99CC,
                #9A92D2
              )`,
                animation: "rotateGlow 5s linear infinite",
              }}
            />
            <img
              src="/assets/images/chatIcon.png"
              alt="Chat"
              className="w-[30px] h-[30px] mt-[5px]"
            />
          </button>
        )}
      </div>

      {/* Info Panel */}
      <InfoPanel visible={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  );
}

