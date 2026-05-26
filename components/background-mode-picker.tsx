import { colors } from "@/styles/theme";
import React, { useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BackgroundMode = "color" | "image";

export interface BackgroundModePickerProps {
  activeMode: BackgroundMode;
  onModeChange: (mode: BackgroundMode) => void;
  accentColor?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MODES: { id: BackgroundMode; label: string }[] = [
  { id: "color", label: "Solid colour" },
  { id: "image", label: "Background" },
];

// ─── Component ────────────────────────────────────────────────────────────────

const BackgroundModePicker: React.FC<BackgroundModePickerProps> = ({
  activeMode,
  onModeChange,
  accentColor,
}) => {
  const accent = accentColor ?? colors.accent;

  return (
    <View style={styles.container}>
      {MODES.map((mode) => {
        const isActive = mode.id === activeMode;
        return (
          <ModeButton
            key={mode.id}
            label={mode.label}
            isActive={isActive}
            accent={accent}
            onPress={() => onModeChange(mode.id)}
          />
        );
      })}
    </View>
  );
};

// ─── ModeButton ───────────────────────────────────────────────────────────────

interface ModeButtonProps {
  label: string;
  isActive: boolean;
  accent: string;
  onPress: () => void;
}

const ModeButton: React.FC<ModeButtonProps> = ({
  label,
  isActive,
  accent,
  onPress,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, {
      toValue: 0.96,
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
    <Animated.View style={[styles.buttonWrapper, { transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[styles.button, isActive && { backgroundColor: accent }]}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
      >
        <Text style={[styles.label, isActive && styles.labelActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: colors.bgButtonOption,
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  buttonWrapper: {
    flex: 1,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.accent,
  },
  labelActive: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default BackgroundModePicker;
