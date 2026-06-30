import { PALETTE } from "@/app/color-selection";
import BackgroundImageTray, {
  BackgroundImageOption,
} from "@/components/background-picker-tray";
import CheckeredBackground from "@/components/backgrounds/CheckeredBackground";
import PlaidBackground from "@/components/backgrounds/PlaidBackground";
import PolkaDotBackground from "@/components/backgrounds/PolkaDotBackground";
import SolidColorBackground from "@/components/backgrounds/SolidColorBackground";
import StripedBackground from "@/components/backgrounds/StripedBackground";
import PhotoboothStrip, {
  getStripNaturalSize,
  LayoutType,
} from "@/components/photobooth-strip";
import PopupAlert, { AlertButton } from "@/components/pop-up-alert";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  PreviewCard,
  PreviewSection,
  PreviewSlide,
  ScreenContainer,
  ScreenFooter,
  ScreenHeader,
} from "@/components/screen-layout";
import { colors } from "@/styles/theme";
import { generateBackgroundPngUri } from "@/utils/generate-background-png";
import { StripBackground } from "@/utils/strip-layouts";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ImageSourcePropType } from "react-native";
import { useSession } from "../context/session-context";

// ─── Preset backgrounds ───────────────────────────────────────────────────────

const PRESET_BACKGROUNDS: BackgroundImageOption[] = [
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
    color: PALETTE[1].color,
    label: "Polka Dots",
  },
  {
    id: "preset-checkered",
    type: "svg",
    component: CheckeredBackground,
    color: PALETTE[2].color,
    label: "Checkered",
  },
  {
    id: "preset-striped",
    type: "svg",
    component: StripedBackground,
    color: PALETTE[3].color,
    label: "Striped",
  },
];

// ─── Popup alert state shape ───────────────────────────────────────────────────

type PopupConfig = {
  title: string;
  message?: string;
  buttons: AlertButton[];
};

// ─── Image picker helpers ──────────────────────────────────────────────────────

let _customCounter = 0;

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
  onPermissionDenied: () => void,
): Promise<string | null> {
  const granted = await resolvePermission(source);
  if (!granted) {
    onPermissionDenied();
    return null;
  }

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    allowsEditing: false,
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

// ─── Other helpers ──────────────────────────────────────────────────────────────────

function layoutNameToType(name: string): LayoutType {
  return name.split(" ")[1] as LayoutType;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DesignSelectionScreen() {
  const { session, setBackground } = useSession();
  const { layout, photos } = session;

  // Derive safely before hooks
  const type = layout ? layoutNameToType(layout.name) : null;
  const natural = type ? getStripNaturalSize(type) : { width: 1, height: 1 };
  const scaleRatio = type
    ? Math.min(CARD_WIDTH / natural.width, CARD_HEIGHT / natural.height)
    : 1;

  // ── Hooks — all unconditionally above any guard ──────────────────────────

  const [customImages, setCustomImages] = useState<BackgroundImageOption[]>([]);
  const [popup, setPopup] = useState<PopupConfig | null>(null);

  // Holds an action queued to run once the popup's Modal has fully closed,
  // so we never present the camera/library picker while PopupAlert's Modal
  // is still mid-dismiss (which causes iOS to silently swallow the picker).
  const pendingActionRef = useRef<(() => void) | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closePopup = useCallback(() => setPopup(null), []);

  const handleFullyDismissed = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action) action();
  }, []);

  const runAfterPopupCloses = useCallback(
    (action: () => void) => {
      pendingActionRef.current = action;
      closePopup();
      // Android's Modal doesn't fire onDismiss, so fall back to a timer
      // matching the popup's close animation duration (130ms) plus margin.
      fallbackTimerRef.current = setTimeout(() => {
        handleFullyDismissed();
      }, 200);
    },
    [closePopup, handleFullyDismissed],
  );

  useEffect(() => {
    if (!type) return;
    const bg = session.background;
    if (bg.type === "svg" && !bg.generatePngUri) {
      setBackground({
        type: "svg",
        component: bg.component,
        color: bg.color,
        generatePngUri: () =>
          generateBackgroundPngUri(
            bg.component,
            bg.color,
            natural.width,
            natural.height,
          ),
      });
    }
  }, [type]);

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
      return newOption;
    },
    [],
  );

  const showPermissionDeniedPopup = useCallback(
    (source: "camera" | "gallery") => {
      setPopup({
        title: "Permission required",
        message:
          source === "camera"
            ? "Camera access is needed to take a photo."
            : "Photo library access is needed to choose an image.",
        buttons: [{ label: "OK", onPress: closePopup, variant: "primary" }],
      });
    },
    [closePopup],
  );

  const requestCustomImage = useCallback(
    (onPicked: (source: ImageSourcePropType) => void) => {
      setPopup({
        title: "Add background",
        message: "Choose a source",
        buttons: [
          {
            label: "Camera",
            variant: "primary",
            onPress: () =>
              runAfterPopupCloses(async () => {
                const uri = await launchPicker("camera", () =>
                  showPermissionDeniedPopup("camera"),
                );
                if (uri) onPicked({ uri });
              }),
          },
          {
            label: "Photo library",
            variant: "primary",
            onPress: () =>
              runAfterPopupCloses(async () => {
                const uri = await launchPicker("gallery", () =>
                  showPermissionDeniedPopup("gallery"),
                );
                if (uri) onPicked({ uri });
              }),
          },
          {
            label: "Cancel",
            variant: "secondary",
            onPress: closePopup,
          },
        ],
      });
    },
    [closePopup, runAfterPopupCloses, showPermissionDeniedPopup],
  );

  // ── Guard — after all hooks ──────────────────────────────────────────────

  if (!layout || !type) return null;

  // ── Handlers ────────────────────────────────────────────────────────────────

  function backgroundFromOption(opt: BackgroundImageOption): StripBackground {
    if (opt.type === "svg") {
      return {
        type: "svg",
        component: opt.component,
        color: opt.color,
        generatePngUri: () =>
          generateBackgroundPngUri(
            opt.component,
            opt.color,
            natural.width,
            natural.height,
          ),
      };
    }
    return { type: "image", source: opt.source };
  }

  const handleImageSelect = (opt: BackgroundImageOption) => {
    setBackground(backgroundFromOption(opt));
  };

  const handleRequestCustomImage = () => {
    requestCustomImage((source) => {
      const newOpt = addCustomImage(source);
      setBackground(backgroundFromOption(newOpt));
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Choose a design"
        subtitle="Pick background that sets the mood."
        onBack={() => router.back()}
      />

      <PreviewSection>
        <PreviewSlide>
          <PreviewCard>
            <PhotoboothStrip
              type={type}
              images={photos}
              background={session.background}
              scaleRatio={scaleRatio}
            />
          </PreviewCard>
        </PreviewSlide>
      </PreviewSection>

      <BackgroundImageTray
        presets={PRESET_BACKGROUNDS}
        customImages={customImages}
        onRequestCustomImage={handleRequestCustomImage}
        accentColor={colors.accent}
        activeId={null}
        onSelect={handleImageSelect}
      />

      <ScreenFooter
        label="Use this design"
        onPress={() => router.push("/color-selection")}
        accentColor={colors.accent}
      />

      <PopupAlert
        visible={popup !== null}
        title={popup?.title ?? ""}
        message={popup?.message}
        buttons={popup?.buttons ?? []}
        onDismiss={closePopup}
        onFullyDismissed={handleFullyDismissed}
      />
    </ScreenContainer>
  );
}
