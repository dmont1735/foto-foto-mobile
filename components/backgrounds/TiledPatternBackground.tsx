import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, Pattern, Rect } from "react-native-svg";

export interface TiledPatternBackgroundProps {
  width: number;
  height: number;
  tilesAcross?: number;
  centered?: boolean;
  children: (tileSize: number) => React.ReactNode;
}

const TiledPatternBackground: React.FC<TiledPatternBackgroundProps> = ({
  width,
  height,
  tilesAcross = 4,
  centered = true,
  children,
}) => {
  const patternId = useMemo(
    () => `tiled-pattern-${Math.random().toString(36).slice(2)}`,
    [],
  );

  const tile = Math.min(width, height) / tilesAcross;

  // Instead of patternTransform, shift the fill rect to fake centering
  const offset = centered ? tile / 2 : 0;

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
      <Defs>
        <Pattern
          id={patternId}
          patternUnits="userSpaceOnUse"
          x={-offset}
          y={-offset}
          width={tile}
          height={tile}
        >
          {children(tile)}
        </Pattern>
      </Defs>
      <Rect width={width} height={height} fill={`url(#${patternId})`} />
    </Svg>
  );
};

export default TiledPatternBackground;
