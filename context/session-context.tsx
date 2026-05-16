import React, { createContext, useCallback, useContext, useState } from "react";
import { Layout } from "../utils/strip-layouts"; // adjust path as needed

// ─── Types ────────────────────────────────────────────────────────────────────

export type PhotoFilter = "none" | "bw" | "sepia" | "vivid" | "warm" | "cool";

export interface SessionState {
  layout: Layout | null;
  photos: string[]; // local URIs, one per slot
  background: string; // hex or rgba string, e.g. "#ff4089"
  filter: PhotoFilter;
}

interface SessionContextValue {
  session: SessionState;
  setLayout: (layout: Layout) => void;
  addPhoto: (uri: string) => void;
  setPhotos: (photos: string[]) => void;
  removePhoto: (index: number) => void;
  setBackground: (background: string) => void;
  setFilter: (filter: PhotoFilter) => void;
  resetSession: () => void;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_SESSION: SessionState = {
  layout: null,
  photos: [],
  background: "#ffffff",
  filter: "none",
};

// ─── Context ──────────────────────────────────────────────────────────────────

const SessionContext = createContext<SessionContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionState>(DEFAULT_SESSION);

  const setLayout = useCallback((layout: Layout) => {
    setSession((prev) => ({ ...prev, layout }));
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

  const setBackground = useCallback((background: string) => {
    setSession((prev) => ({ ...prev, background }));
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
