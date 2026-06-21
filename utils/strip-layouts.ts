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

type SvgBackground = {
  type: "svg";
  component: React.FC<{
    color: string;
    width: number;
    height: number;
  }>;
  color: string;
  pngUri?: string | null;
  generatePngUri?: (width: number, height: number) => Promise<string>;
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

import { PALETTE } from "@/app/color-selection";
import CheckeredBackground from "@/components/backgrounds/CheckeredBackground";
import PlaidBackground from "@/components/backgrounds/PlaidBackground";
import PolkaDotBackground from "@/components/backgrounds/PolkaDotBackground";
import StripedBackground from "@/components/backgrounds/StripedBackground";

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
    defaultBackground: {
      type: "svg",
      component: PlaidBackground,
      color: PALETTE[0].color,
    },
  },
  {
    name: "Layout D",
    description: "Vertical Layout with 2x3 Grid.",
    source: require("../assets/previews/vertical/Layout D.png"),
    numberOfSlots: 6,
    orientation: "portrait",
    defaultBackground: {
      type: "svg",
      component: PolkaDotBackground,
      color: PALETTE[1].color,
    },
  },
  {
    name: "Layout E",
    description: "Horizontal Layout with 3 photo slots.",
    source: require("../assets/previews/horizontal/Layout E.png"),
    numberOfSlots: 3,
    orientation: "landscape",
    defaultBackground: {
      type: "svg",
      component: CheckeredBackground,
      color: PALETTE[2].color,
    },
  },
  {
    name: "Layout F",
    description: "Horizontal Layout with 4 photo slots.",
    source: require("../assets/previews/horizontal/Layout F.png"),
    numberOfSlots: 4,
    orientation: "landscape",
    defaultBackground: {
      type: "svg",
      component: StripedBackground,
      color: PALETTE[3].color,
    },
  },
];

export function getAllLayouts() {
  return LAYOUTS;
}
