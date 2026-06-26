import { OffscreenCaptureHost } from "@/utils/offscreen-capture";
import { Asset } from "expo-asset";
import { SplashScreen, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider } from "../context/session-context";

SplashScreen.preventAutoHideAsync();

const IMAGES = [
  // images
  require("../assets/images/adaptive-icon-monochrome.png"),
  require("../assets/images/adaptive-icon.png"),
  require("../assets/images/favicon.png"),
  require("../assets/images/icon.png"),
  require("../assets/images/logo.png"),
  require("../assets/images/rectangle-background.png"),
  require("../assets/images/splash.png"),
  // previews
  require("../assets/previews/horizontal/Layout E.png"),
  require("../assets/previews/horizontal/Layout F.png"),
  require("../assets/previews/vertical/Layout A.png"),
  require("../assets/previews/vertical/Layout B.png"),
  require("../assets/previews/vertical/Layout C.png"),
  require("../assets/previews/vertical/Layout D.png"),
  require("../assets/previews/start-preview.png"),
  require("../assets/previews/step1.png"),
  require("../assets/previews/step2.png"),
  require("../assets/previews/step3.png"),
  require("../assets/previews/step4.png"),
  // stickers
  require("../assets/stickers/star.png"),
  require("../assets/stickers/buttons/button_0.png"),
  require("../assets/stickers/buttons/button_1.png"),
  require("../assets/stickers/buttons/button_2.png"),
  require("../assets/stickers/buttons/button_3.png"),
  require("../assets/stickers/buttons/button_4.png"),
  require("../assets/stickers/buttons/button_5.png"),
  require("../assets/stickers/buttons/button_6.png"),
  require("../assets/stickers/buttons/button_7.png"),
  require("../assets/stickers/buttons/button_8.png"),
  require("../assets/stickers/buttons/button_9.png"),
  require("../assets/stickers/buttons/button_10.png"),
  require("../assets/stickers/buttons/button_11.png"),
  require("../assets/stickers/buttons/button_12.png"),
  require("../assets/stickers/buttons/button_13.png"),
  require("../assets/stickers/buttons/button_14.png"),
  require("../assets/stickers/buttons/button_15.png"),
  require("../assets/stickers/buttons/button_16.png"),
  require("../assets/stickers/buttons/button_17.png"),
  require("../assets/stickers/buttons/button_18.png"),
  require("../assets/stickers/buttons/button_19.png"),
  require("../assets/stickers/buttons/button_20.png"),
  require("../assets/stickers/buttons/button_21.png"),
  require("../assets/stickers/buttons/button_22.png"),
  require("../assets/stickers/buttons/button_23.png"),
  require("../assets/stickers/buttons/button_24.png"),
  require("../assets/stickers/buttons/button_25.png"),
];

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await Asset.loadAsync(IMAGES);
      } catch (e) {
        console.warn("Asset preloading failed:", e);
      } finally {
        setReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SessionProvider>
          <OffscreenCaptureHost />
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
            <Stack.Screen
              name="sticker-selection"
              options={{ title: "Sticker", headerShown: false }}
            />
            <Stack.Screen
              name="exporter"
              options={{ title: "Exporter", headerShown: false }}
            />
          </Stack>
        </SessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
