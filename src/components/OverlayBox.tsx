import React, { useState, useEffect } from "react";
import cx from "classnames";
import { OverlayContent, OverlayBoxDimensions } from "../states/types";
import { S } from "../state";

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

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setShowBox(true), delay);
      return () => clearTimeout(t);
    } else {
      setShowBox(false);
    }
  }, [visible, delay]);

  // State-specific content and dimensions
  const getStateContent = (): OverlayContent | null => {
    switch (currentState) {
      case S.state_2:
        return {
          title: "Customize it",
          description: "",
          titleLayout: {
            position: 'center',
            showLiveSignal: false,
            showWindowControls: false,
            buttonLayout: 'bottom-center'
          },
          buttons: [
            { icon: "/assets/images/1st_default.png", label: "Files", selected: true },
            { icon: "/assets/images/1st_necklace.png", label: "Research", selected: false },
            { icon: "/assets/images/1st_cookie.png", label: "Settings", selected: false },
            { icon: "/assets/images/1st_badge.png", label: "Awards", selected: false }
          ]
        };
      case S.state_3:
        return {
          title: "Live Earth - South America",
          description: "",
          titleLayout: {
            position: 'top-left',
            showLiveSignal: true,
            showWindowControls: true,
            buttonLayout: 'left-grid',
            buttonGridRows: 3,
            buttonGridCols: 2
          },
          buttons: [
            { icon: "/assets/images/Africa.png", label: "Africa", selected: false },
            { icon: "/assets/images/NorthAmerica.png", label: "North America", selected: false },
            { icon: "/assets/images/Europe.png", label: "Europe", selected: false },
            { icon: "/assets/images/SouthAmerica.png", label: "South America", selected: true },
            { icon: "/assets/images/Oceania.png", label: "Oceania", selected: false },
            { icon: "/assets/images/Asia.png", label: "Asia", selected: false }
          ]
        };
      default:
        return null;
    }
  };

  const getStateDimensions = (): OverlayBoxDimensions => {
    switch (currentState) {
      case S.state_2:
        return {
          width: { mobile: "w-[95%]", desktop: "md:w-[calc(20%+200px)]" },
          height: { mobile: "h-[50%]", desktop: "md:h-[60%]" }
        };
      case S.state_3:
        return {
          width: { mobile: "w-[95%]", desktop: "md:w-[calc(90%-100px)]" },
          height: { mobile: "h-[70%]", desktop: "md:h-[55%]" }
        };
      default:
        return {
          width: { mobile: "w-[85%]", desktop: "md:w-[40%]" },
          height: { mobile: "h-[60%]", desktop: "md:h-[40%]" }
        };
    }
  };

  const content = getStateContent();
  const box = getStateDimensions();

  if (!content) return null;

  return (
    <div
      className={cx(
        "absolute inset-0 flex items-center justify-center translate-y-[3%] transition-all",
        showBox ? "opacity-100" : "opacity-0",
        className
      )}
      style={{ transitionDuration: `${transitionDuration}ms` }}
    >
      {/* Frame container (no blur on content) */}
      <div
        className={cx(
          "relative shrink-0 rounded-canvas transition-all duration-1000 ease-in-out",
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
            transform: "scale(1)", // or 1.02 for a bit more outward bleed
            transformOrigin: "center",
          }}
          aria-hidden
        />

        {/* CRISP stroke on top */}
        <div className="pointer-events-none absolute inset-0 rounded-canvas border-[1px] border-white/45" aria-hidden />

         {/* MAIN CONTENT */}
         <div className="relative z-10 w-full h-full rounded-canvas p-4 flex flex-col text-center">
           {/* Title block */}
          <div
            className={cx(
              // tighter spacing when top-left (state 3), keep larger spacing when centered (state 2)
              content.titleLayout?.position === "top-left" ? "mb-1" : "mb-6",
              content.titleLayout?.position === "top-left" ? "-mt-2" : "mt-0",
              content.titleLayout?.position === "top-left" ? "text-left" : "text-center"
            )}
          >
            {content.titleLayout?.position === "top-left" ? (
              // ── State 3: top-left header (tight)
              <div className="flex items-center justify-between select-none">
                <div className="flex items-center gap-3">
                  {content.titleLayout?.showLiveSignal && (
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                  <h2 className="font-[500] text-white text-lg">{content.title}</h2>
                </div>

                {content.titleLayout?.showWindowControls && (
                  <div className="flex items-center gap-2 blur-[1px]">
                    <div className="w-3 h-3 flex items-center justify-center text-white/60 text-lg font-[500]">−</div>
                    <div className="w-3 h-3 flex items-center justify-center text-white/60 text-lg font-[500]">□</div>
                    <div className="w-3 h-3 flex items-center justify-center text-white/60 text-lg font-[500]">×</div>
                  </div>
                )}
              </div>
            ) : (
              // ── State 2: centered title (no justify-between — actually centers)
              <div className="flex items-center justify-center gap-3">
                {content.titleLayout?.showLiveSignal && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
                <h2 className="font-[500] text-white text-3xl">{content.title}</h2>
              </div>
            )}

            {/* Separator under header: tighter only for top-left */}
            {content.titleLayout?.showWindowControls && (
              <div className={cx(content.titleLayout?.position === "top-left" ? "mt-1" : "mt-2")}>
                <div className="h-px bg-white/20" />
              </div>
            )}
          </div>

          {/* Content area + buttons layout */}
          <div
            className={cx(
              "flex-1 flex",
              content.titleLayout?.buttonLayout === "left-grid"
                ? "justify-between items-start md:items-center"
                : "flex-col justify-end"
            )}
          >
            {content.titleLayout?.buttonLayout === "left-grid" ? (
              <div
                className={cx(
                  "grid gap-2 translate-x-[3%] md:translate-x-[20%] translate-y-[5%] md:translate-y-[0%]",
                  content.titleLayout?.buttonGridCols === 2 ? "grid-cols-2" : "grid-cols-1",
                  "justify-start items-center md:items-center"
                )}
              >
                {content.buttons.map((button, index) => (
                  <button
                    key={index}
                    onClick={() => onButtonClick?.(index)}
                    className={cx(
                      "relative w-14 h-14 md:w-16 md:h-16 rounded-bigButton border-0 aspect-square",
                      "flex items-center justify-center text-lg md:text-xl transition-all duration-300 hover:scale-105",
                      "shrink-0"
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
                        <img
                          src={button.icon}
                          alt={button.label}
                          className="w-[80%] h-[80%] object-contain"
                        />
                      ) : (
                        button.icon
                      )}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <>
                {/* Original bottom-center layout */}
                <div className="flex justify-center gap-2 md:gap-3">
                  {content.buttons.map((button, index) => (
                    <button
                      key={index}
                      onClick={() => onButtonClick?.(index)}
                      className={cx(
                        "relative w-14 h-14 md:w-16 md:h-16 rounded-bigButton border-0 aspect-square",
                        "flex items-center justify-center text-lg md:text-xl transition-all duration-300 hover:scale-105",
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
                          <img
                            src={button.icon}
                            alt={button.label}
                            className="w-[80%] h-[80%] object-contain"
                          />
                        ) : (
                          button.icon
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
