import React from "react";
import cx from "classnames";
import { useUI } from "../state";
import { getStateConfig } from "../states";

type Props = { showWelcome?: boolean };

export function Header({ showWelcome = true }: Props) {
  const s = useUI((st) => st.state);
  const config = getStateConfig(s);
  const showWelcomeText = showWelcome && config.header.showWelcomeText;

  return (
    <header
      className={cx(
        "mx-auto w-full",
        "rounded-bigButton md:rounded-canvas shadow-[0_6px_20px_rgba(0,0,0,0.08)]",
        "bg-[#F4F2ED] text-[#081529]",
        // Dynamic padding from state config
        config.header.horizontalPadding.mobile,
        config.header.horizontalPadding.desktop,
        config.header.padding.mobile,
        config.header.padding.desktop
      )}
      style={{ 
        transition: "all 500ms ease",
        overflow: "hidden"
      }}
      aria-label="Site header"
    >
      {/* top row: logo left, menu right */}
      <div className="flex items-center justify-between">
        <img
          src="/assets/brand/Baltha_Studio_Icon_Blue.png"
          alt="Baltha Studio"
          className={cx(
            "select-none transition-all duration-500 ease-in-out",
            config.header.logoHeight.mobile,
            config.header.logoHeight.desktop
          )}
          draggable={false}
        />
        <img
          src="/assets/images/menu.png"
          alt="Menu"
          className={cx(
            "select-none transition-all duration-500 ease-in-out",
            config.header.menuHeight.mobile,
            config.header.menuHeight.desktop
          )}
          draggable={false}
        />
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
          Welcome to Baltha Studio! I'm Artur Balthazar, your professional 3D designer and web developer.
        </h1>
      </div>
    </header>
  );
}
