import React from "react";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import PlaidBackground from "@/components/backgrounds/PlaidBackground";
import FilteredImage from "@/components/filtered-image";
import { ImageTransform } from "@/components/photo-edit-sheet";

import { StripBackground } from "../utils/strip-layouts";

export type LayoutType = "A" | "B" | "C" | "D" | "E" | "F";

export type LogoAnchor =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"
  | "custom";

export interface LogoConfig {
  anchor: LogoAnchor;
  source: ImageSourcePropType;
  width: number;
  height: number;
  offsetX?: number;
  offsetY?: number;
}

export interface StickerConfig {
  source: ImageSourcePropType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface SlotConfig {
  aspectRatio?: number;
  offsetX?: number;
  offsetY?: number;
}

export interface StripPhoto {
  uri: string;
  transform: ImageTransform | null;
}

export interface PhotoboothStripProps {
  type: LayoutType;
  images?: StripPhoto[];
  slots?: SlotConfig[];
  background?: StripBackground;
  stickers?: StickerConfig[];
  logo?: LogoConfig;
  filterMatrix?: number[];
  width?: number;
  height?: number;
  scaleRatio?: number;
  onImagePress?: (index: number) => void;
}

interface LayoutConfig {
  columns: number;
  rows: number;
  orientation: "portrait" | "landscape";
  background: StripBackground;
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
    background: { type: "solid", color: "#4B5FFA" },
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
    background: { type: "solid", color: "#E8934A" },
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
    background: { type: "solid", color: "#2ECC40" },
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
    background: { type: "solid", color: "#E8302A" },
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
    background: { type: "solid", color: "#F670E0" },
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
    background: {
      type: "svg",
      color: "hsl(326, 100%, 76.9%, 50%)",
      component: PlaidBackground,
    },
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

const ORIENTATION_DEFAULT_ASPECT: Record<"portrait" | "landscape", number> = {
  portrait: 3 / 4,
  landscape: 4 / 3,
};

export function getStripNaturalSize(
  type: LayoutType,
  customWidth?: number,
): { width: number; height: number } {
  const config = LAYOUTS[type];

  const {
    orientation,
    rows,
    columns,
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
    gap,
  } = config;

  const defaultWidth =
    orientation === "landscape"
      ? DEFAULT_WIDTH_LANDSCAPE
      : DEFAULT_WIDTH_PORTRAIT;

  const stripWidth = customWidth ?? defaultWidth;
  const innerWidth = stripWidth - paddingLeft - paddingRight;
  const baseSlotWidth = (innerWidth - gap * (columns - 1)) / columns;

  const rowHeights = Array.from({ length: rows }, () => {
    const aspect =
      config.slotAspectRatio ?? ORIENTATION_DEFAULT_ASPECT[orientation];

    return baseSlotWidth / aspect;
  });

  const innerHeight = rowHeights.reduce((s, h) => s + h, 0) + gap * (rows - 1);

  const stripHeight = innerHeight + paddingTop + paddingBottom;

  return {
    width: stripWidth,
    height: stripHeight,
  };
}

function resolveAspectRatio(
  slotCfg: SlotConfig | undefined,
  layoutCfg: LayoutConfig,
): number {
  return (
    slotCfg?.aspectRatio ??
    layoutCfg.slotAspectRatio ??
    ORIENTATION_DEFAULT_ASPECT[layoutCfg.orientation]
  );
}

function logoPosition(
  anchor: LogoAnchor,
  logo: LogoConfig,
  stripWidth: number,
  stripHeight: number,
): { top?: number; bottom?: number; left?: number; right?: number } {
  const ox = logo.offsetX ?? 8;
  const oy = logo.offsetY ?? 8;

  switch (anchor) {
    case "top-left":
      return { top: oy, left: ox };
    case "top-center":
      return { top: oy, left: stripWidth / 2 - logo.width / 2 };
    case "top-right":
      return { top: oy, right: ox };
    case "bottom-left":
      return { bottom: oy, left: ox };
    case "bottom-center":
      return { bottom: oy, left: stripWidth / 2 - logo.width / 2 };
    case "bottom-right":
      return { bottom: oy, right: ox };
    case "custom":
      return { top: oy, left: ox };
  }
}

interface BackgroundProps {
  background: StripBackground;
  stripWidth: number;
  stripHeight: number;
}

const StripBackgroundRenderer: React.FC<BackgroundProps> = ({
  background,
  stripWidth,
  stripHeight,
}) => {
  if (background.type === "solid") return null;

  if (background.type === "image") {
    return (
      <Image
        source={background.source}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />
    );
  }

  if (background.type === "svg") {
    const SvgComponent = background.component;

    return (
      <SvgComponent
        color={background.color}
        width={stripWidth}
        height={stripHeight}
      />
    );
  }

  return null;
};

const PhotoSlot: React.FC<{
  photo?: StripPhoto;
  style?: ViewStyle;
  slotRadius: number;
  filterMatrix?: number[];
  width: number;
  height: number;
  onPress?: () => void;
}> = ({ photo, style, slotRadius, filterMatrix, width, height, onPress }) => {
  const uri = photo?.uri;
  const transform = photo?.transform;

  const imageScale = transform?.scale ?? 1;

  /**
   * Map the editor's fitted dimensions into slot space using a uniform
   * cover-semantic scale factor. Math.max ensures the image still fills
   * the slot on both axes before any pan is applied.
   */
  const editorFittedWidth = transform?.fittedWidth ?? width;
  const editorFittedHeight = transform?.fittedHeight ?? height;

  const slotToEditor = Math.max(
    width / editorFittedWidth,
    height / editorFittedHeight,
  );

  const fittedWidth = editorFittedWidth * slotToEditor;
  const fittedHeight = editorFittedHeight * slotToEditor;

  // Final rendered size after user pinch-scale
  const scaledFittedWidth = fittedWidth * imageScale;
  const scaledFittedHeight = fittedHeight * imageScale;

  /**
   * Convert editor-space translations to slot space, then clamp so the
   * scaled image can never expose a gap at any edge.
   *
   * The clamp is essential: a large pan recorded in the editor (where the
   * image is bigger) can overshoot the slot bounds when mapped down to the
   * smaller slot coordinate space.
   */
  const rawTx = (transform?.translateX ?? 0) * slotToEditor;
  const rawTy = (transform?.translateY ?? 0) * slotToEditor;

  const maxTx = Math.max(0, (scaledFittedWidth - width) / 2);
  const maxTy = Math.max(0, (scaledFittedHeight - height) / 2);

  const translateX = Math.max(-maxTx, Math.min(maxTx, rawTx));
  const translateY = Math.max(-maxTy, Math.min(maxTy, rawTy));

  return (
    <Pressable
      onPress={onPress}
      style={[styles.slot, { borderRadius: slotRadius }, style]}
    >
      {photo ? (
        <View
          style={{
            width,
            height,
            overflow: "hidden",
            borderRadius: slotRadius,
          }}
        >
          <View
            style={{
              position: "absolute",
              width: scaledFittedWidth,
              height: scaledFittedHeight,
              left: (width - scaledFittedWidth) / 2 + translateX,
              top: (height - scaledFittedHeight) / 2 + translateY,
            }}
          >
            {filterMatrix && uri ? (
              <FilteredImage
                uri={uri}
                matrix={filterMatrix}
                width={scaledFittedWidth}
                height={scaledFittedHeight}
              />
            ) : (
              <Image
                source={{ uri }}
                style={{
                  width: scaledFittedWidth,
                  height: scaledFittedHeight,
                }}
                resizeMode="cover"
              />
            )}
          </View>
        </View>
      ) : (
        <Text style={styles.emptyLabel}>Empty</Text>
      )}
    </Pressable>
  );
};

export function getSlotAspectRatio(type: LayoutType): number {
  const config = LAYOUTS[type];

  return (
    config.slotAspectRatio ?? ORIENTATION_DEFAULT_ASPECT[config.orientation]
  );
}

const DEFAULT_WIDTH_PORTRAIT = 320;
const DEFAULT_WIDTH_LANDSCAPE = 600;

export const PhotoboothStrip: React.FC<PhotoboothStripProps> = ({
  type,
  images = [],
  slots: slotConfigs = [],
  background,
  stickers = [],
  logo,
  filterMatrix,
  width,
  height,
  scaleRatio = 1,
  onImagePress,
}) => {
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

  const clampedScale = Math.min(1, Math.max(0.01, scaleRatio));

  const resolvedBackground: StripBackground = background ?? config.background;

  const resolvedBgColor =
    resolvedBackground.type === "solid" ? resolvedBackground.color : undefined;

  const defaultWidth =
    orientation === "landscape"
      ? DEFAULT_WIDTH_LANDSCAPE
      : DEFAULT_WIDTH_PORTRAIT;

  const stripWidth = width ?? defaultWidth;
  const innerWidth = stripWidth - paddingLeft - paddingRight;
  const baseSlotWidth = (innerWidth - gap * (columns - 1)) / columns;

  const rowHeights = Array.from({ length: rows }, (_, rowIdx) => {
    let maxH = 0;
    for (let colIdx = 0; colIdx < columns; colIdx++) {
      const idx = rowIdx * columns + colIdx;
      const aspect = resolveAspectRatio(slotConfigs[idx], config);
      maxH = Math.max(maxH, baseSlotWidth / aspect);
    }
    return maxH;
  });

  const computedInnerHeight =
    rowHeights.reduce((s, h) => s + h, 0) + gap * (rows - 1);
  const computedStripHeight = computedInnerHeight + paddingTop + paddingBottom;
  const stripHeight = height ?? computedStripHeight;
  const scale = stripHeight / computedStripHeight;

  const scaledGap = gap * scale;
  const slotWidth = baseSlotWidth * scale;
  const scaledPaddingTop = paddingTop * scale;
  const scaledPaddingLeft = paddingLeft * scale;
  const scaledRowHeights = rowHeights.map((h) => h * scale);
  const scaledSlotRadius = slotRadius * scale;
  const scaledStripRadius = stripRadius * scale;

  const rowOffsets = scaledRowHeights.reduce<number[]>((acc, h, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + scaledRowHeights[i - 1] + scaledGap);
    return acc;
  }, []);

