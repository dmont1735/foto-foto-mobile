import React, { createContext, useCallback, useContext, useState } from "react";
import { Layout, StripBackground } from "../utils/strip-layouts";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PhotoFilter = "none" | "bw" | "sepia" | "vivid" | "warm" | "cool";

export interface SessionState {
  layout: Layout | null;
  photos: string[];
  background: StripBackground;
  filter: PhotoFilter;
}

interface SessionContextValue {
  session: SessionState;
  setLayout: (layout: Layout) => void;
  addPhoto: (uri: string) => void;
  setPhotos: (photos: string[]) => void;
  removePhoto: (index: number) => void;
  setBackground: (background: StripBackground) => void;
  setBackgroundColor: (color: string) => void;
  setFilter: (filter: PhotoFilter) => void;
  resetSession: () => void;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_SESSION: SessionState = {
  layout: null,
  photos: [],
  background: { type: "solid", color: "#ffffff" },
  filter: "none",
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

  const addPhoto = useCallback((uri: string) => {
    setSession((prev) => ({ ...prev, photos: [...prev.photos, uri] }));
  }, []);

  const setPhotos = useCallback((photos: string[]) => {
    setSession((prev) => ({ ...prev, photos }));
  }, []);

  const removePhoto = useCallback((index: number) => {
    setSession((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  }, []);

  const setBackground = useCallback((background: StripBackground) => {
    setSession((prev) => ({ ...prev, background }));
  }, []);

  const setBackgroundColor = useCallback((color: string) => {
    setSession((prev) => {
      const bg = prev.background;
      if (bg.type === "solid") {
        return { ...prev, background: { type: "solid", color } };
      }
      if (bg.type === "svg") {
        return { ...prev, background: { ...bg, color } }; // ← only color changes
      }
      return prev; // image → no-op
    });
  }, []);

  const setFilter = useCallback((filter: PhotoFilter) => {
    setSession((prev) => ({ ...prev, filter }));
  }, []);

  const resetSession = useCallback(() => {
    setSession(DEFAULT_SESSION);
  }, []);

  return (
    <SessionContext.Provider
      value={{
        session,
        setLayout,
        addPhoto,
        setPhotos,
        removePhoto,
        setBackground,
        setBackgroundColor,
        setFilter,
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
