import FilteredImage from "@/components/filtered-image";
import { FILTERS, PhotoFilter, useSession } from "@/context/session-context";
import { colors as themeColors } from "@/styles/theme";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import PresetThumbnailTray, { ThumbnailItem } from "./preset-thumbnail-tray";

// ─── Filter Definitions ──────────────────────────────────────────────────────

const FILTER_OPTIONS: {
  id: PhotoFilter;
  label: string;
}[] = [
  { id: "none", label: "Original" },
  { id: "bw", label: "B&W" },
  { id: "sepia", label: "Sepia" },
  { id: "vivid", label: "Vivid" },
  { id: "warm", label: "Warm" },
  { id: "cool", label: "Cool" },
];

// ─── Thumbnail ───────────────────────────────────────────────────────────────

function FilterThumbnail({
  uri,
  matrix,
  label,
  active,
}: {
  uri?: string;
  matrix: number[];
  label: string;
  active: boolean;
}) {
  return (
    <View style={[styles.thumbnail, active && styles.thumbnailActive]}>
      {uri ? (
        <View style={styles.imageContainer}>
          <FilteredImage uri={uri} matrix={matrix} width={72} height={72} />
        </View>
      ) : (
        <View style={styles.imagePlaceholder} />
      )}

      {/* <Text style={[styles.label, active && styles.labelActive]}>{label}</Text> */}
    </View>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function FilterPickerTray() {
  const { session, setFilter } = useSession();

  const activeIndex = FILTER_OPTIONS.findIndex((f) => f.id === session.filter);

  const previewUri = session.photos[0].uri;

  const items: ThumbnailItem[] = FILTER_OPTIONS.map((filter, index) => ({
    id: filter.id,
    accentColor: themeColors.accent,
    thumbnail: (
      <FilterThumbnail
        uri={previewUri}
        matrix={FILTERS[filter.id]}
        label={filter.label}
        active={index === activeIndex}
      />
    ),
  }));

  const handleSelect = useCallback(
    (index: number) => {
      const filter = FILTER_OPTIONS[index];

      if (!filter) {
        return;
      }

      setFilter(filter.id);
    },
    [setFilter],
  );

  return (
    <PresetThumbnailTray
      items={items}
      activeIndex={activeIndex}
      onSelect={handleSelect}
    />
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

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
  },

  imagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: "#333",
    marginBottom: 6,
  },

  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
    textAlign: "center",
  },

  labelActive: {
    color: "#fff",
  },
});
