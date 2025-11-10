import React, { useState } from "react";
import cx from "classnames";

interface BottomLeftControlsProps {
  visible: boolean;
  delay?: number;
}

export function BottomLeftControls({ visible, delay = 0 }: BottomLeftControlsProps) {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [navigationMode, setNavigationMode] = useState<'guided' | 'free'>('guided');
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
        "fixed bottom-5 left-[30px] z-30 flex items-center gap-4",
        "transition-all duration-500 ease-in-out",
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      style={{
        transitionDelay: visible ? `${delay}ms` : '0ms'
      }}
    >
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
          backgroundColor: 'rgba(255,255,255,0.0)'
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
          backgroundColor: 'rgba(255,255,255,0.0)'
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
          backgroundColor: 'rgba(255,255,255,0.0)'
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
            backgroundColor: 'rgba(255,255,255,0.3)',
            left: navigationMode === 'guided' ? '4px' : 'calc(100% - 46px)',
            transitionTimingFunction: 'cubic-bezier(0.45, 0.2, 0.2, 1)'
          }}
        />
      </div>
    </div>
  );
}

