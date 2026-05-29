import React from "react";
import { Line, Rect } from "react-native-svg";
import TiledPatternBackground from "./TiledPatternBackground";

// ─── Constants ────────────────────────────────────────────────────────────────

const STROKE_OPACITY = 0.6;
const STROKE_RATIO = 1 / 2; // stroke width as a fraction of tile size

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  color: string;
  width: number;
  height: number;
}

const PlaidBackground: React.FC<Props> = ({ color, width, height }) => (
  <TiledPatternBackground width={width} height={height} tilesAcross={4}>
    {(tile) => (
      <>
        {/* White tile base */}
        <Rect width={tile} height={tile} fill="white" />

        {/* Vertical line */}
        <Line
          x1={0}
          y1={0}
          x2={0}
          y2={tile}
          stroke={color}
          strokeWidth={tile * STROKE_RATIO}
          strokeOpacity={STROKE_OPACITY}
        />

        {/* Horizontal line */}
        <Line
          x1={0}
          y1={0}
          x2={tile}
          y2={0}
          stroke={color}
          strokeWidth={tile * STROKE_RATIO}
          strokeOpacity={STROKE_OPACITY}
        />
      </>
    )}
  </TiledPatternBackground>
);

export default PlaidBackground;
