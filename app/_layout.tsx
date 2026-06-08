import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider } from "../context/session-context";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
              name="photo-capture"
              options={{ title: "Photo Capture", headerShown: false }}
            />
            <Stack.Screen
              name="photo-confirmation"
              options={{ title: "Photo Confirmation", headerShown: false }}
            />
            <Stack.Screen
              name="filter-selection"
              options={{ title: "Filter", headerShown: false }}
            />
          </Stack>
        </SessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
