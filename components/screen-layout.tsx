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

import React, { useEffect, useRef } from "react";
import {
  Animated,
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

export interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

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

export interface ScreenInnerProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const ScreenInner: React.FC<ScreenInnerProps> = ({
  children,
  style,
}) => <View style={[sharedStyles.container, style]}>{children}</View>;

// ─── ScreenHeader ─────────────────────────────────────────────────────────────

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
}

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

export const PreviewSection: React.FC<PreviewSectionProps> = ({ children }) => (
  <View style={sharedStyles.previewSection}>{children}</View>
);

// ─── PreviewSlide ─────────────────────────────────────────────────────────────

export interface PreviewSlideProps {
  children: React.ReactNode;
}

export const PreviewSlide: React.FC<PreviewSlideProps> = ({ children }) => (
  <View style={sharedStyles.previewSlide}>{children}</View>
);

// ─── ShimmerOverlay ───────────────────────────────────────────────────────────
// Pulsing opacity overlay shown while the preview is capturing.

const ShimmerOverlay: React.FC = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[sharedStyles.shimmerOverlay, { opacity }]}
      pointerEvents="none"
    />
  );
};

// ─── PreviewCard ─────────────────────────────────────────────────────────────

export interface PreviewCardProps {
  children: React.ReactNode;
  /** Hex accent for the 18 % opaque border. */
  accentColor?: string;
  /** Surface fill — defaults to colors.bgContainer. */
  backgroundColor?: string;
  /** Shows a pulsing shimmer overlay while true. */
  isLoading?: boolean;
}

export const PreviewCard: React.FC<PreviewCardProps> = ({
  children,
  accentColor = colors.accent,
  backgroundColor = colors.bgContainer,
  isLoading = false,
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
    {isLoading && <ShimmerOverlay />}
  </View>
);

// ─── ScreenFooter ─────────────────────────────────────────────────────────────

export interface ScreenFooterProps {
  label: string;
  onPress: () => void;
  accentColor?: string;
}

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
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bgMain,
    borderRadius: 24,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
});
