import React from "react";
import { Circle, Rect } from "react-native-svg";
import TiledPatternBackground from "./TiledPatternBackground";

interface Props {
  color: string;
  width: number;
  height: number;
}

// components/backgrounds/PolkaDotBackground.tsx
const PolkaDotBackground: React.FC<Props> = ({ color, width, height }) => (
  <TiledPatternBackground
    width={width}
    height={height}
    tilesAcross={4}
    centered={true}
  >
    {(tile) => (
      <>
        <Rect width={tile} height={tile} fill="#fff0f5" />
        <Circle
          cx={tile / 2}
          cy={tile / 2}
          r={tile * 0.25}
          fill={color}
          opacity={0.6}
        />
      </>
    )}
  </TiledPatternBackground>
);

export default PolkaDotBackground;
