import PhotoEditSheet from "@/components/photo-edit-sheet";
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
  ScreenFooter,
  ScreenHeader,
  ScreenInner,
} from "@/components/screen-layout";
import { colors } from "@/styles/theme";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSession } from "../context/session-context";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function layoutNameToType(name: string): LayoutType {
  return name.split(" ")[1] as LayoutType;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PhotoConfirmationScreen() {
  const { session, updatePhotoTransform } = useSession();
  const { layout, photos } = session;

  const insets = useSafeAreaInsets();

  if (!layout) return null;

  const type = layoutNameToType(layout.name);
  const images = photos.map((photo) => ({
    uri: photo.uri,
    transform: photo.transform,
  }));

  const natural = getStripNaturalSize(type);
  const scaleRatio = Math.min(
    CARD_WIDTH / natural.width,
    CARD_HEIGHT / natural.height,
  );

  const [editSheet, setEditSheet] = useState<{
    visible: boolean;
    index: number;
  }>({ visible: false, index: 0 });

  const closeSheet = () => setEditSheet((s) => ({ ...s, visible: false }));

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <ScreenInner style={{ backgroundColor: colors.bgMain }}>
        <ScreenHeader
          title="Confirm your photos"
          subtitle="Tap any photo to adjust it"
        />

        <PreviewSection>
          <PreviewSlide>
            <PreviewCard>
              <PhotoboothStrip
                type={type}
                images={images}
                background={session.background}
                scaleRatio={scaleRatio}
                onImagePress={(index) => {
                  setEditSheet({ visible: true, index });
                }}
              />
            </PreviewCard>
          </PreviewSlide>
        </PreviewSection>

        <ScreenFooter
          label="Continue"
          onPress={() => router.push("/filter-selection")}
          accentColor={colors.accent}
        />
      </ScreenInner>

      {editSheet.visible && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          <Pressable
            style={[StyleSheet.absoluteFillObject, styles.backdrop]}
            onPress={closeSheet}
          />
          <View style={styles.sheetWrapper} pointerEvents="box-none">
            <PhotoEditSheet
              uri={photos[editSheet.index]?.uri ?? null}
              index={editSheet.index}
              onCancel={closeSheet}
              onRetake={(i) => {
                closeSheet();
                router.push("/photo-capture");
              }}
              onConfirm={(i, transform) => {
                updatePhotoTransform(i, transform);
                closeSheet();
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgMain,
  },
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheetWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
});
