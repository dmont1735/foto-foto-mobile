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
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useSession } from "../context/session-context";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function layoutNameToType(name: string): LayoutType {
  return name.split(" ")[1] as LayoutType;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionStatus = "idle" | "busy" | "done";

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ExporterScreen() {
  const { session, resetSession } = useSession();
  const skiaRef = useRef<SkiaStripExportHandle>(null);

  // Derive type safely so all hooks below run unconditionally
  const type = session.layout ? layoutNameToType(session.layout.name) : null;

  const [bgReady, setBgReady] = useState(session.background?.type !== "svg");
  const [canvasReady, setCanvasReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<ActionStatus>("idle");
  const [shareStatus, setShareStatus] = useState<ActionStatus>("idle");

  useEffect(() => {
    if (!type) return;

    const bg = session.background;
    if (bg?.type !== "svg") return;

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
        bg.pngUri = uri;
        setBgReady(true);
      })
      .catch(() => setBgReady(true));
  }, [type]);

  // ── Shared capture primitive ─────────────────────────────────────────────

  const captureToTempFile = useCallback(async (): Promise<string> => {
    const dataUri = skiaRef.current?.capture();
    if (!dataUri) throw new Error("Capture failed");

    const base64 = dataUri.replace("data:image/png;base64,", "");
    const tmpPath = `${FileSystem.cacheDirectory}photobooth-export.png`;
    await FileSystem.writeAsStringAsync(tmpPath, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return tmpPath;
  }, []);

  // ── Save to library ──────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    setSaveStatus("busy");
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Please allow access to your photo library to save the strip.",
        );
        setSaveStatus("idle");
        return;
      }

      const tmpPath = await captureToTempFile();
      await MediaLibrary.saveToLibraryAsync(tmpPath);
      setSaveStatus("done");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      Alert.alert("Error", "Could not save to gallery. Please try again.");
      setSaveStatus("idle");
    }
  }, [captureToTempFile]);

  // ── Share via sheet ──────────────────────────────────────────────────────

  const handleShare = useCallback(async () => {
    setShareStatus("busy");
    try {
      const tmpPath = await captureToTempFile();
      await Sharing.shareAsync(tmpPath, {
        mimeType: "image/png",
        dialogTitle: "Share your photobooth strip",
      });
      setShareStatus("done");
      setTimeout(() => setShareStatus("idle"), 2000);
    } catch {
      Alert.alert("Error", "Could not share. Please try again.");
      setShareStatus("idle");
    }
  }, [captureToTempFile]);

  // ── Reset ────────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    router.replace("/");
    // Reset after navigation has begun so this screen doesn't re-render with null session
    setTimeout(() => resetSession(), 0);
  }, [resetSession]);

  // ── Guard — after all hooks, before render ───────────────────────────────

  if (!type) return null;

  const natural = getStripNaturalSize(type);
  const scaleRatio = Math.min(
    CARD_WIDTH / natural.width,
    CARD_HEIGHT / natural.height,
  );

  const isAnythingBusy = saveStatus === "busy" || shareStatus === "busy";

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <ScreenContainer>
      <ScreenHeader title="Share your creation" />

      <PreviewSection>
        <PreviewSlide>
          <PreviewCard isLoading={isAnythingBusy}>
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
        accentColor={colors.accent}
        actions={[
          {
            label:
              saveStatus === "busy"
                ? "Saving..."
                : saveStatus === "done"
                  ? "✓ Saved"
                  : "Save",
            onPress: handleSave,
            variant: "secondary",
            disabled: saveStatus !== "idle",
          },
          {
            label:
              shareStatus === "busy"
                ? "Opening..."
                : shareStatus === "done"
                  ? "✓ Done"
                  : "Share",
            onPress: handleShare,
            variant: "primary",
            disabled: shareStatus !== "idle",
          },
        ]}
      />
      <ScreenFooter
        accentColor={colors.accent}
        label="Return to Start"
        onPress={handleReset}
      />

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
          />
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  // retained for future use; local layout styles can be added here
});
