import PresetThumbnailTray, {
  THUMBNAIL_HEIGHT,
  THUMBNAIL_WIDTH,
  ThumbnailItem,
} from "@/components/preset-thumbnail-tray";
import { colors } from "@/styles/theme";
import React, { ReactNode } from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import GalleryAddIcon from "./icons/gallery-add-icon";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BackgroundImageOption =
  | {
      id: string;
      type: "image";
      source: ImageSourcePropType;
      label: string;
      isCustom?: boolean;
    }
  | {
      id: string;
      type: "svg";
      component: React.FC<{ color: string; width: number; height: number }>;
      color: string;
      label: string;
    };

export interface BackgroundImageTrayProps {
  presets: BackgroundImageOption[];
  customImages: BackgroundImageOption[];
  activeId: string | null;
  color: string;
  accentColor?: string;
  leadingItem?: ReactNode;
  onSelect: (option: BackgroundImageOption) => void;
  onRequestCustomImage: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ADD_PHOTO_ID = "__add_photo__";
const MODE_SWITCH_ID = "__mode_switch__";

// ─── Thumbnails ───────────────────────────────────────────────────────────────

const AddPhotoThumbnail: React.FC<{ accent: string; onPress: () => void }> = ({
  accent,
  onPress,
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.75}
    style={[styles.addThumbnail, { borderColor: accent }]}
    accessibilityRole="button"
    accessibilityLabel="Add a custom background photo"
  >
    <GalleryAddIcon size={35} color={colors.accent} />
  </TouchableOpacity>
);

const ImageThumbnailContent: React.FC<{ source: ImageSourcePropType }> = ({
  source,
}) => (
  <Image source={source} style={styles.thumbnailImage} resizeMode="cover" />
);

const SvgThumbnailContent: React.FC<{
  color: string;
  component: React.FC<{ color: string; width: number; height: number }>;
}> = ({ color, component: SvgComponent }) => (
  <SvgComponent
    color={color}
    width={THUMBNAIL_WIDTH}
    height={THUMBNAIL_HEIGHT}
  />
);

// ─── Component ────────────────────────────────────────────────────────────────

const BackgroundImageTray: React.FC<BackgroundImageTrayProps> = ({
  presets,
  customImages,
  activeId,
  color,
  accentColor,
  leadingItem,
  onSelect,
  onRequestCustomImage,
}) => {
  const accent = accentColor ?? colors.accent;
  const allOptions = [...customImages, ...presets];

  const leadingTrayItems: ThumbnailItem[] = leadingItem
    ? [
        {
          id: MODE_SWITCH_ID,
          thumbnail: leadingItem,
        },
      ]
    : [];

  const addPhotoItem: ThumbnailItem = {
    id: ADD_PHOTO_ID,
    thumbnail: (
      <AddPhotoThumbnail accent={accent} onPress={onRequestCustomImage} />
    ),
  };

  const imageThumbnailItems: ThumbnailItem[] = allOptions.map((opt) => ({
    id: opt.id,
    accentColor: accent,
    thumbnail:
      opt.type === "svg" ? (
        <SvgThumbnailContent color={color} component={opt.component} />
      ) : (
        <ImageThumbnailContent source={opt.source} />
      ),
  }));

  const trayItems: ThumbnailItem[] = [
    ...leadingTrayItems,
    addPhotoItem,
    ...imageThumbnailItems,
  ];

  const offset = (leadingItem ? 1 : 0) + 1;

  const activeIndex =
    activeId === null
      ? -1
      : allOptions.findIndex((opt) => opt.id === activeId) + offset;

  const handleSelect = (index: number) => {
    const addPhotoIndex = leadingItem ? 1 : 0;

    if (leadingItem && index === 0) {
      return;
    }

    if (index === addPhotoIndex) {
      onRequestCustomImage();
      return;
    }

    const optionIndex = index - offset;

    onSelect(allOptions[optionIndex]);
  };

  return (
    <PresetThumbnailTray
      items={trayItems}
      activeIndex={activeIndex}
      onSelect={handleSelect}
      theme={{ accent }}
    />
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  addThumbnail: {
    width: THUMBNAIL_WIDTH,
    height: THUMBNAIL_HEIGHT,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  addIcon: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: "300",
  },
  addLabel: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
});

export default BackgroundImageTray;
