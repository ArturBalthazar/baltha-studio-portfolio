import React from "react";
import { Header } from "./components/header";
import { CanvasFrame } from "./components/canvasFrame";
import { BabylonCanvas } from "./components/canvasBabylon";
import { TypingText } from "./components/TypingText";
import { OverlayBox } from "./components/OverlayBox";
import { useUI, S } from "./state";
import { getStateConfig } from "./states";

export default function App() {
  const s = useUI((st) => st.state);
  const { next } = useUI();
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
      {/* Full-viewport grid: header (auto) + canvas (fills rest).
          pt = top padding, pb = bottom margin, gap = space between rows. */}
      <main
        className="
          h-[100dvh] min-h-[100svh] w-full
          overflow-hidden
          grid grid-rows-[max-content,1fr]
          gap-2 md:gap-4
          px-2 md:px-0
          pt-2 md:pt-4
          pb-2 md:pb-4
        "
        style={{ transition: "all 500ms ease", height: 'var(--app-vh)', minHeight: 'var(--app-vh)'}}
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

       {/* Chat FAB placeholder (state-driven later) */}
       <button
         className="fixed z-50 h-12 w-12 rounded-full shadow-hero bg-white/90 backdrop-blur text-ink
                   bottom-6 left-1/2 transform -translate-x-1/2 md:translate-x-0 md:bottom-6 md:right-6 md:left-auto"
         aria-label="Open chat"
       >
         <span className="sr-only">Open chat</span>💬
       </button>
    </>
  );
}
