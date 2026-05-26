import React from "react";
import { Rect } from "react-native-svg";
import TiledPatternBackground from "./TiledPatternBackground";

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  color: string;
  width: number;
  height: number;
  tilesAcross?: number;
  centered?: boolean;
}

const CheckeredBackground: React.FC<Props> = ({
  color,
  width,
  height,
  tilesAcross = 3,
  centered = true,
}) => (
  <TiledPatternBackground
    width={width}
    height={height}
    tilesAcross={tilesAcross} // each checker square is half the visual tile
    centered={centered}
  >
    {(tile) => {
      const half = tile / 2;
      return (
        <>
          {/* White base */}
          <Rect width={tile} height={tile} fill="white" />
          {/* Top-left square */}
          <Rect x={0} y={0} width={half} height={half} fill={color} />
          {/* Bottom-right square */}
          <Rect x={half} y={half} width={half} height={half} fill={color} />
        </>
      );
    }}
  </TiledPatternBackground>
);

export default CheckeredBackground;
