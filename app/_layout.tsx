import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider } from "../context/session-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <Stack>
          <Stack.Screen
            name="index"
            options={{ title: "Home", headerShown: false }}
          />
          <Stack.Screen
            name="instructions"
            options={{ title: "Instructions", headerShown: false }}
          />
          <Stack.Screen
            name="layout-selection"
            options={{ title: "Layout", headerShown: false }}
          />
          <Stack.Screen
            name="design-selection"
            options={{ title: "Design", headerShown: false }}
          />
          <Stack.Screen
            name="color-selection"
            options={{ title: "Color", headerShown: false }}
          />
          <Stack.Screen
            name="photo-confirmation"
            options={{ title: "Photo Confirmation", headerShown: false }}
          />
        </Stack>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
