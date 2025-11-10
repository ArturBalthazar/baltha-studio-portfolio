import React from "react";
import { useUI } from "../state";
import { getStateConfig } from "../states";
import cx from "classnames";

export function CanvasFrame({ children }: { children: React.ReactNode }) {
  const s = useUI((st) => st.state);
  const config = getStateConfig(s);
  const hasRoundedCorners = config.canvas.roundedCorners !== false; // Default to true

  return (
    <section
      className={cx(
        "relative h-full min-h-0 w-full overflow-hidden bg-transparent shadow-[0_6px_20px_rgba(0,0,0,0.10)]",
        hasRoundedCorners && "rounded-bigButton md:rounded-canvas"
      )}
    >
      {/* Paint-only layer; doesn't affect layout height */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(150% 150% at 50% 100%, #49408D 0%, #081428 60%)",
        }}
      />

      {/* Content */}
      <div className="relative w-full h-full">{children}</div>
    </section>
  );
}
