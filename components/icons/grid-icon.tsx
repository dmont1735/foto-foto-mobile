import React from "react";
import Svg, { Rect } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
};

const GridIcon = ({ size = 24, color = "#292D32" }: Props) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" fill={color} />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" fill={color} />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" fill={color} />
      <Rect x="14" y="14" width="7" height="7" rx="1.5" fill={color} />
    </Svg>
  );
};

export default GridIcon;
