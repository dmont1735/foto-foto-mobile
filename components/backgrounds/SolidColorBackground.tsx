import React from "react";
import Svg, { Rect } from "react-native-svg";

interface Props {
  color: string;
  width: number;
  height: number;
}

const SolidColorBackground: React.FC<Props> = ({ color, width, height }) => (
  <Svg width={width} height={height}>
    <Rect width={width} height={height} fill={color} />
  </Svg>
);

export default SolidColorBackground;
