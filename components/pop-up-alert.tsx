// components/pop-up-alert.tsx
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { globalStyles } from "../styles/global";
import { colors } from "../styles/theme";

// ─── Types ─────────────────────────────────────────────────────────────────

export type AlertButton = {
  label: string;
  onPress: () => void;
  /** Defaults to "primary". Use "secondary" for cancel-style actions. */
  variant?: "primary" | "secondary";
};

export type PopupAlertProps = {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  /** Called when the backdrop is tapped. Wire it to close the alert. */
  onDismiss?: () => void;
  /**
   * Fires once the underlying native Modal has fully finished closing.
   * iOS fires this reliably via Modal's onDismiss. Android's Modal does
   * not support onDismiss, so callers should pair this with a timeout
   * fallback if they need a cross-platform "fully closed" signal.
   */
  onFullyDismissed?: () => void;
};

// ─── Component ─────────────────────────────────────────────────────────────

export default function PopupAlert({
  visible,
  title,
  message,
  buttons = [],
  onDismiss,
  onFullyDismissed,
}: PopupAlertProps) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 18,
          stiffness: 260,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 130,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 130,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
      onDismiss={onFullyDismissed}
    >
      {/* Backdrop */}
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />

        <Animated.View
          style={[
            styles.card,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Optional message */}
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {/* Divider */}
          {buttons.length > 0 && <View style={styles.divider} />}

          {/* Buttons */}
          <View style={styles.buttonRow}>
            {buttons.map((btn, idx) => (
              <AlertActionButton key={idx} btn={btn} />
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Internal button ───────────────────────────────────────────────────────

function AlertActionButton({ btn }: { btn: AlertButton }) {
  const isPrimary = (btn.variant ?? "primary") === "primary";

  return (
    <Pressable
      onPress={btn.onPress}
      style={({ pressed }) => [
        styles.actionButton,
        isPrimary ? styles.actionButtonPrimary : styles.actionButtonSecondary,
        pressed && styles.actionButtonPressed,
      ]}
    >
      <Text
        style={[
          styles.actionButtonText,
          isPrimary
            ? styles.actionButtonTextPrimary
            : styles.actionButtonTextSecondary,
        ]}
      >
        {btn.label}
      </Text>
    </Pressable>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(78, 3, 62, 0.45)", // bgHeader tinted scrim
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignSelf: "stretch",
    maxWidth: 360,
    ...Platform.select({
      ios: {
        shadowColor: colors.buttonShadow.shadowColor,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 18,
      },
      android: {
        elevation: 10,
      },
    }),
  },

  title: {
    ...globalStyles.screenTitle,
    fontSize: 20,
    marginBottom: 8,
    color: colors.bgHeader,
  },

  message: {
    ...globalStyles.bodyText,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMain,
    marginBottom: 4,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(78, 3, 62, 0.18)",
    marginTop: 20,
    marginBottom: 16,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },

  actionButton: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    overflow: "hidden",
  },

  actionButtonPrimary: {
    backgroundColor: colors.accent,
    ...Platform.select({
      ios: {
        shadowColor: colors.buttonShadow.shadowColor,
        shadowOffset: colors.buttonShadow.shadowOffset,
        shadowOpacity: colors.buttonShadow.shadowOpacity,
        shadowRadius: colors.buttonShadow.shadowRadius,
      },
      android: {
        elevation: colors.buttonShadow.elevation,
      },
    }),
  },

  actionButtonSecondary: {
    backgroundColor: colors.bgButtonOption,
    borderWidth: 1.5,
    borderColor: "rgba(255, 64, 137, 0.35)",
  },

  actionButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },

  actionButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },

  actionButtonTextPrimary: {
    color: colors.textHeader,
  },

  actionButtonTextSecondary: {
    color: colors.bgHeader,
  },
});
