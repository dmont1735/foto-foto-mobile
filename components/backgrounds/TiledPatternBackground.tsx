import React from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, Pattern, Rect } from "react-native-svg";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TiledPatternBackgroundProps {
  width: number;
  height: number;
  /**
   * How many tiles fit horizontally. Controls tile size relative to strip width.
   * Default: 4
   */
  tilesAcross?: number;
  /**
   * Whether to center the pattern so edges show symmetric cuts.
   * Default: true
   */
  centered?: boolean;
  /**
   * The pattern content to tile. Receives the computed tile size so shapes
   * can scale themselves. Must be valid SVG children (react-native-svg elements).
   */
  children: (tileSize: number) => React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

const TiledPatternBackground: React.FC<TiledPatternBackgroundProps> = ({
  width,
  height,
  tilesAcross = 4,
  centered = true,
  children,
}) => {
  const tile = width / tilesAcross;
  const offset = centered ? tile / 2 : 0;

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
      <Defs>
        <Pattern
          id="tiled-pattern"
          patternUnits="userSpaceOnUse"
          width={tile}
          height={tile}
          patternTransform={`translate(${offset}, ${offset})`}
        >
          {children(tile)}
        </Pattern>
      </Defs>

      <Rect width={width} height={height} fill="url(#tiled-pattern)" />
    </Svg>
  );
};

export default TiledPatternBackground;
