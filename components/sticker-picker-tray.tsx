import { useCallback } from "react";
import { Image, StyleSheet, View } from "react-native";

import { colors as themeColors } from "@/styles/theme";
import { StickerSource } from "./photobooth-strip";
import PresetThumbnailTray, { ThumbnailItem } from "./preset-thumbnail-tray";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StickerId = "none" | "custom" | "star";

export interface StickerOption {
  id: StickerId;
  label: string;
  width: number;
  height: number;
  source?: StickerSource;
  color?: string;
  previewImageSource?: any;
}

// ─── Sticker Definitions ──────────────────────────────────────────────────────

export const STICKER_OPTIONS: StickerOption[] = [
  {
    id: "none",
    label: "None",
    width: 0,
    height: 0,
  },
  {
    id: "star",
    label: "Star",
    source: {
      kind: "image",
      source: require("@/assets/stickers/star.png"),
    },
    width: 40,
    height: 40,
    previewImageSource: require("@/assets/stickers/star.png"),
  },
];

// ─── Thumbnail ────────────────────────────────────────────────────────────────

function StickerThumbnail({
  option,
  active,
}: {
  option: StickerOption;
  active: boolean;
}) {
  return (
    <View style={[styles.thumbnail, active && styles.thumbnailActive]}>
      <View
        style={[
          styles.imageContainer,
          !option.previewImageSource && styles.noneContainer,
        ]}
      >
        {option.previewImageSource ? (
          <Image
            source={option.previewImageSource}
            style={styles.previewImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.noneLine} />
        )}
      </View>
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StickerPickerTray({
  activeDef,
  onSelect,
}: {
  activeDef: StickerOption | null;
  onSelect: (def: StickerOption | null) => void;
}) {
  const activeIndex = STICKER_OPTIONS.findIndex(
    (s) => s.id === (activeDef?.id ?? "none"),
  );

  const items: ThumbnailItem[] = STICKER_OPTIONS.map((option, index) => ({
    id: option.id,
    accentColor: themeColors.accent,
    thumbnail: (
      <StickerThumbnail option={option} active={index === activeIndex} />
    ),
  }));

  const handleSelect = useCallback(
    (index: number) => {
      const option = STICKER_OPTIONS[index];
      if (!option) return;
      if (option.id === "none" || option.id === activeDef?.id) {
        onSelect(null);
      } else {
        onSelect(option);
      }
    },
    [activeDef, onSelect],
  );

  return (
    <PresetThumbnailTray
      items={items}
      activeIndex={activeIndex}
      onSelect={handleSelect}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  thumbnail: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  thumbnailActive: {
    opacity: 1,
  },
  imageContainer: {
    width: 72,
    height: 72,
    overflow: "hidden",
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: {
    width: 48,
    height: 48,
  },
  noneContainer: {
    backgroundColor: "#1a1a1a",
  },
  noneLine: {
    width: 36,
    height: 2,
    backgroundColor: "#555",
    borderRadius: 1,
    transform: [{ rotate: "45deg" }],
  },
});
