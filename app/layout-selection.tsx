import { router } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import PresetSelector, {
  CARD_HEIGHT,
  CARD_WIDTH,
  PresetItem,
} from "../components/preset-selector";
import { useSession } from "../context/session-context";
import { colors } from "../styles/theme";
import { getAllLayouts, Layout } from "../utils/strip-layouts";

// ─── Slot grid preview ────────────────────────────────────────────────────────

interface LayoutPreviewProps {
  layout: Layout;
}

export const LayoutPreview: React.FC<LayoutPreviewProps> = ({ layout }) => {
  const isLandscape = layout.orientation === "landscape";
  const imageHeight = CARD_HEIGHT * 0.92;
  const imageWidth = isLandscape ? CARD_WIDTH * 0.96 : CARD_WIDTH * 0.72;

  return (
    <View style={styles.previewWrapper}>
      <Image
        source={layout.source}
        style={{ width: imageWidth, height: imageHeight }}
        resizeMode="contain"
      />
      <View style={styles.previewBadgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{layout.numberOfSlots} slots</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{layout.orientation}</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Slot grid thumbnail ──────────────────────────────────────────────────────

interface LayoutThumbnailProps {
  layout: Layout;
}

const LayoutThumbnail: React.FC<LayoutThumbnailProps> = ({ layout }) => (
  <Image
    source={layout.source}
    style={styles.thumbnailImage}
    resizeMode="contain"
  />
);

// ─── Mapper ───────────────────────────────────────────────────────────────────

function layoutToPresetItem(layout: Layout): PresetItem {
  return {
    id: layout.name,
    label: layout.name,
    accentColor: colors.accent,
    preview: <LayoutPreview layout={layout} />,
    thumbnail: <LayoutThumbnail layout={layout} />,
  };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LayoutSelectionScreen() {
  const { setLayout } = useSession();
  const layouts = getAllLayouts();
  const items: PresetItem[] = layouts.map(layoutToPresetItem);

  const handleConfirm = (item: PresetItem) => {
    const layout = layouts.find((l) => l.name === item.id);
    if (!layout) return;
    setLayout(layout);
    router.push("/design-selection");
  };

  return (
    <PresetSelector
      items={items}
      title="Choose a layout"
      subtitle="Pick the strip style that fits your shoot."
      confirmLabel="Use this layout"
      onConfirm={(item) => handleConfirm(item)}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  previewWrapper: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  previewBadgeRow: {
    // position: "absolute",
    bottom: -10,
    // left: 8,
    flexDirection: "row",
    // justifyContent: "center",
    gap: 4,
  },
  badge: {
    backgroundColor: `${colors.bgButtonOption}dd`,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.bgHeader,
    fontSize: 10,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
});
