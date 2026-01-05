import React, { useEffect, useRef } from "react";
import cx from "classnames";

interface GraphComponentProps {
  continent: string;
  className?: string;
}

// Data from the reference project
const populationData = {
  Africa: [229, 420, 814, 1550],
  Asia: [1394, 2360, 3714, 4980],
  Europe: [549, 675, 726, 744],
  NorthAmerica: [227, 350, 491, 617],
  SouthAmerica: [114, 217, 350, 438],
  Oceania: [13, 21, 31, 47]
};

const gdpData = {
  Africa: [61, 159, 616, 3000],
  Asia: [260, 1200, 7600, 40000],
  Europe: [500, 2200, 9100, 24000],
  NorthAmerica: [330, 2500, 11400, 28000],
  SouthAmerica: [88, 350, 1700, 4200],
  Oceania: [15, 65, 400, 2000]
};

const maxPop = 5500; // Maximum population scale (in millions)
const maxGDP = 45000; // Maximum GDP scale (in billions)
const xVals = [0, 33.3, 66.6, 100]; // X positions for 4 data points: 1950, 1975, 2000, 2025

// Helper function to build SVG path string
const buildPathString = (dataArray: number[], maxValue: number): string => {
  if (!dataArray || dataArray.length === 0) return "";

  let pathD = "";

  for (let i = 0; i < dataArray.length; i++) {
    const x = xVals[i];
    const y = 100 - (dataArray[i] / maxValue) * 100;

    if (i === 0) {
      pathD += `M ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
    }
  }

  return pathD;
};

export function GraphComponent({ continent, className = "" }: GraphComponentProps) {
  const popPathRef = useRef<SVGPathElement>(null);
  const gdpPathRef = useRef<SVGPathElement>(null);
  const popBlurPathRef = useRef<SVGPathElement>(null); // blurred
  const gdpBlurPathRef = useRef<SVGPathElement>(null); // blurred
  const popDotRef = useRef<HTMLDivElement>(null);
  const gdpDotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Map continent names to data keys
    const continentMapping: { [key: string]: keyof typeof populationData } = {
      "South America": "SouthAmerica",
      "North America": "NorthAmerica",
      "Africa": "Africa",
      "Europe": "Europe",
      "Asia": "Asia",
      "Oceania": "Oceania"
    };

    const continentKey = continentMapping[continent] || continent.replace(/\s+/g, '') as keyof typeof populationData;
    const popArr = populationData[continentKey];
    const gdpArr = gdpData[continentKey];

    if (!popArr || !gdpArr) return;

    // Build path strings
    const popPathD = buildPathString(popArr, maxPop);
    const gdpPathD = buildPathString(gdpArr, maxGDP);

    // Update SVG paths (crisp)
    if (popPathRef.current) popPathRef.current.setAttribute("d", popPathD);
    if (gdpPathRef.current) gdpPathRef.current.setAttribute("d", gdpPathD);

    // Update SVG paths (blurred)
    if (popBlurPathRef.current) popBlurPathRef.current.setAttribute("d", popPathD);
    if (gdpBlurPathRef.current) gdpBlurPathRef.current.setAttribute("d", gdpPathD);

    // Position live dots at the end of each line
    const lastIndex = popArr.length - 1;
    const xEnd = xVals[lastIndex];

    // Population dot
    const popValue = popArr[lastIndex];
    const popYPercent = 100 - (popValue / maxPop) * 100;
    if (popDotRef.current) {
      popDotRef.current.style.left = xEnd + "%";
      popDotRef.current.style.top = popYPercent + "%";
    }

    // GDP dot
    const gdpValue = gdpArr[lastIndex];
    const gdpYPercent = 100 - (gdpValue / maxGDP) * 100;
    if (gdpDotRef.current) {
      gdpDotRef.current.style.left = xEnd + "%";
      gdpDotRef.current.style.top = gdpYPercent + "%";
    }
  }, [continent]);

  return (
    <div className={cx("relative w-full h-full", className)}>
      {/* Graph Title */}
      <div className="text-center mb-2">
        <h3 className="font-mono text-sm text-white/80">GDP & Population</h3>
      </div>

      {/* Graph Area */}
      <div className="relative w-full h-full overflow-visible">
        {/* Axes */}
        <div className="absolute bottom-0 left-0 w-full h-px bg-white/25" />
        <div className="absolute bottom-0 left-0 w-px h-full bg-white/25" />

        {/* Year Lines */}
        <div className="absolute bottom-0 w-px h-full bg-white/10" style={{ left: "0%" }} />
        <div className="absolute bottom-0 w-px h-full bg-white/10" style={{ left: "33.3%" }} />
        <div className="absolute bottom-0 w-px h-full bg-white/10" style={{ left: "66.6%" }} />
        <div className="absolute bottom-0 w-px h-full bg-white/10" style={{ left: "100%" }} />

        {/* Year Labels */}
        <div className="absolute text-xs text-white/60 font-mono pointer-events-none transform -translate-x-1/2"
          style={{ left: "0%", bottom: "-20px" }}>1950</div>
        <div className="absolute text-xs text-white/60 font-mono pointer-events-none transform -translate-x-1/2"
          style={{ left: "33.3%", bottom: "-20px" }}>1975</div>
        <div className="absolute text-xs text-white/60 font-mono pointer-events-none transform -translate-x-1/2"
          style={{ left: "66.6%", bottom: "-20px" }}>2000</div>
        <div className="absolute text-xs text-white/60 font-mono pointer-events-none transform -translate-x-1/2"
          style={{ left: "100%", bottom: "-20px" }}>2025</div>

        {/* SVG for the lines */}
        <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Population line (brand-lilac) */}
          <path
            ref={popPathRef}
            fill="none"
            stroke="#9A92D2"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-sm"
          />

          {/* GDP line (brand-orange) */}
          <path
            ref={gdpPathRef}
            fill="none"
            stroke="#FF8800"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-sm"

          />
        </svg>
        {/* BLUR UNDERLAY */}
        <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            ref={popBlurPathRef}
            fill="none" stroke="#9A92D2"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: "blur(2px)" }}
          />
          <path
            ref={gdpBlurPathRef}
            fill="none"
            stroke="#FF8800"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: "blur(2px)" }}
          />
        </svg>
        {/* Live dots */}
        <div
          ref={popDotRef}
          className="absolute w-1.5 h-1.5 bg-brand-lilac rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse shadow-lg"
          style={{ boxShadow: "0 0 8px 2px #9A92D2" }}
        />
        <div
          ref={gdpDotRef}
          className="absolute w-1.5 h-1.5 bg-brand-orange rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse shadow-lg"
          style={{ boxShadow: "0 0 8px 2px #FF8800" }}
        />

        {/* Legend */}
        <div className="absolute top-2 left-4 flex flex-col gap-1 text-xs font-mono">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-brand-lilac" />
            <span className="text-white/70">Population</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-brand-orange" />
            <span className="text-white/70">GDP</span>
          </div>

        </div>
      </div>
    </div>
  );
}
