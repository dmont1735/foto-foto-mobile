/**
 * useStripGeometry.ts
 *
 * Pure hook that computes strip + slot geometry from a LayoutType, mirroring
 * the math that lives inside PhotoboothStrip. This is the RN equivalent of
 * the web version's `measureFrame` / `getBoundingClientRect` step — except
 * we never need to touch the DOM because the geometry is fully deterministic
 * from the config alone.
 *
 * Returns everything PhotoboothStripExport (and any canvas/SVG exporter)
 * needs to know about the frame without rendering anything.
 */

import { useMemo } from "react";
import { LayoutType } from "../components/photobooth-strip"; // re-use the type you already have

// ─── Re-exported for consumers that don't import PhotoboothStrip ──────────────

export type { LayoutType };

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SlotGeometry {
  /** Index in the images[] array this slot corresponds to */
  index: number;
  /** Position and size in logical pixels, relative to the strip top-left */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Resolved border-radius for this slot */
  borderRadius: number;
}

export interface StripGeometry {
  stripWidth: number;
  stripHeight: number;
  /** Resolved border-radius for the outer strip */
  stripRadius: number;
  /** Padding that was applied (already baked into slot positions) */
  paddingTop: number;
  paddingLeft: number;
  paddingRight: number;
  paddingBottom: number;
  /** Ready-to-use slot descriptors — positions are absolute within the strip */
  slots: SlotGeometry[];
}

export interface UseStripGeometryOptions {
  type: LayoutType;
  /**
   * Desired strip width in logical pixels.
   * Defaults to the same values PhotoboothStrip uses:
   *   portrait  → 320
   *   landscape → 600
   */
  width?: number;
  /**
   * Desired strip height in logical pixels.
   * When omitted the height is computed from the layout config (same as
   * PhotoboothStrip when no `height` prop is passed).
   */
  height?: number;
  /**
   * Per-slot aspect-ratio overrides, keyed by slot index.
   * Mirrors the `slots` prop on PhotoboothStrip.
   */
  slotAspectRatios?: Record<number, number>;
}

// ─── Layout Config (kept in sync with PhotoboothStrip.tsx) ───────────────────
// Duplicated here so this hook has zero runtime dependency on the component.

interface LayoutConfig {
  columns: number;
  rows: number;
  orientation: "portrait" | "landscape";
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  gap: number;
  stripRadius: number;
  slotRadius: number;
  slotAspectRatio?: number;
  slotsOffsetX?: number;
  slotsOffsetY?: number;
}

const LAYOUTS: Record<LayoutType, LayoutConfig> = {
  A: {
    columns: 1,
    rows: 3,
    orientation: "portrait",
    paddingTop: 150,
    paddingBottom: 150,
    paddingLeft: 20,
    paddingRight: 20,
    gap: 16,
    stripRadius: 24,
    slotRadius: 16,
    slotAspectRatio: 1.25,
  },
  B: {
    columns: 1,
    rows: 4,
    orientation: "portrait",
    paddingTop: 100,
    paddingBottom: 100,
    paddingLeft: 20,
    paddingRight: 20,
    gap: 16,
    stripRadius: 24,
    slotRadius: 16,
    slotAspectRatio: 1.25,
  },
  C: {
    columns: 2,
    rows: 2,
    orientation: "portrait",
    paddingTop: 50,
    paddingBottom: 100,
    paddingLeft: 20,
    paddingRight: 20,
    gap: 16,
    stripRadius: 24,
    slotRadius: 16,
    slotAspectRatio: 1,
  },
  D: {
    columns: 2,
    rows: 3,
    orientation: "portrait",
    paddingTop: 80,
    paddingBottom: 100,
    paddingLeft: 20,
    paddingRight: 20,
    gap: 16,
    stripRadius: 24,
    slotRadius: 16,
    slotAspectRatio: 1,
  },
  E: {
    columns: 3,
    rows: 1,
    orientation: "landscape",
    paddingTop: 50,
    paddingBottom: 50,
    paddingLeft: 20,
    paddingRight: 20,
    gap: 16,
    stripRadius: 24,
    slotRadius: 20,
    slotAspectRatio: 0.95,
  },
  F: {
    columns: 4,
    rows: 1,
    orientation: "landscape",
    paddingTop: 50,
    paddingBottom: 50,
    paddingLeft: 16,
    paddingRight: 16,
    gap: 12,
    stripRadius: 16,
    slotRadius: 14,
    slotAspectRatio: 0.85,
  },
};

const DEFAULT_WIDTH: Record<"portrait" | "landscape", number> = {
  portrait: 320,
  landscape: 600,
};

