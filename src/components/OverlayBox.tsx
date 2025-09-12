import React, { useState, useEffect } from "react";
import cx from "classnames";
import { OverlayContent, OverlayBoxDimensions, StateContentVisibility } from "../states/types";
import { S } from "../state";
import { GraphComponent } from "./GraphComponent";

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
  
  // State management for selected buttons
  const [selectedState2Button, setSelectedState2Button] = useState(0); // Default to first button
  const [selectedState3Button, setSelectedState3Button] = useState(3); // Default to South America
  const [selectedContinent, setSelectedContinent] = useState("South America");
  const [selectedState4Button, setSelectedState4Button] = useState(0); // Default to Guided

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setShowBox(true), delay);
      return () => clearTimeout(t);
    } else {
      setShowBox(false);
    }
  }, [visible, delay]);

  // State-specific content definitions
  const state2Content = {
    title: "Customize it",
    buttons: [
      { icon: "/assets/images/1st_default.png", label: "Files", selected: selectedState2Button === 0 },
      { icon: "/assets/images/1st_necklace.png", label: "Research", selected: selectedState2Button === 1 },
      { icon: "/assets/images/1st_cookie.png", label: "Settings", selected: selectedState2Button === 2 },
      { icon: "/assets/images/1st_badge.png", label: "Awards", selected: selectedState2Button === 3 },
    ],
  };

  const continentNames = ["Africa", "North America", "Europe", "South America", "Oceania", "Asia"];
  const state3Content = {
    title: `Live Earth - ${selectedContinent}`,
    buttons: [
      { icon: "/assets/images/Africa.png", label: "Africa", selected: selectedState3Button === 0 },
      { icon: "/assets/images/NorthAmerica.png", label: "North America", selected: selectedState3Button === 1 },
      { icon: "/assets/images/Europe.png", label: "Europe", selected: selectedState3Button === 2 },
      { icon: "/assets/images/SouthAmerica.png", label: "South America", selected: selectedState3Button === 3 },
      { icon: "/assets/images/Oceania.png", label: "Oceania", selected: selectedState3Button === 4 },
      { icon: "/assets/images/Asia.png", label: "Asia", selected: selectedState3Button === 5 },
    ],
  };

  const state4Content = {
    title: "Navigation mode:",
    buttons: [
      { icon: "/assets/images/guided_mode.png", label: "Guided", selected: selectedState4Button === 0 },
      { icon: "/assets/images/free_mode.png", label: "Free", selected: selectedState4Button === 1 },
    ],
  };

  const getStateDimensions = (): OverlayBoxDimensions => {
    switch (currentState) {
      case S.state_2:
        return {
          width: { mobile: "w-[95%]", desktop: "sm:w-[calc(20%+200px)]" },
          height: { mobile: "h-[50%]", desktop: "sm:h-[60%]" },
          transform: { mobile: "translate-y-[0%]", desktop: "sm:translate-y-[5%]" },
        };
      case S.state_3:
        return {
          width: { mobile: "w-[95%]", desktop: "sm:w-[calc(90%-100px)]" },
          height: { mobile: "h-[70%]", desktop: "sm:h-[55%]" },
          transform: { mobile: "translate-y-[0%]", desktop: "sm:translate-y-[0%]" },
        };
      case S.state_4:
        return {
          width: { mobile: "w-[95%]", desktop: "sm:w-[30%]" },
          height: { mobile: "h-[35%]", desktop: "sm:h-[35%]" },
          transform: { mobile: "translate-y-[0%]", desktop: "sm:-translate-y-[24%]" },
        };
      default:
        return {
          width: { mobile: "w-[85%]", desktop: "sm:w-[40%]" },
          height: { mobile: "h-[60%]", desktop: "sm:h-[40%]" },
          transform: { mobile: "translate-y-[0%]", desktop: "sm:translate-y-[0%]" },
        };
    }
  };

  // Content visibility based on current state
  const getContentVisibility = (): StateContentVisibility => {
    return {
      state2: {
        title: currentState === S.state_2,
        buttons: currentState === S.state_2,
      },
      state3: {
        title: currentState === S.state_3,
        liveSignal: currentState === S.state_3,
        windowControls: currentState === S.state_3,
        buttons: currentState === S.state_3,
      },
      state4: {
        title: currentState === S.state_4,
        buttons: currentState === S.state_4,
      },
    };
  };

  const box = getStateDimensions();
  const visibility = getContentVisibility();

  // Handle button clicks
  const handleInternalButtonClick = (index: number) => {
    if (currentState === S.state_2) {
      setSelectedState2Button(index);
    } else if (currentState === S.state_3) {
      setSelectedState3Button(index);
      setSelectedContinent(continentNames[index]);
    } else if (currentState === S.state_4) {
      setSelectedState4Button(index);
    }
    
    // Also call the external handler if provided
    onButtonClick?.(index);
  };

  if (currentState !== S.state_2 && currentState !== S.state_3 && currentState !== S.state_4) return null;

  return (
    <div
      className={cx(
        "absolute inset-0 flex items-center justify-center transition-all",
        showBox ? "opacity-100" : "opacity-0",
        className
      )}
      style={{ transitionDuration: `${transitionDuration}ms` }}
    >
      {/* Frame container (no blur on content) */}
      <div
        className={cx(
          "relative shrink-0 rounded-canvas transition-all duration-1000",
          // width
          box.width.mobile,
          box.width.desktop,
          // optional max/min widths
          box.maxWidth?.mobile,
          box.maxWidth?.desktop,
          box.minWidth?.mobile,
          box.minWidth?.desktop,
          // height
          box.height.mobile,
          box.height.desktop,

          // transform
          box.transform.mobile,
          box.transform.desktop,

          // optional max/min heights
          box.maxHeight?.mobile,
          box.maxHeight?.desktop,
          box.minHeight?.mobile,
          box.minHeight?.desktop
        )}
      >
        {/* HALO layer: blurred border only (no frosted glass) */}
        <div
          className="pointer-events-none absolute inset-0 rounded-canvas border-[1px] border-white"
          style={{
            filter: "blur(6px)",
            transform: "scale(1)",
            transformOrigin: "center",
          }}
          aria-hidden
        />

        {/* CRISP stroke on top */}
        <div className="pointer-events-none absolute inset-0 rounded-canvas border-[1px] border-white/45" aria-hidden />

        {/* MAIN CONTENT */}
        <div className="relative z-10 w-full h-full rounded-canvas p-4 flex flex-col text-center">
          
          {/* STATE 2 CONTENT */}
          <div
            className={cx(
              "absolute inset-4 flex flex-col text-center transition-opacity duration-500",
              visibility.state2.title ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            {/* State 2 Title */}
            <div className="mb-6 mt-0 text-center">
              <div className="flex items-center justify-center gap-3">
                <h2 className="font-[500] text-white text-3xl">{state2Content.title}</h2>
              </div>
            </div>

            {/* State 2 Buttons */}
            <div className="flex-1 flex flex-col justify-end">
              <div className="flex justify-center gap-2 sm:gap-3">
                {state2Content.buttons.map((button, index) => (
                  <button
                    key={`state2-${index}`}
                    onClick={() => handleInternalButtonClick(index)}
                    className={cx(
                      "relative w-14 h-14 sm:w-16 sm:h-16 rounded-bigButton border-0 aspect-square",
                      "flex items-center justify-center text-lg sm:text-xl transition-all duration-300 hover:scale-105",
                      "shrink-0"
                    )}
                    title={button.label}
                  >
                    {!button.selected && (
                      <div
                        className="pointer-events-none absolute inset-0 rounded-bigButton border-2 border-white/30"
                        aria-hidden
                      />
                    )}
                    {button.selected && (
                      <>
                        <div
                          className="absolute inset-0 rounded-bigButton"
                          style={{
                            background:
                              "linear-gradient(to right, rgba(154,146,210,0.5), rgba(255,153,204,0.5))",
                          }}
                        />
                        <div
                          className="pointer-events-none absolute inset-0 rounded-bigButton border-2 border-white"
                          style={{ filter: "blur(4px)", transform: "scale(1.02)", transformOrigin: "center" }}
                          aria-hidden
                        />
                        <div
                          className="pointer-events-none absolute inset-0 rounded-bigButton border-2 border-white/70"
                          aria-hidden
                        />
                      </>
                    )}
                    <span className="relative z-10 text-white flex items-center justify-center">
                      {typeof button.icon === "string" &&
                      (button.icon.endsWith(".png") ||
                        button.icon.endsWith(".jpg") ||
                        button.icon.endsWith(".jpeg") ||
                        button.icon.endsWith(".svg")) ? (
                        <img src={button.icon} alt={button.label} className="w-[80%] h-[80%] object-contain" />
                      ) : (
                        button.icon
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* STATE 3 CONTENT */}
          <div
            className={cx(
              "absolute inset-4 flex flex-col text-left transition-opacity duration-500",
              visibility.state3.title ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            {/* State 3 Title with Live Signal and Window Controls */}
            <div className="mb-1 -mt-2 text-left">
              <div className="flex items-center justify-between select-none">
                <div className="flex items-center gap-3">
                  <div
                    className={cx(
                      "w-2 h-2 bg-red-500 rounded-full animate-pulse transition-opacity duration-500",
                      visibility.state3.liveSignal ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <h2 className="font-[500] text-white text-lg">{state3Content.title}</h2>
                </div>

                <div
                  className={cx(
                    "flex items-center gap-2 blur-[1px] transition-opacity duration-500",
                    visibility.state3.windowControls ? "opacity-100" : "opacity-0"
                  )}
                >
                  <div className="w-3 h-3 flex items-center justify-center text-white/60 text-lg font-[500]">−</div>
                  <div className="w-3 h-3 flex items-center justify-center text-white/60 text-lg font-[500]">□</div>
                  <div className="w-3 h-3 flex items-center justify-center text-white/60 text-lg font-[500]">×</div>
                </div>
              </div>

              {/* Separator under header */}
              <div className="mt-1">
                <div className="h-px bg-white/20" />
              </div>
            </div>

            {/* State 3 Content Layout */}
            <div className="flex-1 relative">
              
              {/* Graph - Mobile: top, Desktop: right side */}
              <div className={cx(
                // Mobile: positioned at top
                "absolute top-2 left-0 right-0 h-[15%] w-[80%] mx-auto",
                // Desktop: positioned on right side
                "sm:top-[40%] sm:-translate-y-1/2 sm:right-4 sm:left-auto sm:w-[30%] sm:h-[60%]"
              )}>
                <GraphComponent 
                  continent={selectedContinent} 
                  className="w-full h-full"
                />
              </div>

              {/* Continent Buttons - Mobile: bottom, Desktop: left side */}
              <div className={cx(
                // Mobile: positioned at bottom
                "absolute bottom-0 left-1/2 -translate-x-1/2",
                // Desktop: positioned on left side, vertically centered
                "sm:bottom-1/2 sm:translate-y-1/2 sm:left-[calc(4%-10px)] sm:translate-x-0"
              )}>
                <div
                  className={cx(
                    // Mobile: 3 columns, centered
                    "grid grid-cols-3 gap-2 w-[50vw]",
                    // Desktop: 2 columns
                    "sm:grid-cols-2 sm:w-auto sm:gap-3"
                  )}
                >
                  {state3Content.buttons.map((button, index) => (
                    <button
                      key={`state3-${index}`}
                      onClick={() => handleInternalButtonClick(index)}
                      className={cx(
                        // Mobile: fill cell as square
                        "relative w-full aspect-square rounded-bigButton border-0",
                        // Desktop: fixed size
                        "sm:w-16 sm:h-16 sm:aspect-auto",
                        // Shared
                        "flex items-center justify-center text-lg sm:text-xl transition-all duration-300 hover:scale-105",
                        "sm:shrink-0"
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
                                "linear-gradient(to right, rgba(154,146,210,0.5), rgba(255,153,204,0.5))",
                            }}
                          />
                          <div
                            className="pointer-events-none absolute inset-0 rounded-bigButton border-2 border-white"
                            style={{ filter: "blur(4px)", transform: "scale(1.02)", transformOrigin: "center" }}
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
                        {typeof button.icon === "string" &&
                        (button.icon.endsWith(".png") ||
                          button.icon.endsWith(".jpg") ||
                          button.icon.endsWith(".jpeg") ||
                          button.icon.endsWith(".svg")) ? (
                          <img src={button.icon} alt={button.label} className="w-[80%] h-[80%] object-contain" />
                        ) : (
                          button.icon
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* STATE 4 CONTENT */}
          <div
            className={cx(
              "absolute inset-4 flex flex-col text-center transition-opacity duration-500",
              visibility.state4.title ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            {/* State 4 Title */}
            <div className="mb-8 mt-4 text-center">
              <h2 className="font-sans text-white text-2xl sm:text-3xl font-medium">{state4Content.title}</h2>
            </div>

            {/* State 4 Navigation Mode Buttons */}
            <div className="flex-1 flex items-center justify-center">
              <div className="flex gap-8 sm:gap-6">
                {state4Content.buttons.map((button, index) => (
                  <div key={`state4-${index}`} className="flex flex-col items-center gap-3">
                    <button
                      onClick={() => handleInternalButtonClick(index)}
                      className={cx(
                        "relative w-20 h-20 sm:w-16 sm:h-16 rounded-bigButton border-0",
                        "flex items-center justify-center transition-all duration-300 hover:scale-105"
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
                                "linear-gradient(to right, rgba(154,146,210,0.5), rgba(255,153,204,0.5))",
                            }}
                          />
                          <div
                            className="pointer-events-none absolute inset-0 rounded-bigButton border-2 border-white"
                            style={{ filter: "blur(4px)", transform: "scale(1.02)", transformOrigin: "center" }}
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
                    <span className="font-mono text-white text-sm sm:text-base">{button.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
