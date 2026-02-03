import React from "react";
import cx from "classnames";
import { Header } from "./components/header";
import { CanvasFrame } from "./components/canvasFrame";
import { BabylonCanvas } from "./components/canvasBabylon";
import { TypingText } from "./components/TypingText";
import { OverlayBox } from "./components/OverlayBox";
import { BottomLeftControls } from "./components/BottomLeftControls";
import { WorkplacePanel } from "./components/WorkplacePanel";
import { Chat } from "./components/Chat";
import { AudioManager } from "./components/AudioManager";
import { ClickSoundManager, playShortClick } from "./components/ClickSoundManager";
import { EngineSoundManager } from "./components/EngineSoundManager";
import { useUI, S } from "./state";
import { getStateConfig } from "./states";
import { LoadingScreen } from "./components/LoadingScreen";
import { ConnectOverlay } from "./components/ConnectOverlay";
import { NavigationMenu } from "./components/NavigationMenu";
import { SideTriggerOverlay } from "./components/SideTriggerOverlay";
import { WorldLabels } from "./components/WorldLabels";
import { NextButtonTooltip } from "./components/NextButtonTooltip";
import { useI18n } from "./i18n";

export default function App() {
  const s = useUI((st) => st.state);
  const chatOpen = useUI((st) => st.chatOpen);
  const menuOpen = useUI((st) => st.menuOpen);
  const workplacePanelVisible = useUI((st) => st.workplacePanelVisible);
  const { setChatOpen, setMenuOpen } = useUI();
  const { t } = useI18n();
  const config = getStateConfig(s);
  const isFullscreen = config.canvas.fullscreen;


  const [chatVisible, setChatVisible] = React.useState(false); // For delayed removal

  // Sync chatVisible with chatOpen, but with delay on close
  React.useEffect(() => {
    if (chatOpen) {
      setChatVisible(true);
    } else {
      // Delay hiding to allow close animation
      const timer = setTimeout(() => setChatVisible(false), 500);
      return () => clearTimeout(timer);
    }
  }, [chatOpen]);

  const handleButtonClick = (index: number) => { };

  const navigationMode = useUI((st) => st.navigationMode);

  // Helper to convert state string names to S enum values
  const stateNameToEnum = (name: string): S | null => {
    const stateMap: Record<string, S> = {
      'state_0': S.state_0,
      'state_3': S.state_3,
      'state_4': S.state_4,
      'state_5': S.state_5,
      'state_6': S.state_6,
      'state_7': S.state_7,
      'state_8': S.state_8,
      'state_final': S.state_final,
    };
    return stateMap[name] ?? null;
  };

  const handlePrevious = () => {
    playShortClick();
    // In free mode, from states 4-8, go back to state_3
    // Switch to guided mode first so bezier animation triggers
    if (navigationMode === 'free' && s >= S.state_4 && s <= S.state_8) {
      useUI.getState().setNavigationMode('guided');
      useUI.getState().setState(S.state_3);
      return;
    }

    // Use config's previousState if defined
    const previousStateName = config.canvas.previousState;
    if (previousStateName) {
      const targetState = stateNameToEnum(previousStateName);
      if (targetState !== null) {
        useUI.getState().setState(targetState);
        return;
      }
    }

    // Fallback: go to previous state numerically
    if (s > S.state_0) {
      useUI.getState().setState(s - 1);
    }
  };

  const handleNext = () => {
    playShortClick();
    // In free mode, from states 4-8, go directly to state_final
    // Switch to guided mode first so bezier animation triggers
    if (navigationMode === 'free' && s >= S.state_4 && s <= S.state_8) {
      useUI.getState().setNavigationMode('guided');
      useUI.getState().setState(S.state_final);
      return;
    }

    // Use config's nextState if defined
    const nextStateName = config.canvas.nextState;
    if (nextStateName) {
      const targetState = stateNameToEnum(nextStateName);
      if (targetState !== null) {
        useUI.getState().setState(targetState);
        return;
      }
    }

    // Fallback: go to next state numerically
    if (s < S.state_final) {
      useUI.getState().setState(s + 1);
    }
  };

  return (
    <>
      <LoadingScreen />
      {/* Global Audio Manager */}
      <AudioManager />
      {/* Click Sound Manager */}
      <ClickSoundManager />
      {/* Engine Sound Manager - spaceship movement sounds */}
      <EngineSoundManager />

      {/* Side Trigger Overlay - visual effect when at screen edge during ship control */}
      <SideTriggerOverlay />

      {/* Desktop: Full width layout, chat overlays on top */}
      <div
        className="h-[100dvh] min-h-[100svh] w-full overflow-hidden"
        style={{ height: "var(--app-vh)" }}
      >
        {/* Main content: header + canvas */}
        <main
          className={cx(
            "h-full w-full",
            "grid grid-rows-[max-content,1fr]",
            "justify-items-start", // pin children to the left
            "transition-all duration-500",
            // Conditional spacing - fullscreen has no margins/padding
            isFullscreen ? "gap-0 p-0" : "gap-2 md:gap-4 px-2 md:px-4 pt-2 md:pt-4 pb-6 md:pb-8"
          )}
        >
          {/* Header */}
          <div
            className={cx(
              "justify-self-start transition-all duration-500",
              isFullscreen ? "w-full" : "w-full md:w-[75%]",
              !isFullscreen && (chatOpen ? "md:ml-0" : "md:ml-[12.5%]")
            )}
          >
            <Header showWelcome={true} />
          </div>

          {/* Canvas */}
          <div
            className={cx(
              "h-full min-h-0 relative justify-self-start transition-all duration-500",
              isFullscreen ? "w-full" : "w-full md:w-[75%]",
              !isFullscreen && (chatOpen ? "md:ml-0" : "md:ml-[12.5%]")
            )}
          >
            <CanvasFrame>
              <BabylonCanvas />

              {/* Navigation Menu Overlay */}
              <NavigationMenu
                isOpen={menuOpen}
                onClose={() => setMenuOpen(false)}
              />

              {/* World-space section labels (free mode only) */}
              <WorldLabels />

              {/* Typing text overlay - appears at top-left */}
              {config.content.showTypingText && (
                <div className="absolute top-8 left-8 right-8 md:left-16 md:right-16 md:top-12 z-20">
                  <TypingText
                    text={t.state3.typingText}
                    startDelay={500}
                    typingSpeed={25}
                    className="text-brand-white text-lg md:text-2xl"
                  />
                </div>
              )}

              {/* Single resizing overlay box */}
              {s === S.state_3 && (
                <OverlayBox
                  visible={true}
                  currentState={s}
                  onButtonClick={handleButtonClick}
                  delay={500}
                  transitionDuration={1000}
                />
              )}

              {/* Navigation buttons */}
              {s > S.state_0 && (
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex w-12 h-16 items-center justify-center text-white text-2xl transition-all duration-200 hover:scale-[1.1] opacity-50 hover:opacity-100 pointer-events-auto select-none"
                  aria-label="Previous state"
                >
                  <img
                    src="/assets/images/state_arrow.png"
                    alt="Previous state"
                    className="w-14 h-14 rotate-180 pointer-events-none"
                  />
                </button>
              )}

              {s < S.state_final && config.canvas.nextState !== null && (
                <>
                  {/* Tooltip for Next button - only in state_0 */}
                  <NextButtonTooltip visible={s === S.state_0} />

                  <button
                    onClick={handleNext}
                    className={cx(
                      "absolute top-1/2 -translate-y-1/2 z-50 hidden md:flex w-12 h-16 items-center justify-center text-white text-2xl transition-[right,transform,opacity] duration-[500ms,200ms,200ms] hover:scale-[1.1] opacity-50 hover:opacity-100 pointer-events-auto select-none",
                      // Move arrow left when chat is open in states 4-7 on desktop
                      // Chat width is calc(25% - 24px) + right-4 (16px) + gap (16px) = calc(25% + 8px)
                      chatOpen && s >= S.state_4 && s <= S.state_7 ? "right-[calc(25%+8px)]" : "right-4"
                    )}
                    aria-label="Next state"
                  >
                    <img
                      src="/assets/images/state_arrow.png"
                      alt="Next state"
                      className="w-14 h-14 pointer-events-none"
                    />
                  </button>
                </>
              )}

              {/* Mobile navigation buttons - bottom left and right corners */}
              {s > S.state_0 && (
                <button
                  onClick={handlePrevious}
                  className="absolute left-3 z-50 top-1/2 -translate-y-1/2 md:hidden flex w-12 h-16 items-center justify-center text-white text-xl transition-all duration-200 opacity-80 pointer-events-auto select-none"
                  aria-label="Previous state"
                >
                  <img
                    src="/assets/images/state_arrow.png"
                    alt="Previous state"
                    className="w-14 h-14 rotate-180 pointer-events-none"
                  />
                </button>
              )}

              {s < S.state_final && config.canvas.nextState !== null && (
                <button
                  onClick={handleNext}
                  className="absolute right-3 z-50 top-1/2 -translate-y-1/2 md:hidden flex w-12 h-16 items-center justify-center text-white text-xl transition-all duration-200 opacity-80 pointer-events-auto select-none"
                  aria-label="Next state"
                >
                  <img
                    src="/assets/images/state_arrow.png"
                    alt="Next state"
                    className="w-14 h-14 pointer-events-none"
                  />
                </button>
              )}

              {/* Bottom Left Controls (State 4+) */}
              {config.content.showBottomLeftControls && (
                <BottomLeftControls
                  visible={true}
                  delay={500}
                  isState4={s >= S.state_4 && s <= S.state_8}
                  chatOpen={chatOpen}
                  onChatToggle={() => setChatOpen(!chatOpen)}
                />
              )}

              {/* Workplace Panel - unified panel for all portfolio states (4-8) */}
              <WorkplacePanel visible={workplacePanelVisible && s >= S.state_4 && s <= S.state_8} />

              {/* Connect Overlay (State 5) */}
              {config.content.showConnectOverlay && (
                <div className="absolute inset-0 z-20 pointer-events-none">
                  <ConnectOverlay />
                </div>
              )}
            </CanvasFrame>
          </div>

          {/* Bottom label */}
          <div
            className={cx(
              "absolute bottom-1 md:bottom-2 left-1/2 -translate-x-1/2 z-50 text-xs font-mono tracking-wide transition-colors duration-500 select-none pointer-events-none",
              config.content.whiteBottomLabel ? "text-brand-white" : "text-brand-dark/70"
            )}
          >
            BALTHA STUDIO 2026
          </div>

        </main>
      </div>

      {/* Chat FAB - Hidden in State 5 on mobile only (integrated into BottomLeftControls on mobile) */}
      <button
        onClick={() => { playShortClick(); setChatOpen(!chatOpen); }}
        className={cx(
          "fixed z-50 rounded-full",
          // mobile (centered via right hack you used) - hidden in State 4
          "bottom-[90px] -right-[50%] -translate-x-[25px]",
          (s >= S.state_4 && s <= S.state_8) && "hidden sm:flex",
          // desktop: push farther right, small bottom tweak - always visible
          "sm:bottom-[70px] sm:-right-[100%] sm:-translate-x-[70px]",
          "flex items-center justify-center cursor-pointer",
          "backdrop-blur-sm shadow-[inset_0_0_4px_3px_rgba(255,255,255,0.452)]",
          "relative overflow-visible",
          "transition-all duration-300 ease-in-out hover:scale-105",
          chatOpen ? "opacity-0" : "",
          chatOpen ? "w-[50px] h-[50px]" : "w-[50px] h-[50px]"
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
          src={chatOpen ? "/assets/images/chatIcon.png" : "/assets/images/chatIcon.png"}
          alt={chatOpen ? "Chat" : "Chat"}
          className={chatOpen ? "w-[30px] h-[30px] mt-[5px]" : "w-[30px] h-[30px] mt-[5px]"}
        />
        <span className="sr-only">{chatOpen ? "Open chat" : "Open chat"}</span>
      </button>

      {/* Chat */}
      {chatVisible && <Chat onClose={() => setChatOpen(false)} />}
    </>
  );
}
