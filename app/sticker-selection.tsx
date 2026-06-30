import {
  CARD_HEIGHT,
  CARD_WIDTH,
  PreviewCard,
  PreviewSection,
  PreviewSlide,
  ScreenContainer,
  ScreenFooter,
  ScreenHeader,
} from "@/components/screen-layout";
import { colors } from "@/styles/theme";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import PhotoboothStrip, {
  getStripNaturalSize,
  StickerConfig,
} from "@/components/photobooth-strip";
import StickerPickerTray, {
  StickerOption,
} from "@/components/sticker-picker-tray";
import { useSession } from "../context/session-context";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function layoutNameToType(name: string) {
  return name.split(" ")[1] as "A" | "B" | "C" | "D" | "E" | "F";
}

const MIN_STICKER_SIZE = 20;
const MAX_STICKER_SIZE = 150;

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlacedSticker extends StickerConfig {
  _id: string;
  rotation?: number;
}

// ─── Draggable sticker overlay ────────────────────────────────────────────────

const DraggableSticker: React.FC<{
  sticker: PlacedSticker;
  scaleRatio: number;
  selected: boolean;
  onDelete: (id: string) => void;
}> = ({ sticker, scaleRatio, selected, onDelete }) => {
  const displayX = sticker.x * scaleRatio;
  const displayY = sticker.y * scaleRatio;
  const displayW = sticker.width * scaleRatio;
  const displayH = sticker.height * scaleRatio;

  return (
    <View
      style={{
        position: "absolute",
        left: displayX,
        top: displayY,
        width: displayW,
        height: displayH,
        transform: [{ rotate: `${sticker.rotation ?? 0}deg` }],
        pointerEvents: "box-none",
      }}
    >
      {selected && (
        <View style={[StyleSheet.absoluteFillObject, styles.selectionBorder]} />
      )}
      {selected && (
        <Pressable
          onPress={() => onDelete(sticker._id)}
          style={styles.deleteButton}
          hitSlop={12}
          pointerEvents="box-only"
        >
          <Text style={styles.controlLabel}>✕</Text>
        </Pressable>
      )}
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function StickerPreviewScreen() {
  const { session, setStickers } = useSession();

  // Derive safely before hooks
  const type = session.layout ? layoutNameToType(session.layout.name) : null;
  const natural = type ? getStripNaturalSize(type) : { width: 1, height: 1 };
  const scaleRatio = type
    ? Math.min(1, CARD_WIDTH / natural.width, CARD_HEIGHT / natural.height)
    : 1;
  const displayW = natural.width * scaleRatio;
  const displayH = natural.height * scaleRatio;

  // ── Hooks — all unconditionally above any guard ──────────────────────────

  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>(() =>
    (session.stickers ?? []).map((s, i) => ({
      ...s,
      _id: `s-${i}-${Date.now()}`,
    })),
  );
  const [activeDef, setActiveDef] = useState<StickerOption | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const stripViewRef = useRef<View>(null);
  const stripPageOrigin = useRef({ x: 0, y: 0 });

  const measureStrip = useCallback(() => {
    stripViewRef.current?.measure((_x, _y, _w, _h, pageX, pageY) => {
      stripPageOrigin.current = { x: pageX, y: pageY };
    });
  }, []);

  // ── Live refs so touch handlers always see current state ──────────────────

  const liveRefs = useRef({
    activeDef,
    scaleRatio,
    natural,
    selectedId,
    placedStickers,
    setPlacedStickers,
    setActiveDef,
    setSelectedId,
  });
  liveRefs.current = {
    activeDef,
    scaleRatio,
    natural,
    selectedId,
    placedStickers,
    setPlacedStickers,
    setActiveDef,
    setSelectedId,
  };

  // ── Gesture state refs ────────────────────────────────────────────────────

  const dragState = useRef<{
    stickerId: string;
    lastX: number;
    lastY: number;
  } | null>(null);

  const pinchState = useRef<{
    stickerId: string;
    lastDist: number;
    lastAngle: number;
  } | null>(null);

  const tapState = useRef<{
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getPinchDist = (touches: any[]) => {
    const [a, b] = touches;
    return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
  };

  const getPinchAngle = (touches: any[]) => {
    const [a, b] = touches;
    return Math.atan2(b.pageY - a.pageY, b.pageX - a.pageX) * (180 / Math.PI);
  };

  const hitTestSticker = (
    localX: number,
    localY: number,
  ): PlacedSticker | undefined => {
    const sr = liveRefs.current.scaleRatio;
    const stickers = liveRefs.current.placedStickers;
    return [...stickers].reverse().find((s) => {
      const sx = s.x * sr;
      const sy = s.y * sr;
      const sw = s.width * sr;
      const sh = s.height * sr;
      return (
        localX >= sx - 14 &&
        localX <= sx + sw + 14 &&
        localY >= sy - 14 &&
        localY <= sy + sh + 14
      );
    });
  };

  const toLocal = (pageX: number, pageY: number) => ({
    x: pageX - stripPageOrigin.current.x,
    y: pageY - stripPageOrigin.current.y,
  });

  // ── Touch handlers ────────────────────────────────────────────────────────

  const handleTouchStart = useCallback((e: any) => {
    const touches = e.nativeEvent.touches;
    const {
      activeDef: def,
      scaleRatio: sr,
      natural: nat,
      selectedId: selId,
      setPlacedStickers,
      setActiveDef,
      setSelectedId,
    } = liveRefs.current;

    if (touches.length === 2) {
      const t0 = touches[0];
      const local = toLocal(t0.pageX, t0.pageY);
      const hit =
        hitTestSticker(local.x, local.y) ??
        (selId
          ? liveRefs.current.placedStickers.find((s) => s._id === selId)
          : undefined);

      if (hit) {
        pinchState.current = {
          stickerId: hit._id,
          lastDist: getPinchDist(touches),
          lastAngle: getPinchAngle(touches),
        };
        setSelectedId(hit._id);
      }
      dragState.current = null;
      tapState.current = null;
      return;
    }

    if (touches.length === 1) {
      const t = touches[0];
      const local = toLocal(t.pageX, t.pageY);
      tapState.current = { startX: t.pageX, startY: t.pageY, moved: false };
      if (def?.source) return;
      const hit = hitTestSticker(local.x, local.y);
      if (hit) {
        dragState.current = {
          stickerId: hit._id,
          lastX: t.pageX,
          lastY: t.pageY,
        };
      }
    }
  }, []);

  const handleTouchMove = useCallback((e: any) => {
    const touches = e.nativeEvent.touches;
    const sr = liveRefs.current.scaleRatio;
    const nat = liveRefs.current.natural;

    if (touches.length === 2 && pinchState.current) {
      const newDist = getPinchDist(touches);
      const newAngle = getPinchAngle(touches);
      const distDelta = newDist - pinchState.current.lastDist;
      const angleDelta = newAngle - pinchState.current.lastAngle;
      pinchState.current.lastDist = newDist;
      pinchState.current.lastAngle = newAngle;
      const id = pinchState.current.stickerId;

      liveRefs.current.setPlacedStickers((prev) =>
        prev.map((s) => {
          if (s._id !== id) return s;
          const aspect = s.height / s.width;
          const newW = Math.max(
            MIN_STICKER_SIZE,
            Math.min(MAX_STICKER_SIZE, s.width + distDelta / sr),
          );
          const newH = newW * aspect;
          const newX = Math.max(
            0,
            Math.min(nat.width - newW, s.x - (newW - s.width) / 2),
          );
          const newY = Math.max(
            0,
            Math.min(nat.height - newH, s.y - (newH - s.height) / 2),
          );
          return {
            ...s,
            width: newW,
            height: newH,
            x: newX,
            y: newY,
            rotation: (s.rotation ?? 0) + angleDelta,
          };
        }),
      );
      return;
    }

    if (touches.length === 1 && dragState.current) {
      const t = touches[0];
      const dx = (t.pageX - dragState.current.lastX) / sr;
      const dy = (t.pageY - dragState.current.lastY) / sr;
      dragState.current.lastX = t.pageX;
      dragState.current.lastY = t.pageY;

      if (tapState.current && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
        tapState.current.moved = true;
      }

      const id = dragState.current.stickerId;
      liveRefs.current.setPlacedStickers((prev) =>
        prev.map((s) => {
          if (s._id !== id) return s;
          return {
            ...s,
            x: Math.max(0, Math.min(nat.width - s.width, s.x + dx)),
            y: Math.max(0, Math.min(nat.height - s.height, s.y + dy)),
          };
        }),
      );
    }
  }, []);

  const handleTouchEnd = useCallback((e: any) => {
    const touches = e.nativeEvent.touches;
    const {
      activeDef: def,
      scaleRatio: sr,
      natural: nat,
      selectedId: selId,
      setPlacedStickers,
      setActiveDef,
      setSelectedId,
    } = liveRefs.current;

    if (touches.length < 2) {
      pinchState.current = null;
    }

    if (touches.length === 0) {
      const tap = tapState.current;
      tapState.current = null;
      dragState.current = null;

      if (!tap) return;

      if (def?.source) {
        const local = toLocal(tap.startX, tap.startY);
        const stripX = local.x / sr - def.width / 2;
        const stripY = local.y / sr - def.height / 2;
        setPlacedStickers((prev) => [
          ...prev,
          {
            _id: `s-${Date.now()}`,
            source: def.source!,
            color: def.color,
            x: Math.max(0, Math.min(nat.width - def.width, stripX)),
            y: Math.max(0, Math.min(nat.height - def.height, stripY)),
            width: def.width,
            height: def.height,
          },
        ]);
        setActiveDef(null);
        return;
      }

      if (!tap.moved) {
        const local = toLocal(tap.startX, tap.startY);
        const hit = hitTestSticker(local.x, local.y);
        if (hit) {
          setSelectedId(hit._id === selId ? null : hit._id);
        } else {
          setSelectedId(null);
        }
      }
    }
  }, []);

  const handleDelete = useCallback((id: string) => {
    setPlacedStickers((prev) => prev.filter((s) => s._id !== id));
    setSelectedId(null);
  }, []);

  const handleContinue = useCallback(() => {
    setStickers(
      "custom",
      placedStickers.map(({ _id: _, ...s }) => s as StickerConfig),
    );
    router.push("/exporter");
  }, [placedStickers, setStickers]);

  // ── Guard — after all hooks ──────────────────────────────────────────────

  if (!session.layout || !type || session.photos.length === 0) return null;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Add stickers"
        subtitle={
          activeDef
            ? "Tap the strip to place your sticker"
            : selectedId
              ? "Drag to move • pinch to resize & rotate"
              : "Pick a sticker, tap to place"
        }
        onBack={() => router.back()}
      />

      <PreviewSection>
        <PreviewSlide>
          <PreviewCard>
            <View
              ref={stripViewRef}
              onLayout={measureStrip}
              style={{ width: displayW, height: displayH }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <PhotoboothStrip
                type={type}
                images={session.photos}
                background={session.background}
                scaleRatio={scaleRatio}
                filterMatrix={session.filterMatrix}
                stickers={placedStickers}
                pointerEvents="none"
              />

              {placedStickers.map((s) => (
                <DraggableSticker
                  key={s._id}
                  sticker={s}
                  scaleRatio={scaleRatio}
                  selected={selectedId === s._id}
                  onDelete={handleDelete}
                />
              ))}

              {activeDef && (
                <View style={styles.placementOverlay} pointerEvents="none">
                  <Text style={styles.placementOverlayText}>Tap to place</Text>
                </View>
              )}
            </View>
          </PreviewCard>
        </PreviewSlide>
      </PreviewSection>

      <StickerPickerTray activeDef={activeDef} onSelect={setActiveDef} />

      <ScreenFooter
        label="Continue"
        onPress={handleContinue}
        accentColor={colors.accent}
      />
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  selectionBorder: {
    borderWidth: 1.5,
    borderColor: "#fff",
    borderRadius: 4,
    borderStyle: "dashed",
  },
  deleteButton: {
    position: "absolute",
    top: -14,
    right: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  controlLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    lineHeight: 16,
  },
  placementOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
    borderRadius: 12,
  },
  placementOverlayText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
