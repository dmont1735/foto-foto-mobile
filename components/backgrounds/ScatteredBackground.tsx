import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import Svg from "react-native-svg";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScatteredItem {
  x: number; // 0–1 (fraction of width)
  y: number; // 0–1 (fraction of height)
  scale?: number; // 0–1, defaults to 1
  rotation?: number; // degrees
}

export interface ScatteredBackgroundProps {
  width: number;
  height: number;
  /**
   * Number of items to scatter. Default: 30
   */
  count?: number;
  /**
   * Seed for deterministic pseudo-random placement.
   * Same seed = same layout every render.
   * Default: 42
   */
  seed?: number;
  /**
   * Min/max scale range for scattered items. Default: [0.5, 1]
   */
  scaleRange?: [number, number];
  /**
   * Whether items can rotate randomly. Default: false
   */
  randomRotation?: boolean;
  /**
   * Render function — receives item position/scale/rotation in px and degrees,
   * plus the index. Must return react-native-svg elements.
   */
  children: (item: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
    index: number;
  }) => React.ReactNode;
}

// ─── Seeded PRNG (mulberry32) ─────────────────────────────────────────────────
// Deterministic so layout is stable across renders without storing state.

function createPrng(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

const ScatteredBackground: React.FC<ScatteredBackgroundProps> = ({
  width,
  height,
  count = 30,
  seed = 42,
  scaleRange = [0.5, 1],
  randomRotation = false,
  children,
}) => {
  const items = useMemo(() => {
    const rand = createPrng(seed);
    const [minScale, maxScale] = scaleRange;

    return Array.from({ length: count }, (_, index) => ({
      x: rand() * width,
      y: rand() * height,
      scale: minScale + rand() * (maxScale - minScale),
      rotation: randomRotation ? rand() * 360 : 0,
      index,
    }));
  }, [width, height, count, seed, scaleRange, randomRotation]);

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
      {items.map((item) => children(item))}
    </Svg>
  );
};

export default ScatteredBackground;
