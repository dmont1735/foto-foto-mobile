import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { colors } from "../styles/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PresetPreviewProps {
  children: React.ReactNode;
  accentColor?: string;
  theme?: Partial<PresetPreviewTheme>;
}

export interface PresetPreviewTheme {
  surface: string;
  accent: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get("window");
export const PREVIEW_CARD_WIDTH = SCREEN_WIDTH - 32;
export const PREVIEW_CARD_HEIGHT = PREVIEW_CARD_WIDTH * (4 / 3);

const defaultTheme: PresetPreviewTheme = {
  surface: colors.bgContainer,
  accent: colors.accent,
};

// ─── Component ────────────────────────────────────────────────────────────────

const PresetPreview: React.FC<PresetPreviewProps> = ({
  children,
  accentColor,
  theme: themeOverrides,
}) => {
  const theme = { ...defaultTheme, ...themeOverrides };
  const resolvedAccent = accentColor ?? theme.accent;

  return (
    <View style={styles.slide}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: `${resolvedAccent}30`,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  slide: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  card: {
    width: PREVIEW_CARD_WIDTH,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default PresetPreview;
