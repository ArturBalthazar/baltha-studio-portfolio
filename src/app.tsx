import React from "react";
import cx from "classnames";
import { Header } from "./components/header";
import { CanvasFrame } from "./components/canvasFrame";
import { BabylonCanvas } from "./components/canvasBabylon";
import { TypingText } from "./components/TypingText";
import { OverlayBox } from "./components/OverlayBox";
import { BottomLeftControls } from "./components/BottomLeftControls";
import { Chat } from "./components/Chat";
import { useUI, S } from "./state";
import { getStateConfig } from "./states";

export default function App() {
  const s = useUI((st) => st.state);
  const chatOpen = useUI((st) => st.chatOpen);
  const { setChatOpen, setSelectedLogoModel, setSelectedContinent } = useUI();
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

  const handleButtonClick = (index: number) => {
    console.log(
      `Button ${index} clicked:`,
      config.content.overlayContent?.buttons[index]
    );
    
    // Handle state 2 button clicks - switch logo models
    if (s === S.state_2) {
      setSelectedLogoModel(index);
    }
    
    // Handle state 3 button clicks - rotate planet to continent
    if (s === S.state_3) {
      setSelectedContinent(index);
    }
  };

  const handlePrevious = () => {
    if (s > S.state_1) {
      useUI.getState().setState(s - 1);
    }
  };

  const handleNext = () => {
    if (s < S.state_10) {
      useUI.getState().setState(s + 1);
    }
  };

  return (
    <>
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

              {/* Typing text overlay - appears at top-left */}
              {config.content.showTypingText && config.content.typingText && (
                <div className="absolute top-8 left-8 right-8 md:left-16 md:right-16 md:top-12 z-20">
                  <TypingText
                    text={config.content.typingText}
                    startDelay={500}
                    typingSpeed={25}
                    className="text-brand-white text-base md:text-2xl"
                  />
                </div>
              )}

              {/* Single resizing overlay box */}
              {(s === S.state_2 || s === S.state_3 || s === S.state_4) && (
                <OverlayBox
                  visible={true}
                  currentState={s}
                  onButtonClick={handleButtonClick}
                  delay={500}
                  transitionDuration={1000}
                />
              )}

              {/* Navigation buttons */}
              {s > S.state_1 && (
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-30 hidden md:flex w-12 h-16 items-center justify-center text-white text-2xl transition-all duration-200 hover:scale-[1.1] opacity-15 hover:opacity-90 pointer-events-auto select-none"
                  aria-label="Previous state"
                >
                  <img
                    src="/assets/images/state_arrow.png"
                    alt="Previous state"
                    className="w-12 h-12 rotate-180 pointer-events-none"
                  />
                </button>
              )}

              {s < S.state_10 && (
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-30 hidden md:flex w-12 h-16 items-center justify-center text-white text-2xl transition-all duration-200 hover:scale-[1.1] opacity-15 hover:opacity-90 pointer-events-auto select-none"
                  aria-label="Next state"
                >
                  <img
                    src="/assets/images/state_arrow.png"
                    alt="Next state"
                    className="w-12 h-12 pointer-events-none"
                  />
                </button>
              )}

              {/* Mobile navigation buttons - bottom left and right corners */}
              {s > S.state_1 && (
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 z-30 top-1/2 -translate-y-1/2 md:hidden flex w-9 h-9 items-center justify-center text-white text-xl transition-all duration-200 opacity-50 pointer-events-auto select-none"
                  aria-label="Previous state"
                >
                  <img
                    src="/assets/images/state_arrow.png"
                    alt="Previous state"
                    className="w-12 h-12 rotate-180 pointer-events-none"
                  />
                </button>
              )}

              {s < S.state_10 && (
                <button
                  onClick={handleNext}
                  className="absolute right-4 z-30 top-1/2 -translate-y-1/2 md:hidden flex w-9 h-9 items-center justify-center text-white text-xl transition-all duration-200 opacity-50 pointer-events-auto select-none"
                  aria-label="Next state"
                >
                  <img
                    src="/assets/images/state_arrow.png"
                    alt="Next state"
                    className="w-12 h-12 pointer-events-none"
                  />
                </button>
              )}

              {/* Bottom Left Controls (State 5+) */}
              {config.content.showBottomLeftControls && (
                <BottomLeftControls 
                  visible={true} 
                  delay={500}
                  isState5={s === S.state_5}
                  chatOpen={chatOpen}
                  onChatToggle={() => setChatOpen(!chatOpen)}
                />
              )}
            </CanvasFrame>
          </div>
          
          {/* Bottom label */}
          <div 
            className={cx(
              "absolute bottom-1 md:bottom-2 left-1/2 -translate-x-1/2 z-20 text-xs font-mono tracking-wide transition-colors duration-500 select-none pointer-events-none",
              config.content.whiteBottomLabel ? "text-brand-white" : "text-brand-dark/70"
            )}
          >
            BALTHA STUDIO 2025
          </div>

        </main>
      </div>

      {/* Chat FAB - Hidden in State 5 on mobile only (integrated into BottomLeftControls on mobile) */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className={cx(
          "fixed z-50 rounded-full",
          // mobile (centered via right hack you used) - hidden in State 5
          "bottom-[90px] -right-[50%] -translate-x-[25px]",
          s === S.state_5 && "hidden md:flex",
          // desktop: push farther right, small bottom tweak - always visible
          "md:bottom-[70px] md:-right-[100%] md:-translate-x-[70px]",
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
