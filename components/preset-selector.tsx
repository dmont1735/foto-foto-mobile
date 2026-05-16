import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { globalStyles } from "../styles/global";
import { colors } from "../styles/theme";
import PresetThumbnailTray, {
  THUMBNAIL_GAP,
  THUMBNAIL_WIDTH,
} from "./preset-thumbnail-tray";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PresetItem {
  id: string;
  label: string;
  preview: React.ReactNode;
  thumbnail: React.ReactNode;
  accentColor?: string;
}

export interface PresetSelectorProps {
  items: PresetItem[];
  onConfirm: (item: PresetItem) => void;
  initialIndex?: number;
  confirmLabel?: string;
  title?: string;
  subtitle?: string;
  theme?: Partial<typeof defaultTheme>;
}

// ─── Theme ────────────────────────────────────────────────────────────────────

const defaultTheme = {
  background: colors.bgMain,
  surface: colors.bgContainer,
  surfaceAlt: colors.bgCard,
  accent: colors.accent,
  textPrimary: colors.textMain,
  textSecondary: colors.bgHeader,
  border: colors.bgCardSelected,
  thumbnailBorder: colors.bgButtonOption,
  thumbnailActiveBorder: colors.accent,
  arrowBackground: colors.bgContainer,
  arrowIcon: colors.bgHeader,
  arrowDisabled: colors.bgButtonOption,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get("window");
export const CARD_WIDTH = SCREEN_WIDTH - 32;
export const CARD_HEIGHT = CARD_WIDTH * (4 / 3);

// ─── Arrow Button ─────────────────────────────────────────────────────────────

interface ArrowButtonProps {
  direction: "left" | "right";
  onPress: () => void;
  disabled?: boolean;
  theme: typeof defaultTheme;
}

const ArrowButton: React.FC<ArrowButtonProps> = ({
  direction,
  onPress,
  disabled,
  theme,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, {
      toValue: 0.86,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
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
        disabled={disabled}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={direction === "left" ? "Previous" : "Next"}
        style={[
          styles.arrowButton,
          {
            backgroundColor: disabled
              ? theme.arrowDisabled
              : theme.arrowBackground,
            borderColor: disabled ? "transparent" : `${theme.accent}40`,
          },
        ]}
      >
        <Ionicons
          name={direction === "left" ? "chevron-back" : "chevron-forward"}
          size={18}
          color={disabled ? "#3A3A48" : theme.arrowIcon}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const PresetSelector: React.FC<PresetSelectorProps> = ({
  items,
  onConfirm,
  initialIndex = 0,
  confirmLabel = "Continue",
  title,
  subtitle,
  theme: themeOverrides,
}) => {
  const theme = { ...defaultTheme, ...themeOverrides };
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList<PresetItem>>(null);
  const thumbnailScrollRef = useRef<ScrollView>(null);

  const activeItem = items[activeIndex] ?? items[0];
  const activeAccent = activeItem?.accentColor ?? theme.accent;

  // ── Sync helpers ──────────────────────────────────────────────────────────

  const scrollPreviewTo = useCallback((index: number) => {
    flatListRef.current?.scrollToOffset({
      offset: SCREEN_WIDTH * index,
      animated: true,
    });
  }, []);

  const scrollThumbnailIntoView = useCallback((index: number) => {
    const offset =
      index * (THUMBNAIL_WIDTH + THUMBNAIL_GAP) -
      SCREEN_WIDTH / 2 +
      THUMBNAIL_WIDTH / 2;
    thumbnailScrollRef.current?.scrollTo({
      x: Math.max(0, offset),
      animated: true,
    });
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= items.length) return;
      setActiveIndex(index);
      scrollPreviewTo(index);
      scrollThumbnailIntoView(index);
    },
    [items.length, scrollPreviewTo, scrollThumbnailIntoView],
  );

  // ── FlatList viewability ──────────────────────────────────────────────────

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        const index = viewableItems[0].index;
        setActiveIndex(index);
        scrollThumbnailIntoView(index);
      }
    },
    [scrollThumbnailIntoView],
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const handleConfirm = useCallback(() => {
    if (!activeItem) return;
    onConfirm(activeItem);
  }, [activeItem, onConfirm]);

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Header */}
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && (
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      )}

      {/* ── Preview (swipeable) ── */}
      <View style={styles.previewSection}>
        <FlatList
          ref={flatListRef}
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.previewSlide}>
              <View
                style={[
                  styles.previewCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: `${item.accentColor ?? theme.accent}30`,
                  },
                ]}
              >
                {item.preview}
              </View>
            </View>
          )}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig.current}
          contentContainerStyle={styles.previewListContent}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
        />

        {/* Left arrow */}
        <View style={[styles.arrowOverlay, styles.arrowLeft]}>
          <ArrowButton
            direction="left"
            onPress={() => goTo(activeIndex - 1)}
            disabled={activeIndex === 0}
            theme={theme}
          />
        </View>

        {/* Right arrow */}
        <View style={[styles.arrowOverlay, styles.arrowRight]}>
          <ArrowButton
            direction="right"
            onPress={() => goTo(activeIndex + 1)}
            disabled={activeIndex === items.length - 1}
            theme={theme}
          />
        </View>
      </View>

      {/* ── Bottom tray ── */}
      <PresetThumbnailTray
        items={items}
        activeIndex={activeIndex}
        onSelect={goTo}
        scrollRef={thumbnailScrollRef}
        theme={{
          accent: theme.accent,
          surface: theme.surfaceAlt,
          border: theme.border,
          thumbnailBorder: theme.thumbnailBorder,
          thumbnailActiveBorder: theme.thumbnailActiveBorder,
          background: theme.background,
        }}
      />

      {/* ── Continue button ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[globalStyles.button, { backgroundColor: activeAccent }]}
          onPress={handleConfirm}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={confirmLabel}
        >
          <Text style={globalStyles.buttonText}>{confirmLabel}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.4,
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
    textAlign: "center",
  },
  previewSection: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  previewListContent: {},
  previewSlide: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  previewCard: {
    flex: 1,
    width: CARD_WIDTH,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 52,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  arrowLeft: {
    left: 4,
  },
  arrowRight: {
    right: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  arrowButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowIcon: {
    fontSize: 18,
    fontWeight: "600",
  },
});

export default PresetSelector;
