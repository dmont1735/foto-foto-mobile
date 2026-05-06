import { colors } from "@/styles/theme";
import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InstructionStep {
  id: string;
  title: string;
  description: string;
  /** Optional: any React node rendered in the illustration area (icon, image, lottie, etc.) */
  illustration?: React.ReactNode;
  /** Optional: accent color per step. Falls back to theme.accent */
  accentColor?: string;
}

export interface InstructionsScreenProps {
  steps: InstructionStep[];
  /** Called when the user completes the last step */
  onFinish: () => void;
  /** Called when the user taps Skip (hidden if undefined) */
  onSkip?: () => void;
  /** Label for the finish button on the last step */
  finishLabel?: string;
  /** Label for the skip button */
  skipLabel?: string;
  /** Theme overrides */
  theme?: Partial<typeof defaultTheme>;
}

// ─── Theme ────────────────────────────────────────────────────────────────────
const defaultTheme = {
  background: colors.bgMain,
  surface: colors.bgContainer,
  accent: colors.accent,
  textPrimary: colors.textMain,
  textSecondary: colors.bgHeader, // dark plum — readable secondary on light bg
  dotActive: colors.accent,
  dotInactive: colors.bgButtonOption,
  arrowBackground: colors.bgCard,
  arrowIcon: colors.bgHeader,
  arrowDisabled: colors.bgButtonOption,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Sub-components ───────────────────────────────────────────────────────────

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

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.88,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
        style={[
          styles.arrowButton,
          {
            backgroundColor: disabled
              ? theme.arrowDisabled
              : theme.arrowBackground,
            borderColor: disabled ? "transparent" : `${theme.accent}40`,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          direction === "left" ? "Previous step" : "Next step"
        }
      >
        <Text
          style={[
            styles.arrowIcon,
            { color: disabled ? "#444" : theme.arrowIcon },
          ]}
        >
          {direction === "left" ? "←" : "→"}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

interface PaginationDotsProps {
  count: number;
  activeIndex: number;
  theme: typeof defaultTheme;
  accentColor?: string;
}

const PaginationDots: React.FC<PaginationDotsProps> = ({
  count,
  activeIndex,
  theme,
  accentColor,
}) => (
  <View style={styles.dotsContainer}>
    {Array.from({ length: count }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.dot,
          i === activeIndex
            ? [
                styles.dotActive,
                { backgroundColor: accentColor ?? theme.dotActive },
              ]
            : { backgroundColor: theme.dotInactive },
        ]}
      />
    ))}
  </View>
);

interface StepCardProps {
  step: InstructionStep;
  theme: typeof defaultTheme;
}

const StepCard: React.FC<StepCardProps> = ({ step, theme }) => {
  const accent = step.accentColor ?? theme.accent;
  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      {/* Illustration area */}
      <View
        style={[
          styles.illustrationContainer,
          { backgroundColor: `${accent}14`, borderColor: `${accent}28` },
        ]}
      >
        {step.illustration ?? (
          // Default placeholder when no illustration is provided
          <View
            style={[
              styles.illustrationPlaceholder,
              { backgroundColor: `${accent}22` },
            ]}
          >
            <Text style={[styles.placeholderEmoji]}>✦</Text>
          </View>
        )}
      </View>

      {/* Text */}
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>
        {step.title}
      </Text>
      <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
        {step.description}
      </Text>
    </View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const InstructionsScreen: React.FC<InstructionsScreenProps> = ({
  steps,
  onFinish,
  onSkip,
  finishLabel = "Get Started",
  skipLabel = "Skip",
  theme: themeOverrides,
}) => {
  const theme = { ...defaultTheme, ...themeOverrides };
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<InstructionStep>>(null);
  const isLast = activeIndex === steps.length - 1;
  const activeAccent = steps[activeIndex]?.accentColor ?? theme.accent;

  // Track which slide is visible via FlatList's viewability API
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const scrollTo = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setActiveIndex(index);
  };

  const handleNext = () => {
    if (isLast) {
      onFinish();
    } else {
      scrollTo(activeIndex + 1);
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) scrollTo(activeIndex - 1);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar barStyle="dark-content" backgroundColor={theme.background} />

      {/* Skip button */}
      {onSkip && !isLast && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={onSkip}
          accessibilityRole="button"
          accessibilityLabel={skipLabel}
        >
          <Text style={[styles.skipLabel, { color: theme.textSecondary }]}>
            {skipLabel}
          </Text>
        </TouchableOpacity>
      )}

      {/* Swipeable steps */}
      <FlatList
        ref={flatListRef}
        data={steps}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <StepCard step={item} theme={theme} />}
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
        style={styles.flatList}
      />

      {/* Bottom controls */}
      <View style={styles.controls}>
        {/* Left arrow */}
        <ArrowButton
          direction="left"
          onPress={handlePrev}
          disabled={activeIndex === 0}
          theme={theme}
        />

        {/* Dots */}
        <PaginationDots
          count={steps.length}
          activeIndex={activeIndex}
          theme={theme}
          accentColor={activeAccent}
        />

        {/* Right arrow / Finish */}
        {isLast ? (
          <TouchableOpacity
            style={[styles.finishButton, { backgroundColor: activeAccent }]}
            onPress={onFinish}
            accessibilityRole="button"
            accessibilityLabel={finishLabel}
          >
            <Text style={styles.finishLabel}>{finishLabel}</Text>
          </TouchableOpacity>
        ) : (
          <ArrowButton direction="right" onPress={handleNext} theme={theme} />
        )}
      </View>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? 16 : 8,
    paddingBottom: 8,
  },
  skipLabel: {
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  flatList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 20,
  },
  illustrationContainer: {
    width: SCREEN_WIDTH * 0.72,
    aspectRatio: 1,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
    overflow: "hidden",
  },
  illustrationPlaceholder: {
    width: "60%",
    aspectRatio: 1,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderEmoji: {
    fontSize: 52,
    color: "#fff",
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5,
    textAlign: "center",
    marginBottom: 14,
    lineHeight: 34,
  },
  stepDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    fontWeight: "400",
    letterSpacing: 0.1,
    maxWidth: 320,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "android" ? 24 : 12,
    paddingTop: 16,
  },
  arrowButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowIcon: {
    fontSize: 22,
    fontWeight: "600",
    marginTop: -2, // optical centering
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
  },
  dotInactive: {
    width: 8,
  },
  finishButton: {
    height: 52,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  finishLabel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});

export default InstructionsScreen;
