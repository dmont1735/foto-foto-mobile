import { ImageSourcePropType } from "react-native";

export type Layout = {
  name: string;
  description: string;
  source: ImageSourcePropType;
  numberOfSlots: number;
  orientation: "portrait" | "landscape";
};

export const LAYOUTS: Layout[] = [
  {
    name: "Layout A",
    description: "Classic Vertical Layout with 3 photo slots.",
    source: require("../assets/previews/vertical/Layout A.png"),
    numberOfSlots: 3,
    orientation: "portrait",
  },
  {
    name: "Layout B",
    description: "Classic Vertical Layout with 4 photo slots.",
    source: require("../assets/previews/vertical/Layout B.png"),
    numberOfSlots: 4,
    orientation: "portrait",
  },
  {
    name: "Layout C",
    description: "2x2 Grid Vertical Layout.",
    source: require("../assets/previews/vertical/Layout C.png"),
    numberOfSlots: 4,
    orientation: "portrait",
  },
  {
    name: "Layout D",
    description: "Vertical Layout with 2x3 Grid.",
    source: require("../assets/previews/vertical/Layout D.png"),
    numberOfSlots: 6,
    orientation: "portrait",
  },
  {
    name: "Layout E",
    description: "Horizontal Layout with 3 photo slots.",
    source: require("../assets/previews/horizontal/Layout E.png"),
    numberOfSlots: 3,
    orientation: "landscape",
  },
  {
    name: "Layout F",
    description: "Horizontal Layout with 4 photo slots.",
    source: require("../assets/previews/horizontal/Layout F.png"),
    numberOfSlots: 4,
    orientation: "landscape",
  },
];

export function getAllLayouts() {
  return LAYOUTS;
}
