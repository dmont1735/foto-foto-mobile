import { getSlotAspectRatio, LayoutType } from "@/components/photobooth-strip";
import { useSession } from "@/context/session-context";
import { colors } from "@/styles/theme";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Image,
    PanResponder,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// ─── Constants ────────────────────────────────────────────────────────────────

const SCREEN_WIDTH = Dimensions.get("window").width;
const EDITOR_WIDTH = SCREEN_WIDTH - 80;
const MIN_SCALE = 1;
const MAX_SCALE = 5;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PhotoEditSheetProps {
  uri: string | null;
  index: number;
  onCancel: () => void;
  onRetake: (index: number) => void;
  onConfirm: (index: number, transform: ImageTransform) => void;
}

export interface ImageTransform {
  translateX: number;
  translateY: number;
  scale: number;

  originalWidth: number;
  originalHeight: number;

  fittedWidth: number;
  fittedHeight: number;
}

// ─── Crop frame (Skia) ────────────────────────────────────────────────────────

const CropFrame: React.FC<{
  width: number;
  height: number;
}> = ({ width, height }) => {
  const cornerLen = Math.min(width, height) * 0.08;

  const thirdX = width / 3;
  const thirdY = height / 3;

  const path = Skia.Path.Make();

  path.moveTo(0, cornerLen);
  path.lineTo(0, 0);
  path.lineTo(cornerLen, 0);

  path.moveTo(width - cornerLen, 0);
  path.lineTo(width, 0);
  path.lineTo(width, cornerLen);

  path.moveTo(width, height - cornerLen);
  path.lineTo(width, height);
  path.lineTo(width - cornerLen, height);

  path.moveTo(cornerLen, height);
  path.lineTo(0, height);
  path.lineTo(0, height - cornerLen);

  path.moveTo(thirdX, 0);
  path.lineTo(thirdX, height);

  path.moveTo(thirdX * 2, 0);
  path.lineTo(thirdX * 2, height);

  path.moveTo(0, thirdY);
  path.lineTo(width, thirdY);

  path.moveTo(0, thirdY * 2);
  path.lineTo(width, thirdY * 2);

  return (
    <Canvas style={[StyleSheet.absoluteFillObject, { pointerEvents: "none" }]}>
      <Path
        path={path}
        color="rgba(255,255,255,0.85)"
        style="stroke"
        strokeWidth={2.5}
        strokeCap="round"
        strokeJoin="round"
      />
    </Canvas>
  );
};

// ─── Image editor ─────────────────────────────────────────────────────────────

