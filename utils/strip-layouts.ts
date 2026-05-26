import React from "react";
import { ImageSourcePropType } from "react-native";

// ─── Background Types ─────────────────────────────────────────────────────────

export type SolidBackground = {
  type: "solid";
  color: string;
};

export type ImageBackground = {
  type: "image";
  source: ImageSourcePropType;
};

export type SvgBackground = {
  type: "svg";
  component: React.FC<{ color: string; width: number; height: number }>;
  color: string; // ← stored separately, mutated independently
};

export type StripBackground = SolidBackground | ImageBackground | SvgBackground;

// ─── Layout Type ──────────────────────────────────────────────────────────────

export type Layout = {
  name: string;
  description: string;
  source: ImageSourcePropType;
  numberOfSlots: number;
  orientation: "portrait" | "landscape";
  defaultBackground: StripBackground;
};

// ─── Layouts ──────────────────────────────────────────────────────────────────

import PlaidBackground from "@/components/backgrounds/PlaidBackground";

export const LAYOUTS: Layout[] = [
  {
    name: "Layout A",
    description: "Classic Vertical Layout with 3 photo slots.",
    source: require("../assets/previews/vertical/Layout A.png"),
    numberOfSlots: 3,
    orientation: "portrait",
    defaultBackground: { type: "solid", color: "#4c69ec" },
  },
  {
    name: "Layout B",
    description: "Classic Vertical Layout with 4 photo slots.",
    source: require("../assets/previews/vertical/Layout B.png"),
    numberOfSlots: 4,
    orientation: "portrait",
    defaultBackground: { type: "solid", color: "#ec944c" },
  },
  {
    name: "Layout C",
    description: "2x2 Grid Vertical Layout.",
    source: require("../assets/previews/vertical/Layout C.png"),
    numberOfSlots: 4,
    orientation: "portrait",
    defaultBackground: { type: "solid", color: "#23ca3f" },
  },
  {
    name: "Layout D",
    description: "Vertical Layout with 2x3 Grid.",
    source: require("../assets/previews/vertical/Layout D.png"),
    numberOfSlots: 6,
    orientation: "portrait",
    defaultBackground: { type: "solid", color: "#fa2f2f" },
  },
  {
    name: "Layout E",
    description: "Horizontal Layout with 3 photo slots.",
    source: require("../assets/previews/horizontal/Layout E.png"),
    numberOfSlots: 3,
    orientation: "landscape",
    defaultBackground: { type: "solid", color: "#f86ad5" },
  },
  {
    name: "Layout F",
    description: "Horizontal Layout with 4 photo slots.",
    source: require("../assets/previews/horizontal/Layout F.png"),
    numberOfSlots: 4,
    orientation: "landscape",
    defaultBackground: {
      type: "svg",
      color: "hsl(326, 100%, 76.9%, 50%)",
      component: PlaidBackground,
    },
  },
];

export function getAllLayouts() {
  return LAYOUTS;
}
