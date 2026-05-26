import { router } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";

import ColorPickerTray, { ColorOption } from "@/components/color-picker-tray";
import CustomColorCard from "@/components/custom-color-card";
import { LayoutType } from "@/components/photobooth-strip";
import {
    CARD_WIDTH,
    PreviewCard,
    PreviewSection,
    PreviewSlide,
    ScreenContainer,
    ScreenFooter,
    ScreenHeader,
} from "@/components/screen-layout";
import { colors } from "@/styles/theme";
import PhotoboothStripExport from "@/utils/photobooth-strip-export";
import { useSession } from "../context/session-context";

// ─── Palette ──────────────────────────────────────────────────────────────────

const PALETTE: ColorOption[] = [
  { id: "rose", color: "#FF6B6B", label: "Rose" },
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

  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [customPickerVisible, setCustomPickerVisible] = useState(false);

  if (!layout) return null;

  const type = layoutNameToType(layout.name);

  const images = photos.map((uri) => ({ uri }));

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleColorChange = (opt: ColorOption) => {
    if (opt.id === "custom") {
      setCustomPickerVisible(true);
      return;
    }

    setBackgroundColor(opt.color);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Choose a colour"
        subtitle="Pick the tone that matches your strip."
      />

      {/* ── Preview ── */}
      <PreviewSection>
        <PreviewSlide>
          <PreviewCard>
            {previewUri ? (
              <Image
                source={{ uri: previewUri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.skeleton} />
            )}
          </PreviewCard>
        </PreviewSlide>
      </PreviewSection>

      {/* ── Offscreen renderer ── */}
      <View style={styles.offscreen} pointerEvents="none">
        <PhotoboothStripExport
          type={type}
          images={images}
          background={session.background}
          width={CARD_WIDTH}
          autoCaptureOnMount
          onCaptureSuccess={setPreviewUri}
        />
      </View>

      {/* ── Color tray ── */}
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
          setBackgroundColor(color);
        }}
      />

      <ScreenFooter
        label="Use this colour"
        onPress={() => router.push("/")}
        accentColor={colors.accent}
      />
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  previewImage: {
    width: "100%",
    height: "100%",
  },
  skeleton: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.bgButtonOption,
    opacity: 0.4,
  },
  offscreen: {
    position: "absolute",
    top: -9999,
    left: -9999,
    opacity: 0,
  },
});
