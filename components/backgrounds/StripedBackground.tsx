import React from "react";
import { Rect } from "react-native-svg";
import TiledPatternBackground from "./TiledPatternBackground";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StripeDirection = "horizontal" | "vertical" | "diagonal";

// ─── Component ────────────────────────────────────────────────────────────────

export interface StripedBackgroundProps {
  color: string;
  width: number;
  height: number;
  direction?: StripeDirection;
  stripeRatio?: number;
  tilesAcross?: number;
  centered?: boolean;
}

const StripedBackground: React.FC<StripedBackgroundProps> = ({
  color,
  width,
  height,
  direction = "vertical",
  stripeRatio = 0.5,
  tilesAcross = 3.5,
  centered = false,
}) => (
  <TiledPatternBackground
    width={width}
    height={height}
    tilesAcross={tilesAcross}
    centered={centered}
  >
    {(tile) => {
      const stripe = tile * stripeRatio;

      if (direction === "vertical") {
        return (
          <>
            <Rect width={tile} height={tile} fill="white" />
            <Rect x={0} y={0} width={stripe} height={tile} fill={color} />
          </>
        );
      }

      if (direction === "horizontal") {
        return (
          <>
            <Rect width={tile} height={tile} fill="white" />
            <Rect x={0} y={0} width={tile} height={stripe} fill={color} />
          </>
        );
      }

      // diagonal — 45° stripe using a parallelogram via polygon points
      // Draws a band from top-left to bottom-right of width `stripe`
      const s = stripe;
      const t = tile;
      return (
        <>
          <Rect width={t} height={t} fill="white" />
          {/*
            Two triangles + one parallelogram to form a continuous diagonal stripe:
            - Main band: parallelogram from (0,0)→(s,0)→(t,t)→(t-s,t)
            - Corner fill top-right: triangle (t-s,0)→(t,0)→(t,s)
            - Corner fill bottom-left: triangle (0,t-s)→(s,t)→(0,t)
            These three shapes together tile seamlessly at 45°.
          */}
          <Rect x={0} y={0} width={t} height={t} fill="none" />
          {/* Main diagonal band */}
          <React.Fragment>
            {/* Using SVG polygon via clipPath isn't available in react-native-svg easily,
                so approximate with overlapping rects rotated — use transform instead */}
            <Rect
              x={-t}
              y={0}
              width={s}
              height={t * 3}
              fill={color}
              transform={`rotate(-45, ${t / 2}, ${t / 2})`}
            />
            {/* Repeat for seamless tiling at edges */}
            <Rect
              x={t * 0.5}
              y={0}
              width={s}
              height={t * 3}
              fill={color}
              transform={`rotate(-45, ${t / 2}, ${t / 2})`}
            />
          </React.Fragment>
        </>
      );
    }}
  </TiledPatternBackground>
);

export default StripedBackground;