interface ImageEditorProps {
  uri: string;
  cropWidth: number;
  cropHeight: number;
  onTransformChange: (t: ImageTransform) => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({
  uri,
  cropWidth,
  cropHeight,
  onTransformChange,
}) => {
  const [imageSize, setImageSize] = useState({
    originalWidth: 0,
    originalHeight: 0,
    fittedWidth: cropWidth,
    fittedHeight: cropHeight,
  });

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Image.getSize(
      uri,
      (width, height) => {
        const coverScale = Math.max(cropWidth / width, cropHeight / height);

        const fittedWidth = width * coverScale;
        const fittedHeight = height * coverScale;

        setImageSize({
          originalWidth: width,
          originalHeight: height,
          fittedWidth,
          fittedHeight,
        });

        // Also update the ref so panResponder can read the latest values
        imageSizeRef.current = {
          originalWidth: width,
          originalHeight: height,
          fittedWidth,
          fittedHeight,
        };

        onTransformChange({
          translateX: 0,
          translateY: 0,
          scale: 1,
          originalWidth: width,
          originalHeight: height,
          fittedWidth,
          fittedHeight,
        });
      },
      () => {
        console.warn("Failed to load image dimensions");
      },
    );
  }, [uri, cropWidth, cropHeight, onTransformChange]);

  const state = useRef({
    tx: 0,
    ty: 0,
    scale: 1,
    lastTx: 0,
    lastTy: 0,
    lastScale: 1,
    initialDistance: 0,
  });

  /**
   * Keep a ref to imageSize so panResponder (created once on mount) can
   * always read the latest fitted dimensions without stale closure values.
   */
  const imageSizeRef = useRef(imageSize);

  const getDistance = (touches: any[]) => {
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  /**
   * Clamp translation so the scaled image always covers the crop area.
   * Reads from imageSizeRef so it always has the current fitted dimensions
   * even though panResponder is only created once.
   */
  const clampTranslation = (tx: number, ty: number, currentScale: number) => {
    const { fittedWidth, fittedHeight } = imageSizeRef.current;
    const maxTx = Math.max(0, (fittedWidth * currentScale - cropWidth) / 2);
    const maxTy = Math.max(0, (fittedHeight * currentScale - cropHeight) / 2);
    return {
      tx: Math.max(-maxTx, Math.min(maxTx, tx)),
      ty: Math.max(-maxTy, Math.min(maxTy, ty)),
    };
  };

  const emitTransform = () => {
    const { originalWidth, originalHeight, fittedWidth, fittedHeight } =
      imageSizeRef.current;
    onTransformChange({
      translateX: state.current.tx,
      translateY: state.current.ty,
      scale: state.current.scale,
      originalWidth,
      originalHeight,
      fittedWidth,
      fittedHeight,
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: (e) => {
        state.current.lastTx = state.current.tx;
        state.current.lastTy = state.current.ty;
        state.current.lastScale = state.current.scale;

        if (e.nativeEvent.touches.length === 2) {
          state.current.initialDistance = getDistance(
            e.nativeEvent.touches as any[],
          );
        }
      },

      onPanResponderMove: (e, gestureState) => {
        const touches = e.nativeEvent.touches as any[];

        if (touches.length === 2) {
          const dist = getDistance(touches);

          if (state.current.initialDistance === 0) {
            state.current.initialDistance = dist;
          }

          const newScale = Math.min(
            MAX_SCALE,
            Math.max(
              MIN_SCALE,
              state.current.lastScale * (dist / state.current.initialDistance),
            ),
          );

          state.current.scale = newScale;
          scale.setValue(newScale);
        } else {
          const rawTx = state.current.lastTx + gestureState.dx;
          const rawTy = state.current.lastTy + gestureState.dy;

          // Clamp during pan so the image never shows a gap live
          const { tx: newTx, ty: newTy } = clampTranslation(
            rawTx,
            rawTy,
            state.current.scale,
          );

          state.current.tx = newTx;
          state.current.ty = newTy;

          translateX.setValue(newTx);
          translateY.setValue(newTy);
        }
      },

      onPanResponderRelease: () => {
        // Clamp on release too, to catch any edge cases from pinch+pan
        const { tx, ty } = clampTranslation(
          state.current.tx,
          state.current.ty,
          state.current.scale,
        );

        state.current.tx = tx;
        state.current.ty = ty;
        state.current.lastTx = tx;
        state.current.lastTy = ty;
        state.current.lastScale = state.current.scale;
        state.current.initialDistance = 0;

        translateX.setValue(tx);
        translateY.setValue(ty);

        emitTransform();
      },
    }),
  ).current;

  const handleReset = () => {
    state.current = {
      tx: 0,
      ty: 0,
      scale: 1,
      lastTx: 0,
      lastTy: 0,
      lastScale: 1,
      initialDistance: 0,
    };

    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    emitTransform();
  };

  return (
    <View>
      <View
        style={[
          styles.editorContainer,
          {
            width: cropWidth,
            height: cropHeight,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Animated.View
          style={{
            position: "absolute",

            width: imageSize.fittedWidth,
            height: imageSize.fittedHeight,

            left: (cropWidth - imageSize.fittedWidth) / 2,
            top: (cropHeight - imageSize.fittedHeight) / 2,

            transform: [{ translateX }, { translateY }, { scale }],
          }}
        >
          <Image
            source={{ uri }}
            style={{
              width: imageSize.fittedWidth,
              height: imageSize.fittedHeight,
            }}
          />
        </Animated.View>

        <CropFrame width={cropWidth} height={cropHeight} />
      </View>

      <TouchableOpacity
        style={styles.resetButton}
        onPress={handleReset}
        activeOpacity={0.75}
      >
        <Text style={styles.resetButtonText}>Reset position</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Sheet ────────────────────────────────────────────────────────────────────

const PhotoEditSheet: React.FC<PhotoEditSheetProps> = ({
  uri,
  index,
  onCancel,
  onRetake,
  onConfirm,
}) => {
  const { session } = useSession();

  const slotAspectRatio = useMemo(() => {
    if (!session.layout) {
      return 1;
    }

    return getSlotAspectRatio(session.layout.name.split(" ")[1] as LayoutType);
  }, [session.layout]);

  const cropWidth = EDITOR_WIDTH;
  const cropHeight = cropWidth / slotAspectRatio;

  const currentTransform = useRef<ImageTransform>({
    translateX: 0,
    translateY: 0,
    scale: 1,

    originalWidth: 0,
    originalHeight: 0,

    fittedWidth: 0,
    fittedHeight: 0,
  });

  return (
    <View style={styles.sheet}>
      <View style={styles.handle} />
      <Text style={styles.label}>Photo {index + 1}</Text>

      {uri ? (
        <ImageEditor
          uri={uri}
          cropWidth={cropWidth}
          cropHeight={cropHeight}
          onTransformChange={(t) => {
            currentTransform.current = t;
          }}
        />
      ) : (
        <View
          style={[
            styles.imagePlaceholder,
            {
              width: cropWidth,
              height: cropHeight,
            },
          ]}
        >
          <Text style={styles.imagePlaceholderText}>No photo</Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          activeOpacity={0.75}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.retakeButton}
          onPress={() => onRetake(index)}
          activeOpacity={0.85}
        >
          <Text style={styles.retakeButtonText}>Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => onConfirm(index, currentTransform.current)}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sheet: {
    width: "100%",
    backgroundColor: colors.bgCard,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.bgButtonOption,
    alignSelf: "center",
    marginBottom: 4,
  },
  label: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textMain,
    textAlign: "center",
  },
  editorContainer: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000",
    alignSelf: "center",
  },
  resetButton: {
    alignSelf: "center",
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: colors.bgButtonOption,
  },
  resetButtonText: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: "500",
  },
  imagePlaceholder: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgButtonOption,
    borderRadius: 16,
  },
  imagePlaceholderText: {
    color: colors.accent,
    fontSize: 15,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.bgButtonOption,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMain,
  },
  retakeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.bgCard,
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: "center",
  },
  retakeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.accent,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});

export default PhotoEditSheet;
