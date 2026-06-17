import {
    Canvas,
    ColorMatrix,
    Group,
    Image,
    Paint,
    RoundedRect,
    rect,
    rrect,
    useCanvasRef,
    useImage,
} from "@shopify/react-native-skia";
import React, { forwardRef, useEffect, useImperativeHandle } from "react";
import { Image as RNImage, View } from "react-native";

import {
    LayoutType,
    LogoConfig,
    StickerConfig,
    StripPhoto,
} from "../components/photobooth-strip";
import { StripBackground } from "../utils/strip-layouts";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SkiaStripExportHandle {
  capture: () => string | null;
}

export interface SkiaStripExportProps {
  type: LayoutType;
  images?: StripPhoto[];
  background?: StripBackground;
  backgroundUri?: string | null;
  stickers?: StickerConfig[];
  logo?: LogoConfig;
  filterMatrix?: number[];
  onReady?: () => void;
  /**
   * Multiplier applied to the entire canvas for export resolution.
   * The on-screen layout math (computeLayout, slots, stickers, logo)
   * is untouched — we just scale the whole render tree up via a
   * top-level Group transform, then size the Canvas/View to match.
   * 3 is a good default (sharp on most screens without huge file size).
   * Bump to 4 for print-quality exports, drop to 2 to save memory.
   */
  exportScale?: number;
}

// ─── Layout constants (mirrored from photobooth-strip.tsx) ────────────────────

const ORIENTATION_DEFAULT_ASPECT: Record<"portrait" | "landscape", number> = {
  portrait: 3 / 4,
  landscape: 4 / 3,
};

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
  defaultBackground: string;
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
    defaultBackground: "#4B5FFA",
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
    defaultBackground: "#E8934A",
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
    defaultBackground: "#2ECC40",
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
    defaultBackground: "#E8302A",
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
    defaultBackground: "#F670E0",
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
    defaultBackground: "#FF9ECD",
  },
};

const DEFAULT_WIDTH_PORTRAIT = 320;
const DEFAULT_WIDTH_LANDSCAPE = 600;

// Default export resolution multiplier. Applied on top of the base
// strip dimensions below via a Group transform in the component.
const DEFAULT_EXPORT_SCALE = 3;

// ─── Layout calculation ───────────────────────────────────────────────────────
// NOTE: unchanged — still computes layout in base (1x) logical units.
// Scaling to export resolution happens separately at render time.

