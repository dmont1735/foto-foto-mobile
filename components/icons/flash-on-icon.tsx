import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
};

export const FlashOnIcon = ({ size = 24, color = "#212121" }: Props) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8.29400141 14L6.52697684 21.0680983C6.34050874 21.8139707 7.26339156 22.3240198 7.79572333 21.7692956L19.7911396 9.2692956C20.2486433 8.79254712 19.9107562 8 19.25 8H14.7905694L16.4615125 2.98717082C16.6233953 2.50152249 16.2619183 2 15.75 2H8.75C8.41513973 2 8.12085023 2.22198299 8.02885704 2.54395915L5.02885704 13.0439592C4.89196785 13.5230713 5.25171584 14 5.75 14H8.29400141Z"
        fill={color}
      />
    </Svg>
  );
};
