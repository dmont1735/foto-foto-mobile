import { router } from "expo-router";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { globalStyles } from "../styles/global";

export default function Index() {
  const { width, height } = useWindowDimensions();

  return (
    <View
      style={[
        globalStyles.container,
        // styles.container,
        { padding: width * 0.05 },
      ]}
    >
      <Text style={globalStyles.screenTitle}>
        Welcome to Foto-Foto! Create fun Photobooth strips with different
        layouts.
      </Text>

      <Image
        source={require("../assets/previews/start-preview.png")}
        style={[
          globalStyles.heroImage,
          styles.previewImage,
          { width: width * 0.85, height: height * 0.4 },
        ]}
        resizeMode="contain"
      />

      <Pressable
        onPress={() => router.push("/instructions")}
        style={({ pressed }) => [
          styles.button,
          { paddingVertical: height * 0.018, paddingHorizontal: width * 0.08 },
          pressed && styles.buttonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Start the photobooth"
      >
        <Text style={styles.buttonText}>Start</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // container: {
  //   alignItems: "center",
  //   justifyContent: "center",
  //   backgroundColor: "#f89cd2ad",
  // },
  previewImage: {
    marginVertical: 24,
  },
  button: {
    marginTop: 16,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    overflow: "hidden",
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});