function computeLayout(type: LayoutType) {
  const config = LAYOUTS[type];
  const {
    columns,
    rows,
    orientation,
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
    gap,
    slotAspectRatio,
    stripRadius,
    slotRadius,
  } = config;

  const stripWidth =
    orientation === "landscape"
      ? DEFAULT_WIDTH_LANDSCAPE
      : DEFAULT_WIDTH_PORTRAIT;

  const innerWidth = stripWidth - paddingLeft - paddingRight;
  const baseSlotWidth = (innerWidth - gap * (columns - 1)) / columns;
  const aspect = slotAspectRatio ?? ORIENTATION_DEFAULT_ASPECT[orientation];
  const slotHeight = baseSlotWidth / aspect;
  const innerHeight = slotHeight * rows + gap * (rows - 1);
  const stripHeight = innerHeight + paddingTop + paddingBottom;

  const slots = Array.from({ length: columns * rows }, (_, i) => {
    const row = Math.floor(i / columns);
    const col = i % columns;
    return {
      index: i,
      x: paddingLeft + col * (baseSlotWidth + gap),
      y: paddingTop + row * (slotHeight + gap),
      width: baseSlotWidth,
      height: slotHeight,
    };
  });

  return {
    stripWidth,
    stripHeight,
    stripRadius,
    slotRadius,
    slots,
    defaultBackground: config.defaultBackground,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveUri(source: any): string | null {
  if (!source) return null;
  if (typeof source === "string") return source;
  if (typeof source === "object" && "uri" in source) return source.uri ?? null;
  // Static require() asset
  try {
    const resolved = RNImage.resolveAssetSource(source);
    return resolved?.uri ?? null;
  } catch {
    return null;
  }
}

// ─── Per-slot image ───────────────────────────────────────────────────────────

const SlotImage: React.FC<{
  photo: StripPhoto;
  x: number;
  y: number;
  width: number;
  height: number;
  slotRadius: number;
  filterMatrix?: number[];
}> = ({ photo, x, y, width, height, slotRadius, filterMatrix }) => {
  // useImage must always be called — no early returns before it
  const skImage = useImage(photo.uri);
  if (!skImage) return null;

  const t = photo.transform;
  const imageScale = t?.scale ?? 1;

  const editorFittedW = t?.fittedWidth ?? width;
  const editorFittedH = t?.fittedHeight ?? height;

  const slotToEditor = Math.max(width / editorFittedW, height / editorFittedH);
  const fittedW = editorFittedW * slotToEditor;
  const fittedH = editorFittedH * slotToEditor;
  const scaledW = fittedW * imageScale;
  const scaledH = fittedH * imageScale;

  const rawTx = (t?.translateX ?? 0) * slotToEditor;
  const rawTy = (t?.translateY ?? 0) * slotToEditor;
  const maxTx = Math.max(0, (scaledW - width) / 2);
  const maxTy = Math.max(0, (scaledH - height) / 2);
  const translateX = Math.max(-maxTx, Math.min(maxTx, rawTx));
  const translateY = Math.max(-maxTy, Math.min(maxTy, rawTy));

  const imgX = x + (width - scaledW) / 2 + translateX;
  const imgY = y + (height - scaledH) / 2 + translateY;

  const paint = filterMatrix ? (
    <Paint>
      <ColorMatrix matrix={filterMatrix} />
    </Paint>
  ) : undefined;

  return (
    <Group
      clip={rrect(rect(x, y, width, height), slotRadius, slotRadius)}
      layer={paint}
    >
      <Image
        image={skImage}
        x={imgX}
        y={imgY}
        width={scaledW}
        height={scaledH}
        fit="fill"
      />
    </Group>
  );
};

// ─── Sticker ──────────────────────────────────────────────────────────────────

const StickerImage: React.FC<{ sticker: StickerConfig }> = ({ sticker }) => {
  // Resolve URI unconditionally so useImage hook order is stable
  const uri =
    sticker.source.kind === "image" ? resolveUri(sticker.source.source) : null;

  const skImage = useImage(uri);

  // SVG stickers cannot be rendered in Skia — skip silently
  if (sticker.source.kind === "svg") return null;
  if (!skImage) return null;

  const cx = sticker.x + sticker.width / 2;
  const cy = sticker.y + sticker.height / 2;
  const rad = ((sticker.rotation ?? 0) * Math.PI) / 180;

  return (
    <Group
      transform={
        sticker.rotation
          ? [
              { translateX: cx },
              { translateY: cy },
              { rotate: rad },
              { translateX: -cx },
              { translateY: -cy },
            ]
          : undefined
      }
    >
      <Image
        image={skImage}
        x={sticker.x}
        y={sticker.y}
        width={sticker.width}
        height={sticker.height}
        fit="contain"
      />
    </Group>
  );
};

// ─── Logo ─────────────────────────────────────────────────────────────────────

const LogoImage: React.FC<{
  logo: LogoConfig;
  stripWidth: number;
  stripHeight: number;
}> = ({ logo, stripWidth, stripHeight }) => {
  const uri = resolveUri(logo.source);
  const skImage = useImage(uri);
  if (!skImage) return null;

  const ox = logo.offsetX ?? 8;
  const oy = logo.offsetY ?? 8;

  let x = ox;
  let y = oy;

  switch (logo.anchor) {
    case "top-center":
      x = stripWidth / 2 - logo.width / 2;
      y = oy;
      break;
    case "top-right":
      x = stripWidth - logo.width - ox;
      y = oy;
      break;
    case "bottom-left":
      x = ox;
      y = stripHeight - logo.height - oy;
      break;
    case "bottom-center":
      x = stripWidth / 2 - logo.width / 2;
      y = stripHeight - logo.height - oy;
      break;
    case "bottom-right":
      x = stripWidth - logo.width - ox;
      y = stripHeight - logo.height - oy;
      break;
    default:
      x = ox;
      y = oy;
      break;
  }

  return (
    <Image
      image={skImage}
      x={x}
      y={y}
      width={logo.width}
      height={logo.height}
      fit="contain"
    />
  );
};

// ─── Main canvas ──────────────────────────────────────────────────────────────

const PhotoboothStripSkiaExport = forwardRef<
  SkiaStripExportHandle,
  SkiaStripExportProps
>(function PhotoboothStripSkiaExport(
  {
    type,
    images = [],
    background,
    backgroundUri: backgroundUriProp,
    stickers = [],
    logo,
    filterMatrix,
    onReady,
    exportScale = DEFAULT_EXPORT_SCALE,
  },
  ref,
) {
  const canvasRef = useCanvasRef();
  const {
    stripWidth,
    stripHeight,
    stripRadius,
    slotRadius,
    slots,
    defaultBackground,
  } = computeLayout(type);

  // Physical canvas/view dimensions at export resolution.
  // All drawing below still happens in base (1x) logical coordinates,
  // wrapped in a single Group that scales everything up uniformly.
  const canvasWidth = stripWidth * exportScale;
  const canvasHeight = stripHeight * exportScale;

  const bgColor =
    background?.type === "solid" ? background.color : defaultBackground;

  useImperativeHandle(ref, () => ({
    capture: () => {
      const image = canvasRef.current?.makeImageSnapshot();
      if (!image) return null;
      return `data:image/png;base64,${image.encodeToBase64()}`;
    },
  }));

  const backgroundUri =
    background?.type === "svg"
      ? (background.pngUri ?? backgroundUriProp ?? null) // ← use cached pngUri
      : (backgroundUriProp ?? null);

  const bgImageUri =
    background?.type === "image"
      ? resolveUri(background.source)
      : background?.type === "svg"
        ? backgroundUri
        : null;

  const bgImage = useImage(bgImageUri);
  const hasBackground = bgImageUri !== null;

  useEffect(() => {
    if (!hasBackground || bgImage) {
      onReady?.();
    }
  }, [bgImage, hasBackground]);

  return (
    <View style={{ width: canvasWidth, height: canvasHeight }}>
      <Canvas
        ref={canvasRef}
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        <Group transform={[{ scale: exportScale }]}>
          {/* Strip background */}
          <RoundedRect
            x={0}
            y={0}
            width={stripWidth}
            height={stripHeight}
            r={stripRadius}
            color={bgColor}
          />

          <Group
            clip={rrect(
              rect(0, 0, stripWidth, stripHeight),
              stripRadius,
              stripRadius,
            )}
          >
            {bgImage && (
              <Image
                image={bgImage}
                x={0}
                y={0}
                width={stripWidth}
                height={stripHeight}
                fit="fill"
              />
            )}
          </Group>

          <Group
            clip={rrect(
              rect(0, 0, stripWidth, stripHeight),
              stripRadius,
              stripRadius,
            )}
          >
            {/* Slot placeholder backgrounds */}
            {slots.map((slot) => (
              <RoundedRect
                key={slot.index}
                x={slot.x}
                y={slot.y}
                width={slot.width}
                height={slot.height}
                r={slotRadius}
                color="#F0F0F0"
              />
            ))}

            {/* Slot photos with filter */}
            {slots.map((slot) => {
              const photo = images[slot.index];
              if (!photo?.uri) return null;
              return (
                <SlotImage
                  key={slot.index}
                  photo={photo}
                  x={slot.x}
                  y={slot.y}
                  width={slot.width}
                  height={slot.height}
                  slotRadius={slotRadius}
                  filterMatrix={filterMatrix}
                />
              );
            })}

            {/* Stickers */}
            {stickers.map((sticker, i) => (
              <StickerImage key={i} sticker={sticker} />
            ))}

            {/* Logo */}
            {logo && (
              <LogoImage
                logo={logo}
                stripWidth={stripWidth}
                stripHeight={stripHeight}
              />
            )}
          </Group>
        </Group>
      </Canvas>
    </View>
  );
});

export default PhotoboothStripSkiaExport;
