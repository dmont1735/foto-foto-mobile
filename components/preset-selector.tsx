import PresetThumbnailTray, {
  THUMBNAIL_GAP,
  THUMBNAIL_WIDTH,
} from "@/components/preset-thumbnail-tray";
import {
  CARD_WIDTH,
  SCREEN_WIDTH,
  ScreenFooter,
  ScreenHeader,
  ScreenInner,
  sharedStyles,
} from "@/components/screen-layout";
import React, { useCallback, useRef, useState } from "react";
import {
  FlatList,
  ScrollView,
  View,
  ViewToken
} from "react-native";
import { colors } from "../styles/theme";

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

// Re-export so callers that previously imported from here still work.
export { CARD_WIDTH, SCREEN_WIDTH };
export const CARD_HEIGHT = CARD_WIDTH * (4 / 3);

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

  // ScreenInner = plain flex:1 View — the parent screen owns the SafeAreaView.
  return (
    <ScreenInner style={{ backgroundColor: theme.background }}>
      {/* Header */}
      {(title || subtitle) && (
        <ScreenHeader title={title ?? ""} subtitle={subtitle} />
      )}

      {/* ── Preview (swipeable) ── */}
      <View style={sharedStyles.previewSection}>
        <FlatList
          ref={flatListRef}
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={sharedStyles.previewSlide}>
              <View
                style={[
                  sharedStyles.previewCard,
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
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
        />
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
      <ScreenFooter
        label={confirmLabel}
        onPress={handleConfirm}
        accentColor={activeAccent}
      />
    </ScreenInner>
  );
};

export default PresetSelector;
