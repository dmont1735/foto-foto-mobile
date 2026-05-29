import { colors as themeColors } from "@/styles/theme";
import React, { ReactNode, useCallback, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import PaletteIcon from "./icons/palette-icon";
import PresetThumbnailTray, {
  THUMBNAIL_HEIGHT,
  THUMBNAIL_WIDTH,
  ThumbnailItem,
} from "./preset-thumbnail-tray";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ColorOption {
  id: string;
  color: string;
  label?: string;
}

export interface ColorPickerTrayProps {
  colors: ColorOption[];
  onColorChange: (color: ColorOption) => void;
  onRequestCustomColor: () => void;
  initialIndex?: number;
  leadingItem?: ReactNode;
  accentColor?: string;
  theme?: {
    background?: string;
    border?: string;
    swatchBorder?: string;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CUSTOM_COLOR_ID = "__custom_color__";
const MODE_SWITCH_ID = "__mode_switch__";

// ─── Swatch thumbnail ─────────────────────────────────────────────────────────

const ColorSwatch: React.FC<{ color: string; isActive: boolean }> = ({
  color,
  isActive,
}) => (
  <View style={[styles.swatch, { backgroundColor: color }]}>
    {isActive && <View style={styles.swatchDot} />}
  </View>
);

// ─── Custom color thumbnail ───────────────────────────────────────────────────

const CustomColorThumbnail: React.FC<{
  accent: string;
  onPress: () => void;
}> = ({ accent, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.75}
    style={[styles.customThumbnail, { borderColor: accent }]}
    accessibilityRole="button"
    accessibilityLabel="Pick a custom color"
  >
    <PaletteIcon size={40} color={accent} />
  </TouchableOpacity>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toThumbnailItems(
  colorOptions: ColorOption[],
  activeIndex: number,
): ThumbnailItem[] {
  return colorOptions.map((opt, i) => ({
    id: opt.id,
    accentColor: opt.color,
    thumbnail: <ColorSwatch color={opt.color} isActive={i === activeIndex} />,
  }));
}

// ─── Main Component ───────────────────────────────────────────────────────────

const ColorPickerTray: React.FC<ColorPickerTrayProps> = ({
  colors: colorOptions,
  onColorChange,
  onRequestCustomColor,
  initialIndex = 0,
  leadingItem,
  accentColor,
  theme,
}) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const accent = accentColor ?? themeColors.accent;

  const colorItems = toThumbnailItems(colorOptions, activeIndex);

  const leadingTrayItems: ThumbnailItem[] = leadingItem
    ? [
        {
          id: MODE_SWITCH_ID,
          thumbnail: leadingItem,
        },
      ]
    : [];

  const customColorItem: ThumbnailItem = {
    id: CUSTOM_COLOR_ID,
    thumbnail: (
      <CustomColorThumbnail accent={accent} onPress={onRequestCustomColor} />
    ),
  };

  const items: ThumbnailItem[] = [
    ...leadingTrayItems,
    customColorItem,
    ...colorItems,
  ];

  const offset = (leadingItem ? 1 : 0) + 1;

  const handleSelect = useCallback(
    (index: number) => {
      const customColorIndex = leadingItem ? 1 : 0;

      // Leading item
      if (leadingItem && index === 0) {
        return;
      }

      // Custom color action
      if (index === customColorIndex) {
        onRequestCustomColor();
        return;
      }

      const colorIndex = index - offset;

      if (colorIndex < 0 || colorIndex >= colorOptions.length) {
        return;
      }

      setActiveIndex(colorIndex);
      onColorChange(colorOptions[colorIndex]);
    },
    [colorOptions, leadingItem, offset, onColorChange, onRequestCustomColor],
  );

  return (
    <PresetThumbnailTray
      items={items}
      activeIndex={activeIndex < 0 ? -1 : activeIndex + offset}
      onSelect={handleSelect}
      theme={{
        background: theme?.background,
        border: theme?.border,
        thumbnailBorder: theme?.swatchBorder,
      }}
    />
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  swatch: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  swatchDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.85)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },

  customThumbnail: {
    width: THUMBNAIL_WIDTH,
    height: THUMBNAIL_HEIGHT,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },

  customIcon: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: "300",
  },

  customLabel: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.2,
    textAlign: "center",
  },
});

export default ColorPickerTray;
