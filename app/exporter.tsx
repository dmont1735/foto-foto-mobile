import PhotoboothStrip, {
    LayoutType,
    getStripNaturalSize,
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
import PhotoboothStripSkiaExport, {
    SkiaStripExportHandle,
} from "@/utils/photobooth-strip-skia-export";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useSession } from "../context/session-context";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function layoutNameToType(name: string): LayoutType {
  return name.split(" ")[1] as LayoutType;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ExporterScreen() {
  const { session } = useSession();
  const skiaRef = useRef<SkiaStripExportHandle>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ── Pre-generate SVG background PNG ────────────────────────────────────────
  const [bgReady, setBgReady] = useState(
    session.background?.type !== "svg", // non-SVG backgrounds are immediately ready
  );
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    const bg = session.background;
    if (bg?.type !== "svg") return;

    // Already generated — nothing to do
    if (bg.pngUri) {
      setBgReady(true);
      return;
    }

    if (!bg.generatePngUri) {
      setBgReady(true);
      return;
    }

    const { width, height } = getStripNaturalSize(type);
    bg.generatePngUri(width, height)
      .then((uri) => {
        bg.pngUri = uri; // cache onto the object for future screens
        setBgReady(true);
      })
      .catch(() => setBgReady(true)); // fail open — export without bg rather than blocking
  }, []);

  const handleSave = useCallback(async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Please allow access to your photo library to save the strip.",
      );
      return;
    }

    const dataUri = skiaRef.current?.capture();
    if (!dataUri) {
      Alert.alert("Error", "Could not capture the strip. Please try again.");
      return;
    }

    setIsSaving(true);
    try {
      // Write base64 to a temp file then save to the media library
      const base64 = dataUri.replace("data:image/png;base64,", "");
      const tmpPath = `${FileSystem.cacheDirectory}strip-export.png`;
      await FileSystem.writeAsStringAsync(tmpPath, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await MediaLibrary.saveToLibraryAsync(tmpPath);
      Alert.alert("Saved!", "Your photo strip has been saved to your photos.");
    } catch {
      Alert.alert(
        "Error",
        "Something went wrong while saving. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }, []);

  if (!session.layout) return null;

  const type = layoutNameToType(session.layout.name);

  const natural = getStripNaturalSize(type);
  const scaleRatio = Math.min(
    CARD_WIDTH / natural.width,
    CARD_HEIGHT / natural.height,
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <ScreenContainer>
      <ScreenHeader title="Share your creation" />
      <PreviewSection>
        <PreviewSlide>
          <PreviewCard isLoading={isSaving}>
            {/* Visible preview — unchanged, uses scaleRatio as before */}
            <PhotoboothStrip
              type={type}
              images={session.photos}
              background={session.background}
              scaleRatio={scaleRatio}
              filterMatrix={session.filterMatrix}
              stickers={session.stickers}
              pointerEvents="none"
            />
          </PreviewCard>
        </PreviewSlide>
      </PreviewSection>

      <ScreenFooter
        label={isSaving ? "Saving..." : "Save to gallery"}
        onPress={handleSave}
        accentColor={colors.accent}
      />

      {/*
       * Skia canvas mounted off-screen at natural size.
       * makeImageSnapshot() is synchronous and doesn't depend on the
       * native compositor, so placement doesn't matter — it renders
       * directly into GPU memory.
       */}
      {bgReady && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: natural.width,
            height: natural.height,
            opacity: 0,
          }}
        >
          <PhotoboothStripSkiaExport
            ref={skiaRef}
            type={type}
            images={session.photos}
            background={session.background}
            filterMatrix={session.filterMatrix}
            stickers={session.stickers}
            onReady={() => setCanvasReady(true)}
            // logo={session.logo}
          />
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  offscreen: {
    position: "absolute",
    top: -9999,
    left: -9999,
    opacity: 0,
  },
});
