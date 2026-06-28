import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { colors } from "@/styles/theme";

// ─── Color math ───────────────────────────────────────────────────────────────

function hsvToHex(h: number, s: number, v: number): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    const val = v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    return Math.round(val * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(5)}${f(3)}${f(1)}`;
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

function hueToHex(h: number): string {
  return hsvToHex(h, 1, 1);
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PANEL_HEIGHT = 200;
const SLIDER_HEIGHT = 28;
const THUMB_SIZE = 24;

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  visible: boolean;
  initialColor: string;
  onClose: () => void;
  onSubmit: (color: string) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function CustomColorCard({
  visible,
  initialColor,
  onClose,
  onSubmit,
}: Props) {
  const initial = hexToHsv(initialColor.slice(0, 7));

  const hue = useSharedValue(initial.h);
  const sat = useSharedValue(initial.s);
  const val = useSharedValue(initial.v);
  const panelWidth = useSharedValue(0);

  const [selectedColor, setSelectedColor] = React.useState(
    initialColor.slice(0, 7),
  );
  const [hueColor, setHueColor] = React.useState(hueToHex(initial.h));

  const updateColor = (h: number, s: number, v: number) => {
    const hex = hsvToHex(h, s, v);
    setSelectedColor(hex);
    setHueColor(hueToHex(h));
  };

  // ── Panel gesture ────────────────────────────────────────────────────────

  const panelGesture = Gesture.Pan()
    .onBegin((e) => {
      const w = panelWidth.value;
      sat.value = Math.min(1, Math.max(0, e.x / w));
      val.value = Math.min(1, Math.max(0, 1 - e.y / PANEL_HEIGHT));
      runOnJS(updateColor)(hue.value, sat.value, val.value);
    })
    .onUpdate((e) => {
      const w = panelWidth.value;
      sat.value = Math.min(1, Math.max(0, e.x / w));
      val.value = Math.min(1, Math.max(0, 1 - e.y / PANEL_HEIGHT));
      runOnJS(updateColor)(hue.value, sat.value, val.value);
    });

  const panelThumbStyle = useAnimatedStyle(() => ({
    left: sat.value * panelWidth.value - THUMB_SIZE / 2,
    top: (1 - val.value) * PANEL_HEIGHT - THUMB_SIZE / 2,
  }));

  // ── Hue gesture ──────────────────────────────────────────────────────────

  const hueGesture = Gesture.Pan()
    .onBegin((e) => {
      const w = panelWidth.value;
      hue.value = Math.min(359, Math.max(0, (e.x / w) * 360));
      runOnJS(updateColor)(hue.value, sat.value, val.value);
    })
    .onUpdate((e) => {
      const w = panelWidth.value;
      hue.value = Math.min(359, Math.max(0, (e.x / w) * 360));
      runOnJS(updateColor)(hue.value, sat.value, val.value);
    });

  const hueThumbStyle = useAnimatedStyle(() => ({
    left: (hue.value / 360) * panelWidth.value - THUMB_SIZE / 2,
  }));

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Custom color</Text>
          {/* Preview */}
          <View style={[styles.preview, { backgroundColor: selectedColor }]}>
            <Text style={styles.previewText}>{selectedColor}</Text>
          </View>

          {/* SV Panel */}
          <View
            style={styles.panel}
            onLayout={(e) => {
              panelWidth.value = e.nativeEvent.layout.width;
            }}
          >
            <GestureDetector gesture={panelGesture}>
              <View style={StyleSheet.absoluteFill}>
                {/* White → hue color (left to right) */}
                <LinearGradient
                  colors={["#ffffff", hueColor]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                {/* Transparent → black (top to bottom) */}
                <LinearGradient
                  colors={["transparent", "#000000"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Animated.View style={[styles.panelThumb, panelThumbStyle]} />
              </View>
            </GestureDetector>
          </View>

          {/* Hue slider */}
          <View style={styles.sliderContainer}>
            <GestureDetector gesture={hueGesture}>
              <View style={styles.slider}>
                <LinearGradient
                  colors={[
                    "#ff0000",
                    "#ffff00",
                    "#00ff00",
                    "#00ffff",
                    "#0000ff",
                    "#ff00ff",
                    "#ff0000",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <Animated.View style={[styles.sliderThumb, hueThumbStyle]} />
              </View>
            </GestureDetector>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.cancel]} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[
                styles.button,
                styles.confirm,
                { backgroundColor: selectedColor },
              ]}
              onPress={() => {
                onSubmit(selectedColor);
                onClose();
              }}
            >
              <Text style={styles.buttonText}>Use color</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  card: {
    width: "100%",
    borderRadius: 24,
    backgroundColor: colors.bgCard,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.accent,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    color: "black",
  },

  panel: {
    width: "100%",
    height: PANEL_HEIGHT,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },

  panelThumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 3,
  },

  sliderContainer: {
    marginBottom: 16,
  },

  slider: {
    width: "100%",
    height: SLIDER_HEIGHT,
    borderRadius: SLIDER_HEIGHT / 2,
    overflow: "hidden",
    position: "relative",
  },

  sliderThumb: {
    position: "absolute",
    top: (SLIDER_HEIGHT - THUMB_SIZE) / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 3,
  },

  preview: {
    width: "100%",
    height: 40,
    borderRadius: 10,
    marginBottom: 20,
    justifyContent: "center",
  },
  previewText: {
    textAlign: "center",
  },

  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },

  button: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },

  cancel: {
    backgroundColor: colors.bgButtonOption,
  },

  confirm: {},

  buttonText: {
    color: "white",
    fontWeight: "600",
  },
});
