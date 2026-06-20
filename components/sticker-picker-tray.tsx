import { useCallback, useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

import { buttonStickers } from "@/assets/stickers";
import { colors, colors as themeColors } from "@/styles/theme";
import GridIcon from "./icons/grid-icon";
import { StickerSource } from "./photobooth-strip";
import PresetThumbnailTray, {
  THUMBNAIL_HEIGHT,
  THUMBNAIL_WIDTH,
  ThumbnailItem,
} from "./preset-thumbnail-tray";

// ─── Types ────────────────────────────────────────────────────────────────────
const ALL_STICKERS = [...buttonStickers] as const;

export type StickerId =
  | (typeof ALL_STICKERS)[number]["id"]
  | "none"
  | "star"
  | "custom";

export type StickerCategory = "stars" | "buttons";

export interface StickerOption {
  id: StickerId;
  label: string;
  width: number;
  height: number;
  source?: StickerSource;
  color?: string;
  previewImageSource?: any;
}

// ─── Category Definitions ─────────────────────────────────────────────────────

const CATEGORY_ORDER: StickerCategory[] = ["stars", "buttons"];
export const STICKERS_BY_CATEGORY: Record<StickerCategory, StickerOption[]> = {
  stars: [
    {
      id: "star",
      label: "Star",
      source: { kind: "image", source: require("@/assets/stickers/star.png") },
      width: 40,
      height: 40,
      previewImageSource: require("@/assets/stickers/star.png"),
    },
  ],
  buttons: buttonStickers.map((s) => ({
    ...s,
    width: 100,
    height: 100,
    source: s.source,
    previewImageSource: s.source.source,
  })),
};

// ─── Category Switch Button ───────────────────────────────────────────────────

function CategorySwitchThumbnail({ category }: { category: StickerCategory }) {
  return (
    <View style={styles.thumbnail}>
      <View style={styles.switchContainer}>
        <GridIcon size={35} color={themeColors.accent} />
      </View>
    </View>
  );
}

// ─── Sticker Thumbnail ────────────────────────────────────────────────────────

function StickerThumbnail({
  option,
  active,
}: {
  option: StickerOption;
  active: boolean;
}) {
  return (
    <View style={[styles.thumbnail, active && styles.thumbnailActive]}>
      <View style={[styles.imageContainer]}>
        {option.previewImageSource && (
          <Image
            source={option.previewImageSource}
            style={styles.previewImage}
            resizeMode="contain"
          />
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
  const [activeCategory, setActiveCategory] =
    useState<StickerCategory>("stars");

  const stickers = STICKERS_BY_CATEGORY[activeCategory];

  const activeIndex = activeDef
    ? stickers.findIndex((s) => s.id === activeDef.id) + 1
    : 0;

  const handleCycleCategory = useCallback(() => {
    setActiveCategory((prev) => {
      const idx = CATEGORY_ORDER.indexOf(prev);
      return CATEGORY_ORDER[(idx + 1) % CATEGORY_ORDER.length];
    });
    // Clear selection when switching categories
    onSelect(null);
  }, [onSelect]);

  const handleSelectSticker = useCallback(
    (index: number) => {
      if (index === 0) {
        handleCycleCategory();
        return;
      }
      const option = stickers[index - 1];
      if (!option) return;
      if (option.id === activeDef?.id) {
        onSelect(null);
      } else {
        onSelect(option);
      }
    },
    [stickers, activeDef, onSelect, handleCycleCategory],
  );

  const items: ThumbnailItem[] = [
    {
      id: "category-switch",
      accentColor: themeColors.accent,
      thumbnail: (
        <TouchableOpacity onPress={handleCycleCategory} activeOpacity={0.7}>
          <CategorySwitchThumbnail category={activeCategory} />
        </TouchableOpacity>
      ),
    },
    ...stickers.map((option, index) => ({
      id: option.id,
      accentColor: themeColors.accent,
      thumbnail: (
        <StickerThumbnail option={option} active={index + 1 === activeIndex} />
      ),
    })),
  ];

  return (
    <PresetThumbnailTray
      items={items}
      activeIndex={activeIndex}
      onSelect={handleSelectSticker}
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
    width: THUMBNAIL_WIDTH,
    height: THUMBNAIL_HEIGHT,
    overflow: "hidden",
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: {
    width: 48,
    height: 48,
  },
  stickerLabel: {
    fontSize: 10,
    color: "#aaa",
    textAlign: "center",
  },

  switchContainer: {
    width: THUMBNAIL_WIDTH,
    height: THUMBNAIL_HEIGHT,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: themeColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  switchLabel: {
    fontSize: 10,
    color: "#aaa",
    textAlign: "center",
  },
});
