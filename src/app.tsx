import React from "react";
import cx from "classnames";
import { Header } from "./components/header";
import { CanvasFrame } from "./components/canvasFrame";
import { BabylonCanvas } from "./components/canvasBabylon";
import { TypingText } from "./components/TypingText";
import { OverlayBox } from "./components/OverlayBox";
import { Chat } from "./components/Chat";
import { useUI, S } from "./state";
import { getStateConfig } from "./states";

export default function App() {
  const s = useUI((st) => st.state);
  const chatOpen = useUI((st) => st.chatOpen);
  const { next, setChatOpen } = useUI();
  const config = getStateConfig(s);

const handleButtonClick = (index: number) => {
  console.log(`Button ${index} clicked:`, config.content.overlayContent?.buttons[index]);
  // TODO: Handle button click logic here
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
      <div className="h-[100dvh] min-h-[100svh] w-full overflow-hidden" 
          style={{ height: 'var(--app-vh)' }}>
        
        {/* Main content: header + canvas */}
        <main
          className={cx(
            "h-full w-full",
            "grid grid-rows-[max-content,1fr]",
            "gap-2 md:gap-4",
            "px-2 md:px-0",
            "pt-2 md:pt-4",
            "pb-2 md:pb-4",
            "transition-all duration-500 ease-in-out",
            // Slide left by 20% on desktop when chat is open
            chatOpen ? "md:transform md:-translate-x-[11%]" : ""
          )}
        >
      {/* Single header card; shows welcome text based on state config */}
      <Header showWelcome={true} />

      {/* Canvas row fills the remaining height */}
      <div 
        className="w-full md:w-3/4 mx-auto h-full min-h-0 relative"
        style={{ transition: "all 500ms ease" }}
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
            {(s === S.state_2 || s === S.state_3) && (
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
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30
                          hidden md:flex
                          w-12 h-16
                          items-center justify-center text-white text-2xl
                          transition-all duration-200 hover:scale-[1.1] opacity-15 hover:opacity-90"
                aria-label="Previous state"
              >
                <img src="/assets/images/state_arrow.png" alt="Previous state" className="w-12 h-12 rotate-180" />
              </button>
            )}
            
            {s < S.state_10 && (
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30
                          hidden md:flex
                          w-12 h-16
                          items-center justify-center text-white text-2xl
                          transition-all duration-200 hover:scale-[1.1] opacity-15 hover:opacity-90"
                aria-label="Next state"
              >
                <img src="/assets/images/state_arrow.png" alt="Previous state" className="w-12 h-12" />
              </button>
            )}
            
            {/* Mobile navigation buttons - bottom left and right corners */}
            {s > S.state_1 && (
              <button
                onClick={handlePrevious}
                className="absolute bottom-5 left-4 z-30
                          md:hidden flex
                          w-9 h-9
                          items-center justify-center text-white text-xl
                          transition-all duration-200 opacity-50"
                aria-label="Previous state"
              >
                <img src="/assets/images/state_arrow.png" alt="Previous state" className="w-12 h-12 rotate-180" />
              </button>
            )}
            
            {s < S.state_10 && (
              <button
                onClick={handleNext}
                className="absolute bottom-5 right-4 z-30
                          md:hidden flex
                          w-9 h-9
                          items-center justify-center text-white text-xl
                          transition-all duration-200 opacity-50"
                aria-label="Next state"
              >
                <img src="/assets/images/state_arrow.png" alt="Next state" className="w-12 h-12" />
              </button>
            )}
        </CanvasFrame>
      </div>

      {/* (Kept for later reference, but disabled to avoid scroll) */}
      {false && s === S.state_1 && (
        <section
          className="mx-auto w-[calc(100%-40px)] md:w-3/4 bg-card text-ink rounded-hero shadow-hero px-7 md:px-10 py-8 md:py-10"
          style={{ transition: "all 600ms ease" }}
        >
          <div className="flex items-start justify-between gap-6">
            <h1 className="font-sans text-3xl md:text-5xl font-extrabold leading-tight">
              Welcome to Baltha Studio! I’m Artur Balthazar, your
              professional 3D designer and developer.
            </h1>
            <img
              src="/assets/images/menu.png"
              alt=""
              className="h-7 md:h-8 opacity-90"
              draggable={false}
            />
          </div>
        </section>
      )}

      {false && (
        <footer className="mt-6 text-center text-xs tracking-widest text-ink/80">
          BALTHA STUDIO 2025
        </footer>
      )}
        </main>
        
      </div>

      <button
        onClick={() => setChatOpen(!chatOpen)}
        className={cx(
          "fixed z-50 rounded-full",
          // mobile (centered)
          "bottom-[75px] -right-[50%] -translate-x-[25px]",
          // desktop overrides (pin to right with margin)
          "md:bottom-[70px] md:-right-[100%] md:-translate-x-[70px]",

          "flex items-center justify-center cursor-pointer",
          "backdrop-blur-sm shadow-[inset_0_0_4px_3px_rgba(255,255,255,0.452)]",
          "relative overflow-visible",
          "transition-all duration-300 ease-in-out hover:scale-105",

          // Hide on desktop when chat is open
          chatOpen ? "md:hidden" : "",
          chatOpen ? "w-[50px] h-[50px]" : "w-[50px] h-[50px]"
        )}
        style={{
          background: chatOpen 
            ? `rgba(255,255,255,0.233)` // No gradient when open (mobile)
            : `radial-gradient(circle, transparent 30%, rgba(255,255,255,0.233) 70%)`
        }}
        aria-label={chatOpen ? "Close chat" : "Open chat"}
      >
        {/* Animated rotating glow background - only when closed */}
        {!chatOpen && (
          <div
            className="absolute top-[2.5px] left-[2.5px] w-[45px] h-[45px] -z-10
                      rounded-[35%] blur-[10px] opacity-100"
            style={{
              background: `conic-gradient(
                from 0deg,
                #9A92D2,
                #7583ff,
                #FF8800,
                #FF99CC,
                #9A92D2
              )`,
              animation: 'rotateGlow 5s linear infinite'
            }}
          />
        )}
        
        {/* Chat icon - changes when open/closed */}
        <img 
          src={chatOpen ? "/assets/images/close.png" : "/assets/images/chatIcon.png"}
          alt={chatOpen ? "Close" : "Chat"}
          className={chatOpen ? "w-[20px] h-[20px]" : "w-[30px] h-[30px] mt-[5px]"}
        />
        <span className="sr-only">{chatOpen ? "Close chat" : "Open chat"}</span>
      </button>

      {/* Mobile Chat component */}
      {chatOpen && (
        <Chat 
          className="md:hidden" 
          onClose={() => setChatOpen(false)} 
        />
      )}
    </>
);
}