  const slots = Array.from({ length: columns * rows }, (_, i) => {
    const row = Math.floor(i / columns);
    const col = i % columns;
    const slotCfg = slotConfigs[i];
    const aspect = resolveAspectRatio(slotCfg, config);
    return {
      key: i,
      photo: images[i],
      width: slotWidth,
      height: slotWidth / aspect,
      top:
        rowOffsets[row] +
        (slotCfg?.offsetY ?? 0) * scale +
        slotsOffsetY * scale,
      left:
        col * (slotWidth + scaledGap) +
        (slotCfg?.offsetX ?? 0) * scale +
        slotsOffsetX * scale,
    };
  });

  const strip = (
    <View
      style={{
        width: stripWidth,
        height: stripHeight,
        borderRadius: scaledStripRadius,
        overflow: "hidden",
        backgroundColor: resolvedBgColor,
      }}
    >
      <StripBackgroundRenderer
        background={resolvedBackground}
        stripWidth={stripWidth}
        stripHeight={stripHeight}
      />

      <View
        style={{
          position: "absolute",
          top: scaledPaddingTop,
          left: scaledPaddingLeft,
          width: innerWidth * scale,
          height: computedInnerHeight * scale,
        }}
      >
        {slots.map((s) => (
          <PhotoSlot
            key={s.key}
            photo={s.photo}
            slotRadius={scaledSlotRadius}
            filterMatrix={filterMatrix}
            width={s.width}
            height={s.height}
            onPress={() => {
              onImagePress?.(s.key);
            }}
            style={{
              position: "absolute",
              width: s.width,
              height: s.height,
              top: s.top,
              left: s.left,
            }}
          />
        ))}
      </View>

      {stickers.map((sticker, i) => (
        <Image
          key={i}
          source={sticker.source}
          style={{
            position: "absolute",
            top: sticker.y,
            left: sticker.x,
            width: sticker.width,
            height: sticker.height,
            transform: sticker.rotation
              ? [{ rotate: `${sticker.rotation}deg` }]
              : [],
          }}
          resizeMode="contain"
        />
      ))}

      {logo && (
        <Image
          source={logo.source}
          style={{
            position: "absolute",
            width: logo.width,
            height: logo.height,
            ...logoPosition(logo.anchor, logo, stripWidth, stripHeight),
          }}
          resizeMode="contain"
        />
      )}
    </View>
  );

  if (clampedScale === 1) {
    return strip;
  }

  const scaledW = stripWidth * clampedScale;
  const scaledH = stripHeight * clampedScale;
  const shrinkX = stripWidth - scaledW;
  const shrinkY = stripHeight - scaledH;

  return (
    <View style={{ width: scaledW, height: scaledH, overflow: "visible" }}>
      <View
        style={{
          transform: [{ scale: clampedScale }],
          marginLeft: -(shrinkX / 2),
          marginTop: -(shrinkY / 2),
          marginRight: -(shrinkX / 2),
          marginBottom: -(shrinkY / 2),
        }}
      >
        {strip}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  slot: {
    backgroundColor: "#F0F0F0",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyLabel: {
    color: "#999",
    fontSize: 18,
  },
});

export default PhotoboothStrip;
