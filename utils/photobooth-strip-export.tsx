/**
 * PhotoboothStripExport.tsx
 *
 * React Native analog of the web version's `PhotoframeExport`.
 *
 * RN version pipeline:
 *   <PhotoboothStrip> rendered inside a <ViewShot>
 *     → geometry pre-computed by useStripGeometry
 *     → viewShotRef.current.capture() → file URI
 */

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { ImageSourcePropType } from "react-native";

import ViewShot, { CaptureOptions } from "react-native-view-shot";

import {
  LayoutType,
  LogoConfig,
  PhotoboothStrip,
  StickerConfig,
} from "../components/photobooth-strip";

import { StripBackground } from "../utils/strip-layouts";

import { useStripGeometry } from "./use-strip-geometry";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Derives a stable string key from a background value.
 * Used as a useEffect dependency so captures only fire when the
 * background content actually changes, not on every object reference change.
 */
function backgroundKey(bg: StripBackground | undefined): string {
  if (!bg) return "none";
  if (bg.type === "solid") return `solid:${bg.color}`;
  if (bg.type === "image") {
    const src = bg.source;
    if (typeof src === "number") return `image:${src}`;
    if (typeof src === "string") return `image:${src}`;
    if ("uri" in src) return `image:${src.uri}`;
    return `image:${JSON.stringify(src)}`;
  }
  if (bg.type === "svg") return `svg:${bg.color}`;
  return "unknown";
}

// ─── Public handle ───────────────────────────────────────────────────────────

export interface PhotoboothStripExportHandle {
  capture: () => Promise<string>;
  geometry: ReturnType<typeof useStripGeometry>;
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface PhotoboothStripExportProps {
  type: LayoutType;
  images?: ImageSourcePropType[];
  background?: StripBackground;
  stickers?: StickerConfig[];
  logo?: LogoConfig;
  width?: number;
  height?: number;
  captureOptions?: CaptureOptions;
  onCaptureStart?: () => void;
  onCaptureSuccess?: (uri: string) => void;
  onCaptureError?: (error: unknown) => void;
  /**
   * Automatically capture after mount / updates
   * @default false
   */
  autoCaptureOnMount?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

const DEFAULT_CAPTURE_OPTIONS: CaptureOptions = {
  format: "png",
  quality: 1,
};

const PhotoboothStripExport = forwardRef<
  PhotoboothStripExportHandle,
  PhotoboothStripExportProps
>(function PhotoboothStripExport(
  {
    type,
    images = [],
    background,
    stickers = [],
    logo,
    width,
    height,
    captureOptions = DEFAULT_CAPTURE_OPTIONS,
    onCaptureStart,
    onCaptureSuccess,
    onCaptureError,
    autoCaptureOnMount = false,
  },
  ref,
) {
  const viewShotRef = useRef<ViewShot>(null);

  const geometry = useStripGeometry({ type, width, height });

  // ── Capture helper ───────────────────────────────────────────────────────

  async function captureStrip(): Promise<string> {
    if (!viewShotRef.current?.capture) {
      throw new Error(
        "PhotoboothStripExport: ViewShot ref is not attached yet.",
      );
    }

    onCaptureStart?.();

    try {
      const uri = await viewShotRef.current.capture();
      onCaptureSuccess?.(uri);
      return uri;
    } catch (err) {
      onCaptureError?.(err);
      throw err;
    }
  }

  // ── Auto-capture ─────────────────────────────────────────────────────────
  //
  // Use a stable string key for background instead of the object reference
  // so captures only fire when content actually changes.

  const bgKey = backgroundKey(background);

  useEffect(() => {
    if (!autoCaptureOnMount) return;

    const id = setTimeout(() => {
      captureStrip().catch(() => {});
    }, 300);

    return () => clearTimeout(id);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCaptureOnMount, type, images, bgKey, stickers, logo, width, height]);

  // ── Expose imperative API ────────────────────────────────────────────────

  useImperativeHandle(
    ref,
    () => ({
      geometry,
      capture: captureStrip,
    }),
    [geometry],
  );

  return (
    <ViewShot
      ref={viewShotRef}
      options={captureOptions}
      style={{
        width: geometry.stripWidth,
        height: geometry.stripHeight,
      }}
    >
      <PhotoboothStrip
        type={type}
        images={images}
        background={background}
        stickers={stickers}
        logo={logo}
        width={geometry.stripWidth}
        height={geometry.stripHeight}
      />
    </ViewShot>
  );
});

export default PhotoboothStripExport;

// ─── Convenience hook ───────────────────────────────────────────────────────

export function useStripExport({
  onSuccess,
  onError,
}: {
  onSuccess?: (uri: string) => void;
  onError?: (err: unknown) => void;
} = {}) {
  const exportRef = useRef<PhotoboothStripExportHandle>(null);
  const [isExporting, setIsExporting] = useState(false);

  async function exportStrip(): Promise<string | null> {
    if (!exportRef.current) return null;

    setIsExporting(true);

    try {
      const uri = await exportRef.current.capture();
      onSuccess?.(uri);
      return uri;
    } catch (err) {
      onError?.(err);
      return null;
    } finally {
      setIsExporting(false);
    }
  }

  return {
    exportRef,
    exportStrip,
    isExporting,
  };
}
