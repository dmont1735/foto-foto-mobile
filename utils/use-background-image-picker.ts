import { BackgroundImageOption } from "@/components/background-picker-tray";
import CheckeredBackground from "@/components/backgrounds/CheckeredBackground";
import PlaidBackground from "@/components/backgrounds/PlaidBackground";
import PolkaDotBackground from "@/components/backgrounds/PolkaDotBackground";
import SolidColorBackground from "@/components/backgrounds/SolidColorBackground";
import StripedBackground from "@/components/backgrounds/StripedBackground";
import { colors } from "@/styles/theme";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";
import { Alert, ImageSourcePropType } from "react-native";

// ─── Preset backgrounds ───────────────────────────────────────────────────────

export const PRESET_BACKGROUNDS: BackgroundImageOption[] = [
  {
    id: "preset-solid-color",
    type: "svg",
    color: colors.defaultBackgroundColor,
    component: SolidColorBackground,
    label: "Solid Color",
  },
  {
    id: "preset-plaid",
    type: "svg",
    component: PlaidBackground,
    color: colors.defaultBackgroundColor,
    label: "Plaid",
  },
  {
    id: "preset-polka-dots",
    type: "svg",
    component: PolkaDotBackground,
    color: colors.defaultBackgroundColor,
    label: "Polka Dots",
  },
  {
    id: "preset-checkered",
    type: "svg",
    component: CheckeredBackground,
    color: colors.defaultBackgroundColor,
    label: "Checkered",
  },
  {
    id: "preset-striped",
    type: "svg",
    component: StripedBackground,
    color: colors.defaultBackgroundColor,
    label: "Striped",
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseBackgroundImagePickerReturn {
  presets: BackgroundImageOption[];
  customImages: BackgroundImageOption[];
  activeImageId: string | null;
  selectImage: (opt: BackgroundImageOption) => void;
  addCustomImage: (source: ImageSourcePropType) => BackgroundImageOption;
  requestCustomImage: (onPicked: (source: ImageSourcePropType) => void) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function resolvePermission(
  source: "camera" | "gallery",
): Promise<boolean> {
  if (source === "camera") {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === "granted";
  }
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === "granted";
}

/**
 * Resize the image to a max width of 800px before use.
 * Device photos are often 3000-6000px wide — passing them full-size
 * into the strip causes slow decode and re-render on every capture.
 */
async function resizeImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 800 } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}

async function launchPicker(
  source: "camera" | "gallery",
): Promise<string | null> {
  const granted = await resolvePermission(source);
  if (!granted) {
    Alert.alert(
      "Permission required",
      source === "camera"
        ? "Camera access is needed to take a photo."
        : "Photo library access is needed to choose an image.",
    );
    return null;
  }

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 0.9,
  };

  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

  if (result.canceled) return null;

  const uri = result.assets[0].uri;
  return resizeImage(uri);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

let _customCounter = 0;

export function useBackgroundImagePicker(
  initialActiveId: string | null = null,
): UseBackgroundImagePickerReturn {
  const [customImages, setCustomImages] = useState<BackgroundImageOption[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(
    initialActiveId,
  );

  const selectImage = useCallback((opt: BackgroundImageOption) => {
    setActiveImageId(opt.id);
  }, []);

  const addCustomImage = useCallback(
    (source: ImageSourcePropType): BackgroundImageOption => {
      _customCounter += 1;
      const newOption: BackgroundImageOption = {
        id: `custom-${_customCounter}`,
        type: "image",
        source,
        label: `Custom ${_customCounter}`,
        isCustom: true,
      };
      setCustomImages((prev) => [...prev, newOption]);
      setActiveImageId(newOption.id);
      return newOption;
    },
    [],
  );

  const requestCustomImage = useCallback(
    (onPicked: (source: ImageSourcePropType) => void) => {
      Alert.alert("Add background", "Choose a source", [
        {
          text: "Camera",
          onPress: async () => {
            const uri = await launchPicker("camera");
            if (uri) onPicked({ uri });
          },
        },
        {
          text: "Photo library",
          onPress: async () => {
            const uri = await launchPicker("gallery");
            if (uri) onPicked({ uri });
          },
        },
        { text: "Cancel", style: "cancel" },
      ]);
    },
    [],
  );

  return {
    presets: PRESET_BACKGROUNDS,
    customImages,
    activeImageId,
    selectImage,
    addCustomImage,
    requestCustomImage,
  };
}
