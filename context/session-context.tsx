import { ImageTransform } from "@/components/photo-edit-sheet";
import { StickerConfig } from "@/components/photobooth-strip";
import { StickerId } from "@/components/sticker-picker-tray";
import { generateBackgroundPngUri } from "@/utils/generate-background-png";
import React, { createContext, useCallback, useContext, useState } from "react";
import { Layout, StripBackground } from "../utils/strip-layouts";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PhotoFilter = "none" | "bw" | "sepia" | "vivid" | "warm" | "cool";

export const FILTERS: Record<PhotoFilter, number[]> = {
  none: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
  bw: [
    0.2126, 0.7152, 0.0722, 0, 0, 0.2126, 0.7152, 0.0722, 0, 0, 0.2126, 0.7152,
    0.0722, 0, 0, 0, 0, 0, 1, 0,
  ],
  sepia: [
    0.393, 0.769, 0.189, 0, 0, 0.349, 0.686, 0.168, 0, 0, 0.272, 0.534, 0.131,
    0, 0, 0, 0, 0, 1, 0,
  ],
  vivid: [
    1.25, -0.1, -0.1, 0, 0, -0.1, 1.25, -0.1, 0, 0, -0.1, -0.1, 1.25, 0, 0, 0,
    0, 0, 1, 0,
  ],
  warm: [1.12, 0, 0, 0, 0, 0, 1.04, 0, 0, 0, 0, 0, 0.88, 0, 0, 0, 0, 0, 1, 0],
  cool: [0.88, 0, 0, 0, 0, 0, 1.0, 0, 0, 0, 0, 0, 1.12, 0, 0, 0, 0, 0, 1, 0],
};

export interface SessionPhoto {
  uri: string;
  transform: ImageTransform | null;
}

export interface SessionState {
  layout: Layout | null;
  photos: SessionPhoto[];
  background: StripBackground;
  filter: PhotoFilter;
  filterMatrix: number[];
  stickerId: StickerId;
  stickers: StickerConfig[];
}

interface SessionContextValue {
  session: SessionState;
  setLayout: (layout: Layout) => void;
  addPhoto: (uri: string, transform?: ImageTransform | null) => void;
  addPhotos: (
    entries: { uri: string; transform: ImageTransform | null }[],
  ) => void;
  setPhotos: (photos: SessionPhoto[]) => void;
  replacePhoto: (
    index: number,
    uri: string,
    transform?: ImageTransform | null,
  ) => void;
  updatePhotoTransform: (index: number, transform: ImageTransform) => void;
  removePhoto: (index: number) => void;
  setBackground: (background: StripBackground) => void;
  setBackgroundColor: (color: string, width: number, height: number) => void;
  setFilter: (filter: PhotoFilter) => void;
  setStickers: (id: StickerId, stickers: StickerConfig[]) => void;
  resetSession: () => void;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_SESSION: SessionState = {
  layout: null,
  photos: [],
  background: { type: "solid", color: "#ffffff" },
  filter: "none",
  filterMatrix: FILTERS.none,
  stickerId: "none",
  stickers: [],
};

// ─── Context ──────────────────────────────────────────────────────────────────

const SessionContext = createContext<SessionContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionState>(DEFAULT_SESSION);

  const setLayout = useCallback((layout: Layout) => {
    setSession((prev) => ({
      ...prev,
      layout,
      background: layout.defaultBackground,
    }));
  }, []);

  const addPhoto = useCallback(
    (uri: string, transform: ImageTransform | null = null) => {
      setSession((prev) => ({
        ...prev,
        photos: [...prev.photos, { uri, transform }],
      }));
    },
    [],
  );

  const addPhotos = useCallback(
    (entries: { uri: string; transform: ImageTransform | null }[]) => {
      setSession((prev) => ({ ...prev, photos: [...prev.photos, ...entries] }));
    },
    [],
  );

  const setPhotos = useCallback((photos: SessionPhoto[]) => {
    setSession((prev) => ({ ...prev, photos }));
  }, []);

  const replacePhoto = useCallback(
    (index: number, uri: string, transform: ImageTransform | null = null) => {
      setSession((prev) => ({
        ...prev,
        photos: prev.photos.map((photo, i) =>
          i === index ? { uri, transform } : photo,
        ),
      }));
    },
    [],
  );

  const updatePhotoTransform = useCallback(
    (index: number, transform: ImageTransform) => {
      setSession((prev) => ({
        ...prev,
        photos: prev.photos.map((photo, i) =>
          i === index ? { ...photo, transform } : photo,
        ),
      }));
    },
    [],
  );

  const removePhoto = useCallback((index: number) => {
    setSession((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  }, []);

  const setBackground = useCallback((background: StripBackground) => {
    setSession((prev) => ({ ...prev, background }));
  }, []);

  // session-context.ts
  const setBackgroundColor = useCallback(
    (color: string, width: number, height: number) => {
      setSession((prev) => {
        const bg = prev.background;
        if (bg.type === "solid")
          return { ...prev, background: { type: "solid", color } };
        if (bg.type === "svg")
          return {
            ...prev,
            background: {
              ...bg,
              color,
              pngUri: undefined,
              // generatePngUri is preserved by the spread — but it closes over
              // the old `bg`. Fix: override it to close over the new object.
              generatePngUri: (w?: number, h?: number) =>
                bg.generatePngUri
                  ? generateBackgroundPngUri(
                      bg.component,
                      color,
                      width,
                      h ?? height,
                    )
                  : Promise.resolve(""),
            },
          };
        return prev;
      });
    },
    [],
  );

  const setFilter = useCallback((filter: PhotoFilter) => {
    setSession((prev) => ({
      ...prev,
      filter,
      filterMatrix: FILTERS[filter] ?? FILTERS.none,
    }));
  }, []);

  // ← new
  const setStickers = useCallback(
    (id: StickerId, stickers: StickerConfig[]) => {
      setSession((prev) => ({ ...prev, stickerId: id, stickers }));
    },
    [],
  );

  const resetSession = useCallback(() => {
    setSession(DEFAULT_SESSION);
  }, []);

  return (
    <SessionContext.Provider
      value={{
        session,
        setLayout,
        addPhoto,
        addPhotos,
        setPhotos,
        replacePhoto,
        updatePhotoTransform,
        removePhoto,
        setBackground,
        setBackgroundColor,
        setFilter,
        setStickers,
        resetSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
