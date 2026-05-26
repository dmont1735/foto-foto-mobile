import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import ColorPicker, {
    HueSlider,
    Panel1,
    Preview,
} from "reanimated-color-picker";

import { colors } from "@/styles/theme";

type Props = {
  visible: boolean;
  initialColor: string;
  onClose: () => void;
  onSubmit: (color: string) => void;
};

export default function CustomColorCard({
  visible,
  initialColor,
  onClose,
  onSubmit,
}: Props) {
  const [selectedColor, setSelectedColor] = React.useState(initialColor);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Custom colour</Text>

          <ColorPicker
            value={initialColor}
            onCompleteJS={(color) => {
              setSelectedColor(color.hex);
            }}
            style={styles.picker}
          >
            <Preview hideInitialColor />

            <Panel1 style={styles.panel} />

            <HueSlider style={styles.slider} />
          </ColorPicker>

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
              <Text style={styles.buttonText}>Use colour</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

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
    marginBottom: 20,
    color: "black",
  },

  picker: {
    gap: 18,
  },

  panel: {
    borderRadius: 18,
    height: 220,
  },

  slider: {
    borderRadius: 999,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 24,
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
