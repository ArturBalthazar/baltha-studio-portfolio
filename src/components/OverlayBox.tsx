import React, { useState, useEffect, useRef } from "react";
import cx from "classnames";
import { S, useUI } from "../state";
import { useI18n } from "../i18n";
import { playShortClick } from "./ClickSoundManager";

interface OverlayBoxProps {
  visible: boolean;
  currentState: S;
  className?: string;
  onButtonClick?: (index: number) => void;
  delay?: number;
  transitionDuration?: number;
}

export function OverlayBox({
  visible,
  currentState,
  className = "",
  onButtonClick,
  delay = 500,
  transitionDuration = 1000,
}: OverlayBoxProps) {
  const [showBox, setShowBox] = useState(false);

  // Get global state
  const { t } = useI18n();
  const navigationMode = useUI((st) => st.navigationMode);
  const audioEnabled = useUI((st) => st.audioEnabled);
  const audioVolume = useUI((st) => st.audioVolume);
  const { setNavigationMode, setAudioEnabled, setAudioVolume } = useUI();
  const previousVolumeRef = useRef(0.5);

  // Audio is effectively on if volume > 0
  const isAudioOn = audioVolume > 0;

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setShowBox(true), delay);
      return () => clearTimeout(t);
    } else {
      setShowBox(false);
    }
  }, [visible, delay]);

  // State 3 content - navigation mode selection (using translations)
  const state3Content = {
    title: t.state3.navigationTitle,
    buttons: [
      { icon: "/assets/images/guided_mode.png", label: t.state3.guided, selected: navigationMode === 'guided' },
      { icon: "/assets/images/free_mode.png", label: t.state3.free, selected: navigationMode === 'free' },
    ],
  };

  // Handle button clicks
  const handleInternalButtonClick = (index: number) => {
    // Play click sound
    playShortClick();

    // Update global navigation mode
    setNavigationMode(index === 0 ? 'guided' : 'free');

    // Also call the external handler if provided
    onButtonClick?.(index);
  };

  // Handle audio toggle - syncs with volume system
  const handleAudioToggle = () => {
    // Play click sound
    playShortClick();

    if (isAudioOn) {
      // Mute: save current volume and set to 0
      previousVolumeRef.current = audioVolume;
      setAudioVolume(0);
      setAudioEnabled(false);
    } else {
      // Unmute: restore previous volume
      const restoreVolume = previousVolumeRef.current > 0 ? previousVolumeRef.current : 0.5;
      setAudioVolume(restoreVolume);
      setAudioEnabled(true);
    }
  };

  // Only render for state 3
  if (currentState !== S.state_3) return null;

  return (
    <div
      className={cx(
        "absolute inset-0 flex items-center justify-center transition-all pointer-events-none select-none",
        showBox ? "opacity-100" : "opacity-0",
        className
      )}
      style={{ transitionDuration: `${transitionDuration}ms` }}
    >
      {/* Frame container */}
      <div
        className={cx(
          "relative shrink-0 rounded-canvas transition-all duration-1000",
          // State 3 dimensions - auto width and height to wrap content
          "w-auto h-auto",
          "translate-y-[0%] sm:-translate-y-[calc(60%-100px)]"
        )}
      >
        {/* HALO layer: blurred border only */}
        <div
          className="pointer-events-none absolute inset-0 rounded-canvas border-[1px] border-white select-none"
          style={{
            filter: "blur(3px)",
            transform: "scale(1)",
            transformOrigin: "center",
          }}
          aria-hidden
        />
        {/* BACKDROP BLUR LAYER */}
        <div
          className="absolute inset-0 rounded-canvas backdrop-blur-sm bg-brand-dark/5 pointer-events-none"
          aria-hidden
        />

        {/* CRISP stroke on top */}
        <div className="pointer-events-none absolute inset-0 rounded-canvas border-[1px] border-white/45 select-none" aria-hidden />

        {/* MAIN CONTENT */}
        <div className="relative z-10 w-full translate-y-[8px] sm:-translate-y-0 rounded-canvas px-4 py-2 sm:px-10 sm:py-8 flex flex-col text-center pointer-events-none select-none">

          {/* STATE 3 CONTENT - Navigation Mode and Audio */}
          <div className="flex flex-col text-center select-none opacity-100">
            {/* Content Layout - Navigation Mode and Audio: vertical on mobile, horizontal on desktop */}
            <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-12 pointer-events-none">

              {/* Navigation Mode Section */}
              <div className="flex flex-col items-center gap-1 sm:gap-2 pointer-events-none">
                {/* Navigation Mode Title */}
                <h2 className="font-sans text-white text-lg sm:text-2xl font-medium select-none mb-1 sm:mb-2">{state3Content.title}</h2>

                {/* Navigation Mode Buttons */}
                <div className="flex gap-3 sm:gap-6">
                  {state3Content.buttons.map((button, index) => (
                    <div key={`state3-${index}`} className="flex flex-col items-center gap-1 sm:gap-2 pointer-events-none">
                      <button
                        onClick={() => handleInternalButtonClick(index)}
                        className={cx(
                          "relative w-12 h-12 sm:w-16 sm:h-16 rounded-bigButton border-0",
                          "flex items-center justify-center transition-all duration-300 hover:scale-105 select-none",
                          "pointer-events-auto"
                        )}
                        title={button.label}
                      >
                        {/* non-selected subtle outline */}
                        {!button.selected && (
                          <div
                            className="pointer-events-none absolute inset-0 rounded-bigButton border-2 border-white/30"
                            aria-hidden
                          />
                        )}

                        {/* selected state: gradient + halo line + crisp line */}
                        {button.selected && (
                          <>
                            <div
                              className="absolute inset-0 rounded-bigButton"
                              style={{
                                background:
                                  "linear-gradient(to top,rgba(180, 173, 230, 0.4),rgba(255, 181, 218, 0.2))",
                              }}
                            />
                            <div
                              className="pointer-events-none absolute inset-0 rounded-bigButton border-[1px] border-white"
                              style={{ filter: "blur(2px)", transform: "scale(1.02)", transformOrigin: "center" }}
                              aria-hidden
                            />
                            <div
                              className="pointer-events-none absolute inset-0 rounded-bigButton border-2 border-white/70"
                              aria-hidden
                            />
                          </>
                        )}

                        {/* icon / content */}
                        <span className="relative z-10 text-white flex items-center justify-center">
                          <img src={button.icon} alt={button.label} className="w-[70%] h-[70%] object-contain" />
                        </span>
                      </button>

                      {/* Button Label */}
                      <span className="font-mono text-white text-xs sm:text-base select-none">{button.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Divider: horizontal on mobile, vertical on desktop */}
              <div className="w-32 h-px sm:w-px sm:h-24 bg-white/20" />

              {/* Audio Section */}
              <div className="flex flex-col items-center gap-1 sm:gap-2 pointer-events-none">
                {/* Audio Title */}
                <h2 className="font-sans text-white text-lg sm:text-2xl font-medium select-none mb-1 sm:mb-2">{t.state3.audioTitle}</h2>

                {/* Audio Toggle Button */}
                <div className="flex flex-col items-center gap-1 sm:gap-2 pointer-events-none">
                  <button
                    onClick={handleAudioToggle}
                    className={cx(
                      "relative w-12 h-12 sm:w-16 sm:h-16 rounded-bigButton border-0",
                      "flex items-center justify-center transition-all duration-300 hover:scale-105 select-none",
                      "pointer-events-auto"
                    )}
                    title={isAudioOn ? t.controls.turnAudioOff : t.controls.turnAudioOn}
                  >
                    {/* non-selected (audio off) subtle outline */}
                    {!isAudioOn && (
                      <div
                        className="pointer-events-none absolute inset-0 rounded-bigButton border-2 border-white/30"
                        aria-hidden
                      />
                    )}

                    {/* selected state (audio on): gradient + halo line + crisp line */}
                    {isAudioOn && (
                      <>
                        <div
                          className="absolute inset-0 rounded-bigButton"
                          style={{
                            background:
                              "linear-gradient(to top,rgba(180, 173, 230, 0.4),rgba(255, 181, 218, 0.2))",
                          }}
                        />
                        <div
                          className="pointer-events-none absolute inset-0 rounded-bigButton border-[1px] border-white"
                          style={{ filter: "blur(2px)", transform: "scale(1.02)", transformOrigin: "center" }}
                          aria-hidden
                        />
                        <div
                          className="pointer-events-none absolute inset-0 rounded-bigButton border-2 border-white/70"
                          aria-hidden
                        />
                      </>
                    )}

                    {/* Audio icon */}
                    <span className="relative z-10 text-white flex items-center justify-center">
                      <img
                        src={isAudioOn ? "/assets/images/audio_on.png" : "/assets/images/audio_off.png"}
                        alt={isAudioOn ? "On" : "Off"}
                        className="w-[70%] h-[70%] object-contain"
                      />
                    </span>
                  </button>

                  {/* Audio Label - invisible but keeps layout */}
                  <span className="font-mono text-white/0 text-xs sm:text-base select-none">
                    {isAudioOn ? t.state3.on : t.state3.off}
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
