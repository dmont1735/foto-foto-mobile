import { StyleSheet, TouchableOpacity } from "react-native";

import { colors } from "@/styles/theme";

type IconButtonProps = {
  icon: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
};

const IconButton: React.FC<IconButtonProps> = ({ icon, onPress, disabled }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[styles.iconButton, disabled && styles.iconButtonDisabled]}
    accessibilityRole="button"
  >
    {icon}
  </TouchableOpacity>
);

export default IconButton;

const styles = StyleSheet.create({
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 50,
    backgroundColor: colors.bgButtonOption,
    alignItems: "center",
    justifyContent: "center",
  },

  iconButtonDisabled: {
    opacity: 0.35,
  },
});
