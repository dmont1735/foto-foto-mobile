import { router } from "expo-router";
import { useState } from "react";

import ColorPickerTray, { ColorOption } from "@/components/color-picker-tray";
import CustomColorCard from "@/components/custom-color-card";
import PhotoboothStrip, {
  getStripNaturalSize,
  LayoutType,
} from "@/components/photobooth-strip";
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
import { useSession } from "../context/session-context";

// ─── Palette ──────────────────────────────────────────────────────────────────

export const PALETTE: ColorOption[] = [
  { id: "rose", color: colors.defaultBackgroundColor, label: "Red" },
  { id: "amber", color: "#FFAA33", label: "Amber" },
  { id: "sage", color: "#6BCB77", label: "Sage" },
  { id: "sky", color: "#4D96FF", label: "Sky" },
  { id: "violet", color: "#9B72CF", label: "Violet" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function layoutNameToType(name: string): LayoutType {
  return name.split(" ")[1] as LayoutType;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ColorSelectionScreen() {
  const { session, setBackgroundColor } = useSession();
  const { layout, photos } = session;

  // Derive safely before hooks
  const type = layout ? layoutNameToType(layout.name) : null;
  const natural = type ? getStripNaturalSize(type) : { width: 1, height: 1 };
  const scaleRatio = type
    ? Math.min(CARD_WIDTH / natural.width, CARD_HEIGHT / natural.height)
    : 1;

  // ── Hooks — all unconditionally above any guard ──────────────────────────

  const [customPickerVisible, setCustomPickerVisible] = useState(false);

  // ── Guard — after all hooks ──────────────────────────────────────────────

  if (!layout || !type) return null;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleColorChange = (opt: ColorOption) => {
    if (opt.id === "custom") {
      setCustomPickerVisible(true);
      return;
    }
    setBackgroundColor(opt.color, natural.width, natural.height);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Choose a color"
        subtitle="Pick the tone that matches your strip."
        onBack={() => router.back()}
      />

      <PreviewSection>
        <PreviewSlide>
          <PreviewCard>
            <PhotoboothStrip
              type={type}
              images={photos}
              background={session.background}
              scaleRatio={scaleRatio}
            />
          </PreviewCard>
        </PreviewSlide>
      </PreviewSection>

      <ColorPickerTray
        colors={PALETTE}
        initialIndex={0}
        onColorChange={handleColorChange}
        theme={{
          background: colors.bgCard,
          border: colors.accent,
          swatchBorder: colors.accent,
        }}
        onRequestCustomColor={() => {
          setCustomPickerVisible(true);
        }}
      />

      <CustomColorCard
        visible={customPickerVisible}
        initialColor={colors.defaultBackgroundColor}
        onClose={() => setCustomPickerVisible(false)}
        onSubmit={(color) => {
          setBackgroundColor(color, natural.width, natural.height);
        }}
      />

      <ScreenFooter
        label="Use this color"
        onPress={() => router.push("/photo-capture")}
        accentColor={colors.accent}
      />
    </ScreenContainer>
  );
}
