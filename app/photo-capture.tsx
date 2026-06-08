import IconButton from "@/components/icon-button";
import {
  CameraType,
  CameraView,
  FlashMode,
  useCameraPermissions,
} from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";

import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import OverlayCountdown from "@/components/overlay-countdown";

import { getSlotAspectRatio, LayoutType } from "@/components/photobooth-strip";

import { FlashAutoIcon } from "@/components/icons/flash-auto-icon";
import { FlashOffIcon } from "@/components/icons/flash-off-icon";
import { FlashOnIcon } from "@/components/icons/flash-on-icon";
import GalleryAddIcon from "@/components/icons/gallery-add-icon";
import TimerIcon from "@/components/icons/timer-icon";

import FlipCameraIcon from "@/components/icons/flip-camera-icon";
import { ImageTransform } from "@/components/photo-edit-sheet";
import { colors } from "@/styles/theme";
import { useSession } from "../context/session-context";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function layoutNameToType(name: string): LayoutType {
  return name.split(" ")[1] as LayoutType;
}

/**
 * Compute an initial ImageTransform for a photo URI given the editor crop
 * dimensions. This must use the same crop size the edit sheet uses so that
 * fittedWidth/fittedHeight are in the correct coordinate space for PhotoSlot.
 *
 * The edit sheet derives cropWidth as: SCREEN_WIDTH - 80
 * (see photo-edit-sheet.tsx: EDITOR_WIDTH = SCREEN_WIDTH - 80)
 */
function computeInitialTransform(
  uri: string,
  slotAspectRatio: number,
  onDone: (transform: ImageTransform) => void,
) {
  const screenWidth = Dimensions.get("window").width;
  const cropWidth = screenWidth - 80; // mirrors EDITOR_WIDTH in photo-edit-sheet
  const cropHeight = cropWidth / slotAspectRatio;

  Image.getSize(
    uri,
    (origW, origH) => {
      const coverScale = Math.max(cropWidth / origW, cropHeight / origH);

      onDone({
        translateX: 0,
        translateY: 0,
        scale: 1,
        originalWidth: origW,
        originalHeight: origH,
        fittedWidth: origW * coverScale,
        fittedHeight: origH * coverScale,
      });
    },
    (err) => {
      console.warn("computeInitialTransform: Image.getSize failed", err);
      // Fall back to a transform that treats the image as exactly fitting the
      // crop area — PhotoSlot will cover-fit as best it can.
      onDone({
        translateX: 0,
        translateY: 0,
        scale: 1,
        originalWidth: cropWidth,
        originalHeight: cropHeight,
        fittedWidth: cropWidth,
        fittedHeight: cropHeight,
      });
    },
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VIEWFINDER_WIDTH = 360;
const VIEWFINDER_HEIGHT = VIEWFINDER_WIDTH * (4 / 3);
const THUMBNAIL_WIDTH = 52;

// ─── Flash cycle ──────────────────────────────────────────────────────────────

const FLASH_CYCLE: FlashMode[] = ["off", "on", "auto"];

const FLASH_ICON: Record<FlashMode, React.ReactNode> = {
  off: <FlashOffIcon size={30} color={colors.accent} />,
  on: <FlashOnIcon size={30} color={colors.accent} />,
  auto: <FlashAutoIcon size={30} color={colors.accent} />,
};

// ─── Timer cycle ──────────────────────────────────────────────────────────────

const TIMER_CYCLE = [3, 5, 10] as const;
type TimerSeconds = (typeof TIMER_CYCLE)[number];

// ─── Photo thumbnail ──────────────────────────────────────────────────────────

const PhotoThumbnail: React.FC<{
  uri: string | null;
  index: number;
  slotAspectRatio: number;
}> = ({ uri, index, slotAspectRatio }) => {
  const thumbnailHeight = THUMBNAIL_WIDTH / slotAspectRatio;

  return (
    <View
      style={[
        styles.thumbnail,
        { width: THUMBNAIL_WIDTH, height: thumbnailHeight },
        !uri && styles.thumbnailEmpty,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{
            width: THUMBNAIL_WIDTH,
            height: thumbnailHeight,
            borderRadius: 10,
          }}
          resizeMode="cover"
        />
      ) : (
        <Text style={styles.thumbnailIndex}>{index + 1}</Text>
      )}
    </View>
  );
};

// ─── Shutter button ───────────────────────────────────────────────────────────

const ShutterButton: React.FC<{
  onPress: () => void;
  disabled?: boolean;
}> = ({ onPress, disabled }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.shutter,
      pressed && styles.shutterPressed,
      disabled && styles.shutterDisabled,
    ]}
    accessibilityRole="button"
    accessibilityLabel="Take photo"
  />
);

