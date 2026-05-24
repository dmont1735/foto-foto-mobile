/**
 * screen-layout.tsx
 *
 * Shared structural primitives for every full-screen selector.
 *
 * ── SafeAreaView ownership ───────────────────────────────────────────────────
 * SafeAreaView must be owned by the *screen file* (the Expo Router route),
 * NOT by a reusable component like PresetSelector. Nesting a SafeAreaView
 * inside a navigator-mounted route causes a double safe-area application and
 * crashes React Navigation's layout pass.
 *
 * Rule:
 *   • Screen files (layout-selection.tsx, design-selection.tsx) → use
 *     <ScreenContainer> which wraps SafeAreaView.
 *   • Reusable components (preset-selector.tsx) → use <ScreenInner> which is
 *     a plain flex:1 View. The SafeAreaView is already provided by the screen.
 */

import React from "react";
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { globalStyles } from "../styles/global";
import { colors } from "../styles/theme";

// ─── Shared dimensions ────────────────────────────────────────────────────────

export const SCREEN_WIDTH = Dimensions.get("window").width;

/** Card width: full screen minus 16 px padding on each side. */
export const CARD_WIDTH = SCREEN_WIDTH - 32;

/** Card height: 4 ∶ 3 portrait ratio. */
export const CARD_HEIGHT = CARD_WIDTH * (4 / 3);

// ─── ScreenContainer ─────────────────────────────────────────────────────────
// Use this ONLY in screen files (Expo Router routes).

export interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Root container for screen files.
 * Owns the SafeAreaView — do NOT use inside reusable components.
 */
export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
}) => (
  <SafeAreaView
    edges={["top", "bottom"]}
    style={[sharedStyles.container, { backgroundColor: colors.bgMain }, style]}
  >
    {children}
  </SafeAreaView>
);

// ─── ScreenInner ──────────────────────────────────────────────────────────────
// Use this inside reusable components (e.g. PresetSelector) that are already
// mounted inside a SafeAreaView-owning screen.

export interface ScreenInnerProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Root container for reusable selector components.
 * Plain `flex: 1` View — safe-area insets are handled by the parent screen.
 */
export const ScreenInner: React.FC<ScreenInnerProps> = ({
  children,
  style,
}) => <View style={[sharedStyles.container, style]}>{children}</View>;

// ─── ScreenHeader ─────────────────────────────────────────────────────────────

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
}

/** Title + subtitle block. Typography and padding are intentionally locked. */
export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
}) => (
  <View style={sharedStyles.header}>
    <Text style={[sharedStyles.title, { color: colors.textMain }]}>
      {title}
    </Text>
    {subtitle ? (
      <Text style={[sharedStyles.subtitle, { color: colors.bgHeader }]}>
        {subtitle}
      </Text>
    ) : null}
  </View>
);

// ─── PreviewSection ───────────────────────────────────────────────────────────

export interface PreviewSectionProps {
  children: React.ReactNode;
}

/** flex:1 region that holds preview card(s). Clips overflow. */
export const PreviewSection: React.FC<PreviewSectionProps> = ({ children }) => (
  <View style={sharedStyles.previewSection}>{children}</View>
);

// ─── PreviewSlide ─────────────────────────────────────────────────────────────

export interface PreviewSlideProps {
  children: React.ReactNode;
}

/**
 * Single-card slide container.
 * Applies the same padding as FlatList slides in PresetSelector so the card
 * position is pixel-identical between the two screens.
 */
export const PreviewSlide: React.FC<PreviewSlideProps> = ({ children }) => (
  <View style={sharedStyles.previewSlide}>{children}</View>
);

// ─── PreviewCard ─────────────────────────────────────────────────────────────

export interface PreviewCardProps {
  children: React.ReactNode;
  /** Hex accent for the 18 % opaque border. */
  accentColor?: string;
  /** Surface fill — defaults to colors.bgContainer. */
  backgroundColor?: string;
}

/** The large rounded card shared by both selector screens. */
export const PreviewCard: React.FC<PreviewCardProps> = ({
  children,
  accentColor = colors.accent,
  backgroundColor = colors.bgContainer,
}) => (
  <View
    style={[
      sharedStyles.previewCard,
      {
        backgroundColor,
        borderColor: `${accentColor}30`,
      },
    ]}
  >
    {children}
  </View>
);

// ─── ScreenFooter ─────────────────────────────────────────────────────────────

export interface ScreenFooterProps {
  label: string;
  onPress: () => void;
  accentColor?: string;
}

/** Confirm button + padding wrapper. Padding locked to match PresetSelector. */
export const ScreenFooter: React.FC<ScreenFooterProps> = ({
  label,
  onPress,
  accentColor = colors.accent,
}) => (
  <View style={sharedStyles.footer}>
    <TouchableOpacity
      style={[globalStyles.button, { backgroundColor: accentColor }]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={globalStyles.buttonText}>{label}</Text>
    </TouchableOpacity>
  </View>
);

// ─── Shared styles ────────────────────────────────────────────────────────────

export const sharedStyles = StyleSheet.create({
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
  previewSlide: {
    flex: 1,
    width: SCREEN_WIDTH,
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
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
});
