import React, { useRef } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../styles/theme";

// ─── Constants ────────────────────────────────────────────────────────────────

export const THUMBNAIL_WIDTH = 52;
export const THUMBNAIL_HEIGHT = THUMBNAIL_WIDTH * (4 / 3);
export const THUMBNAIL_GAP = 10;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ThumbnailItem {
  id: string;
  thumbnail: React.ReactNode;
  accentColor?: string;
}

export interface ThumbnailTrayTheme {
  accent: string;
  surface: string;
  border: string;
  thumbnailBorder: string;
  thumbnailActiveBorder: string;
  background: string;
}

export interface PresetThumbnailTrayProps {
  items: ThumbnailItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
  /** Ref forwarded so the parent can call scrollTo() when activeIndex changes programmatically */
  scrollRef?: React.RefObject<ScrollView | null>;
  theme?: Partial<ThumbnailTrayTheme>;
}

// ─── Theme ────────────────────────────────────────────────────────────────────

const defaultTheme: ThumbnailTrayTheme = {
  accent: colors.accent,
  surface: colors.bgCard,
  border: colors.bgCardSelected,
  thumbnailBorder: colors.bgButtonOption,
  thumbnailActiveBorder: colors.accent,
  background: colors.bgMain,
};

// ─── Thumbnail ────────────────────────────────────────────────────────────────

interface ThumbnailProps {
  item: ThumbnailItem;
  isActive: boolean;
  onPress: () => void;
  theme: typeof defaultTheme;
}

const Thumbnail: React.FC<ThumbnailProps> = ({
  item,
  isActive,
  onPress,
  theme,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const accent = item.accentColor ?? theme.accent;

  const handlePressIn = () =>
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();

  const handlePressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={`Select item ${item.id}`}
        accessibilityState={{ selected: isActive }}
      >
        <View
          style={[
            styles.thumbnail,
            {
              borderColor: isActive ? accent : theme.thumbnailBorder,
              borderWidth: isActive ? 2 : 1,
              backgroundColor: theme.surface,
            },
          ]}
        >
          {item.thumbnail}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const PresetThumbnailTray: React.FC<PresetThumbnailTrayProps> = ({
  items,
  activeIndex,
  onSelect,
  scrollRef,
  theme: themeOverrides,
}) => {
  const theme = { ...defaultTheme, ...themeOverrides };
  const internalRef = useRef<ScrollView | null>(null);
  const resolvedRef = scrollRef ?? internalRef;

  return (
    <View
      style={[
        styles.tray,
        { borderTopColor: theme.border, backgroundColor: theme.background },
      ]}
    >
      <ScrollView
        ref={resolvedRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.trayContent}
      >
        {items.map((item, index) => (
          <View
            key={item.id}
            style={{
              marginRight: index < items.length - 1 ? THUMBNAIL_GAP : 0,
            }}
          >
            <Thumbnail
              item={item}
              isActive={index === activeIndex}
              onPress={() => onSelect(index)}
              theme={theme}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tray: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
    paddingTop: 10,
  },
  trayContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  thumbnail: {
    width: THUMBNAIL_WIDTH,
    height: THUMBNAIL_HEIGHT,
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default PresetThumbnailTray;
