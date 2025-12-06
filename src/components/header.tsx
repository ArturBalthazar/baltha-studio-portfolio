import React from "react";
import cx from "classnames";
import { useUI } from "../state";
import { getStateConfig } from "../states";

type Props = { showWelcome?: boolean };

export function Header({ showWelcome = true }: Props) {
  const s = useUI((st) => st.state);
  const menuOpen = useUI((st) => st.menuOpen);
  const setMenuOpen = useUI((st) => st.setMenuOpen);
  const config = getStateConfig(s);
  const showWelcomeText = showWelcome && config.header.showWelcomeText;
  const isTransparent = config.header.transparentBackground;
  const isWhite = config.header.whiteIcons;
  const isCollapsed = config.header.collapsed;

  return (
    <header
      className={cx(
        "w-full relative",
        // Only apply these styles when not collapsed
        !isCollapsed && "mx-auto rounded-bigButton md:rounded-canvas",
        // Conditional background and shadow
        !isTransparent && "bg-[#F4F2ED] shadow-[0_6px_20px_rgba(0,0,0,0.08)]",
        // Conditional text color
        isWhite ? "text-white" : "text-[#081529]",
        // Dynamic padding from state config
        config.header.horizontalPadding.mobile,
        config.header.horizontalPadding.desktop,
        config.header.padding.mobile,
        config.header.padding.desktop
      )}
      style={{ 
        transition: "all 500ms ease",
        overflow: isCollapsed ? "visible" : "hidden",
        height: isCollapsed ? "0" : "auto",
        backgroundColor: isTransparent ? 'transparent' : undefined,
        boxShadow: isTransparent ? 'none' : undefined
      }}
      aria-label="Site header"
    >
      {/* top row: logo left, menu right */}
      <div 
        className={cx(
          "flex items-center justify-between",
          isCollapsed && "absolute top-5 left-[30px] right-[30px] z-50"
        )}
      >
        <img
          src="/assets/brand/Baltha_Studio_Icon_Blue.png"
          alt="Baltha Studio"
          className={cx(
            "select-none transition-all duration-500 ease-in-out",
            config.header.logoHeight.mobile,
            config.header.logoHeight.desktop
          )}
          style={{
            filter: isWhite 
              ? 'invert(97%) sepia(3%) saturate(33%) hue-rotate(304deg) brightness(113%) contrast(89%)' 
              : 'invert(3%) sepia(82%) saturate(500%) hue-rotate(201deg) brightness(102%) contrast(94%)'
          }}
          draggable={false}
        />
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="cursor-pointer hover:scale-105 transition-transform duration-200 relative"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {/* Menu icon - fades out when menu opens */}
          <img
            src="/assets/images/menu.png"
            alt="Menu"
            className={cx(
              "select-none transition-all duration-300 ease-in-out",
              config.header.menuHeight.mobile,
              config.header.menuHeight.desktop,
              menuOpen ? "opacity-0 scale-75" : "opacity-100 scale-100"
            )}
            style={{
              filter: isWhite 
                ? 'invert(97%) sepia(3%) saturate(33%) hue-rotate(304deg) brightness(113%) contrast(89%)' 
                : 'invert(3%) sepia(82%) saturate(500%) hue-rotate(201deg) brightness(102%) contrast(94%)'
            }}
            draggable={false}
          />
          {/* X icon - fades in with rotation when menu opens */}
          <img
            src="/assets/images/close.png"
            alt="Close"
            className={cx(
              "absolute inset-0 select-none",
              config.header.menuHeight.mobile,
              config.header.menuHeight.desktop,
              menuOpen ? "opacity-100 scale-100" : "opacity-0 scale-75"
            )}
            style={{
              filter: isWhite 
                ? 'invert(3%) sepia(82%) saturate(500%) hue-rotate(201deg) brightness(102%) contrast(94%)' 
                : 'invert(97%) sepia(3%) saturate(33%) hue-rotate(304deg) brightness(113%) contrast(89%)',
              transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'opacity 0.3s ease-out, transform 0.4s ease-out, scale 0.3s ease-out, filter 0.5s ease'
            }}
            draggable={false}
          />
        </button>
      </div>

      {/* big welcome text with smooth transitions */}
      <div
        className={cx(
          "transition-all duration-500 ease-in-out",
          showWelcomeText 
            ? "max-h-96 opacity-100 mt-4 md:mt-5" 
            : "max-h-0 opacity-0 mt-0"
        )}
        style={{ overflow: "hidden" }}
      >
        <h1
          className="
            pt-2 md:pt-2
            pb-2 md:pb-4
            font-ballinger-condensed
            font-extrabold
            text-[32px] md:text-[50px]
            leading-tight
          "
        >
          {/* Welcome to Baltha Studio! I'm Artur Balthazar, your professional 3D designer and web developer. */}
          We design interactive web experiences tailored to your brand's essence and accessible to all.
        </h1>
      </div>
    </header>
  );
}
