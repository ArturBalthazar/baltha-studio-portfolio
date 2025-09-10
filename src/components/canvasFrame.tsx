import React from "react";

export function CanvasFrame({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="
        relative
        h-full min-h-0 w-full
        overflow-hidden rounded-[16px]
        shadow-[0_6px_20px_rgba(0,0,0,0.10)]
        bg-transparent
      "
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
      <div className="relative w-full h-full">{children}</div>
    </section>
  );
}