const ORIENTATION_DEFAULT_ASPECT: Record<"portrait" | "landscape", number> = {
  portrait: 3 / 4,
  landscape: 4 / 3,
};

// ─── Core geometry computation (pure function) ────────────────────────────────

/**
 * Computes strip + slot geometry for a given layout config and desired
 * dimensions. Extracted as a standalone function so it can be used outside
 * of React (e.g. in a background export worker).
 */
export function computeStripGeometry(
  type: LayoutType,
  options: Omit<UseStripGeometryOptions, "type"> = {},
): StripGeometry {
  const { width, height, slotAspectRatios = {} } = options;
  const config = LAYOUTS[type];

  const {
    columns,
    rows,
    orientation,
    gap,
    stripRadius,
    slotRadius,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    slotsOffsetX = 0,
    slotsOffsetY = 0,
  } = config;

  // ── Strip width ────────────────────────────────────────────────────────────
  const stripWidth = width ?? DEFAULT_WIDTH[orientation];
  const innerWidth = stripWidth - paddingLeft - paddingRight;
  const baseSlotWidth = (innerWidth - gap * (columns - 1)) / columns;

  // ── Natural row heights (before height-scaling) ────────────────────────────
  const naturalRowHeights = Array.from({ length: rows }, (_, rowIdx) => {
    let maxH = 0;
    for (let colIdx = 0; colIdx < columns; colIdx++) {
      const slotIdx = rowIdx * columns + colIdx;
      const aspect =
        slotAspectRatios[slotIdx] ??
        config.slotAspectRatio ??
        ORIENTATION_DEFAULT_ASPECT[orientation];
      maxH = Math.max(maxH, baseSlotWidth / aspect);
    }
    return maxH;
  });

  const naturalInnerHeight =
    naturalRowHeights.reduce((s, h) => s + h, 0) + gap * (rows - 1);
  const naturalStripHeight = naturalInnerHeight + paddingTop + paddingBottom;

  // ── Height scaling (mirrors PhotoboothStrip's `scale` variable) ────────────
  const stripHeight = height ?? naturalStripHeight;
  const scale = stripHeight / naturalStripHeight;

  const scaledGap = gap * scale;
  const slotWidth = baseSlotWidth * scale;
  const scaledPaddingTop = paddingTop * scale;
  const scaledPaddingLeft = paddingLeft * scale;
  const scaledRowHeights = naturalRowHeights.map((h) => h * scale);
  const scaledSlotRadius = slotRadius * scale;
  const scaledStripRadius = stripRadius * scale;

  // ── Row top-offsets ────────────────────────────────────────────────────────
  const rowOffsets = scaledRowHeights.reduce<number[]>((acc, h, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + scaledRowHeights[i - 1] + scaledGap);
    return acc;
  }, []);

  // ── Per-slot geometry ──────────────────────────────────────────────────────
  const slots: SlotGeometry[] = Array.from(
    { length: columns * rows },
    (_, i) => {
      const row = Math.floor(i / columns);
      const col = i % columns;

      const aspect =
        slotAspectRatios[i] ??
        config.slotAspectRatio ??
        ORIENTATION_DEFAULT_ASPECT[orientation];

      const slotHeight = slotWidth / aspect;

      // Positions are absolute within the strip (padding already included),
      // matching the `top` / `left` values used inside PhotoboothStrip.
      return {
        index: i,
        width: slotWidth,
        height: slotHeight,
        x:
          scaledPaddingLeft +
          col * (slotWidth + scaledGap) +
          slotsOffsetX * scale,
        y: scaledPaddingTop + rowOffsets[row] + slotsOffsetY * scale,
        borderRadius: scaledSlotRadius,
      };
    },
  );

  return {
    stripWidth,
    stripHeight,
    stripRadius: scaledStripRadius,
    paddingTop: scaledPaddingTop,
    paddingLeft: scaledPaddingLeft,
    paddingRight: paddingRight * scale,
    paddingBottom: paddingBottom * scale,
    slots,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Returns memoized strip geometry. Re-runs only when type / width / height /
 * slotAspectRatios change.
 *
 * @example
 * const geometry = useStripGeometry({ type: "A", width: 320 });
 * // geometry.slots[0] → { index:0, x:20, y:150, width:280, height:224, borderRadius:16 }
 */
export function useStripGeometry(
  options: UseStripGeometryOptions,
): StripGeometry {
  const { type, width, height, slotAspectRatios } = options;

  return useMemo(
    () => computeStripGeometry(type, { width, height, slotAspectRatios }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      type,
      width,
      height,
      // Serialize the record so the dep array doesn't change on every render
      JSON.stringify(slotAspectRatios),
    ],
  );
}