// ─── Timer icon with pill ─────────────────────────────────────────────────────

const TimerIconWithPill: React.FC<{ seconds: TimerSeconds }> = ({
  seconds,
}) => (
  <View style={styles.timerButton}>
    <TimerIcon size={30} color={colors.accent} />
    <View style={styles.timerPill}>
      <Text style={styles.timerPillText}>{seconds}s</Text>
    </View>
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PhotoCaptureScreen() {
  const { session, addPhoto } = useSession();
  const { layout, photos } = session;

  const [facing, setFacing] = useState<CameraType>("front");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureCount, setCaptureCount] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<TimerSeconds>(3);
  const [permission, requestPermission] = useCameraPermissions();

  const cameraRef = useRef<CameraView>(null);

  if (!layout) return null;

  const type = layoutNameToType(layout.name);
  const totalSlots = layout.numberOfSlots;
  const slotsFilled = photos.length;
  const allFilled = slotsFilled >= totalSlots;
  const slotAspectRatio = getSlotAspectRatio(type);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleFlip = useCallback(() => {
    setFacing((prev: CameraType) => (prev === "front" ? "back" : "front"));
  }, []);

  const handleFlashCycle = useCallback(() => {
    setFlash((prev) => {
      const idx = FLASH_CYCLE.indexOf(prev);
      return FLASH_CYCLE[(idx + 1) % FLASH_CYCLE.length];
    });
  }, []);

  const handleTimerCycle = useCallback(() => {
    setTimerSeconds((prev) => {
      const idx = TIMER_CYCLE.indexOf(prev);
      return TIMER_CYCLE[(idx + 1) % TIMER_CYCLE.length];
    });
  }, []);

  /**
   * Resolves image dimensions then stores the photo with a correctly computed
   * initial transform. Using the editor crop dimensions here (SCREEN_WIDTH - 80)
   * ensures fittedWidth/fittedHeight are in the same coordinate space that
   * PhotoSlot uses when mapping transforms from the edit sheet.
   */
  const addPhotoWithTransform = useCallback(
    (uri: string) => {
      computeInitialTransform(uri, slotAspectRatio, (transform) => {
        addPhoto(uri, transform);
        setCaptureCount((c) => c + 1);
      });
    },
    [addPhoto, slotAspectRatio],
  );

  const handleGallery = useCallback(async () => {
    if (allFilled) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      addPhotoWithTransform(result.assets[0].uri);
    }
  }, [allFilled, addPhotoWithTransform]);

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current) return;

    setIsCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });

      if (photo?.uri) {
        addPhotoWithTransform(photo.uri);
      }
    } catch (e) {
      console.error("Capture failed:", e);
    } finally {
      setIsCapturing(false);
    }
  }, [addPhotoWithTransform]);

  const handleCapture = useCallback(() => {
    if (isCapturing || allFilled || showCountdown) return;
    setShowCountdown(true);
  }, [isCapturing, allFilled, showCountdown]);

  // ── Permission gate ────────────────────────────────────────────────────────

  if (!permission) {
    return <View style={styles.flex} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Camera access is needed to take photos.
        </Text>

        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Allow camera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Take photos</Text>

        <Text style={styles.subtitle}>
          {allFilled
            ? "All photos taken!"
            : `Photo ${slotsFilled + 1} of ${totalSlots}`}
        </Text>
      </View>

      {/* ── Viewfinder ── */}
      <View style={styles.viewfinderWrapper}>
        <View style={styles.viewfinder}>
          {!allFilled ? (
            <>
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFillObject}
                facing={facing}
                flash={flash}
                ratio="4:3"
              />

              <OverlayCountdown
                visible={showCountdown}
                start={timerSeconds}
                cycles={totalSlots}
                delayBetweenCycles={3000}
                onCycleComplete={async () => {
                  await takePhoto();
                }}
                onAllComplete={() => {
                  setShowCountdown(false);
                }}
              />
            </>
          ) : (
            <View
              style={[StyleSheet.absoluteFillObject, styles.allDoneOverlay]}
            >
              <Text style={styles.allDoneText}>✓</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Controls ── */}
      <View style={styles.controls}>
        {/* Left group */}
        <View style={styles.controlsGroup}>
          <IconButton
            icon={<FlipCameraIcon size={35} color={colors.accent} />}
            onPress={handleFlip}
            disabled={allFilled || showCountdown}
          />

          <IconButton
            icon={FLASH_ICON[flash]}
            onPress={handleFlashCycle}
            disabled={allFilled || showCountdown}
          />
        </View>

        {/* Center */}
        <ShutterButton
          onPress={handleCapture}
          disabled={isCapturing || allFilled || showCountdown}
        />

        {/* Right */}
        <View style={styles.controlsGroup}>
          <IconButton
            icon={<TimerIconWithPill seconds={timerSeconds} />}
            onPress={handleTimerCycle}
            disabled={allFilled || showCountdown}
          />
          <IconButton
            icon={<GalleryAddIcon size={30} color={colors.accent} />}
            onPress={handleGallery}
            disabled={allFilled || showCountdown}
          />
        </View>
      </View>

      {/* ── Photo summary ── */}
      {/* <ScrollView
        key={captureCount}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.summaryContent}
        style={styles.summary}
      >
        {Array.from({ length: totalSlots }, (_, i) => (
          <View key={i} style={{ marginRight: i < totalSlots - 1 ? 10 : 0 }}>
            <PhotoThumbnail
              uri={photos[i].uri ?? null}
              index={i}
              slotAspectRatio={slotAspectRatio}
            />
          </View>
        ))}
      </ScrollView> */}

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.footerButton,
            !allFilled && styles.footerButtonDisabled,
          ]}
          onPress={() => router.push("/photo-confirmation")}
          disabled={!allFilled}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={styles.footerButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },

  container: {
    flex: 1,
    backgroundColor: colors.bgMain,
  },

  // ── Header ──

  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
    alignItems: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.4,
    color: colors.textMain,
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 15,
    fontWeight: "400",
    color: colors.accent,
  },

  // ── Viewfinder ──

  viewfinderWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  viewfinder: {
    width: VIEWFINDER_WIDTH,
    height: VIEWFINDER_HEIGHT,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#000",
  },

  allDoneOverlay: {
    backgroundColor: colors.bgCard,
    alignItems: "center",
    justifyContent: "center",
  },

  allDoneText: {
    fontSize: 48,
    color: colors.accent,
  },

  // ── Controls ──

  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },

  controlsGroup: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },

  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fff",
    borderWidth: 4,
    borderColor: colors.accent,
  },

  shutterPressed: {
    transform: [{ scale: 0.93 }],
    backgroundColor: colors.bgButtonOption,
  },

  shutterDisabled: {
    opacity: 0.35,
  },

  // ── Timer icon with pill ──

  timerButton: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  timerPill: {
    position: "absolute",
    bottom: -4,
    alignSelf: "center",
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  timerPillText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.2,
  },

  // ── Summary ──

  summary: {
    flexGrow: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.bgCardSelected,
    paddingTop: 10,
  },

  summaryContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },

  thumbnail: {
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: colors.bgCard,
    alignItems: "center",
    justifyContent: "center",
  },

  thumbnailEmpty: {
    borderWidth: 1,
    borderColor: colors.bgButtonOption,
    borderStyle: "dashed",
  },

  thumbnailIndex: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.accent,
  },

  // ── Footer ──

  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },

  footerButton: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },

  footerButtonDisabled: {
    opacity: 0.4,
  },

  footerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  // ── Permission ──

  permissionContainer: {
    flex: 1,
    backgroundColor: colors.bgMain,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },

  permissionText: {
    fontSize: 16,
    textAlign: "center",
    color: colors.textMain,
  },

  permissionButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },

  permissionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
