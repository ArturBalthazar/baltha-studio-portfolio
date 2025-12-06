import React, { useState } from "react";
import cx from "classnames";
import { useUI } from "../state";

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
  const navigationMode = useUI((st) => st.navigationMode);
  const { setAudioEnabled, setNavigationMode } = useUI();
  const [infoOpen, setInfoOpen] = useState(false);

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    console.log('Audio:', !audioEnabled ? 'ON' : 'OFF');
  };

  const toggleNavigation = () => {
    const newMode = navigationMode === 'guided' ? 'free' : 'guided';
    setNavigationMode(newMode);
    console.log('Navigation mode:', newMode);
  };

  const toggleInfo = () => {
    setInfoOpen(!infoOpen);
    console.log('Info:', !infoOpen ? 'OPEN' : 'CLOSED');
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
            "shadow-[inset_0_0_1px_1px_rgba(255,255,255,0.452)]",
            infoOpen && "glow-info"
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
            src={audioEnabled ? "/assets/images/audio_on.png" : "/assets/images/audio_off.png"}
            alt={audioEnabled ? "Audio On" : "Audio Off"}
            className="w-[22px] h-[22px]"
          />
        </button>

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
            onClick={onChatToggle}
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
    </div>
  );
}

