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
import { router } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { useSession } from "../context/session-context";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function layoutNameToType(name: string): LayoutType {
  return name.split(" ")[1] as LayoutType;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PhotoConfirmationScreen() {
  const { session } = useSession();
  const { layout, photos } = session;

  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  if (!layout) return null;

  const type = layoutNameToType(layout.name);
  const images = photos.map((uri) => ({ uri }));

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleCaptureSuccess = (uri: string) => {
    setPreviewUri(uri);
    setIsCapturing(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Confirm your photos"
        subtitle="Click on any of them to take a closer look"
      />

      {/* ── Preview (always visible) ── */}
      <PreviewSection>
        <PreviewSlide>
          <PreviewCard isLoading={isCapturing}>
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

      {/* ── Offscreen capture — drives previewUri ── */}
      <View style={styles.offscreen} pointerEvents="none">
        <PhotoboothStripExport
          type={type}
          images={images}
          background={session.background}
          width={CARD_WIDTH}
          autoCaptureOnMount
          onCaptureStart={() => setIsCapturing(true)}
          onCaptureSuccess={handleCaptureSuccess}
          onCaptureError={() => setIsCapturing(false)}
        />
      </View>

      <ScreenFooter
        label="Continue"
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
