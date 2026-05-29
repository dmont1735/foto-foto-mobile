import BackgroundImageTray, {
  BackgroundImageOption,
} from "@/components/background-picker-tray";
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
import { StripBackground } from "@/utils/strip-layouts";
import { useBackgroundImagePicker } from "@/utils/use-background-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { useSession } from "../context/session-context";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function layoutNameToType(name: string): LayoutType {
  return name.split(" ")[1] as LayoutType;
}

function backgroundFromOption(opt: BackgroundImageOption): StripBackground {
  if (opt.type === "svg") {
    return { type: "svg", component: opt.component, color: opt.color };
  }
  return { type: "image", source: opt.source };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DesignSelectionScreen() {
  const { session, setBackground } = useSession();
  const { layout, photos } = session;

  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const imagePicker = useBackgroundImagePicker();

  if (!layout) return null;

  const type = layoutNameToType(layout.name);
  const images = photos.map((uri) => ({ uri }));

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleImageSelect = (opt: BackgroundImageOption) => {
    imagePicker.selectImage(opt);
    setIsCapturing(true);
    setBackground(backgroundFromOption(opt));
  };

  const handleRequestCustomImage = () => {
    imagePicker.requestCustomImage((source) => {
      const newOpt = imagePicker.addCustomImage(source);
      setIsCapturing(true);
      setBackground(backgroundFromOption(newOpt));
    });
  };

  const handleCaptureSuccess = (uri: string) => {
    setPreviewUri(uri);
    setIsCapturing(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Choose a design"
        subtitle="Pick background that sets the mood."
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

      <BackgroundImageTray
        presets={imagePicker.presets}
        customImages={imagePicker.customImages}
        onRequestCustomImage={handleRequestCustomImage}
        color={colors.defaultBackgroundColor}
        accentColor={colors.accent}
        activeId={null}
        onSelect={handleImageSelect}
      />

      <ScreenFooter
        label="Use this design"
        onPress={() => router.push("/color-selection")}
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
