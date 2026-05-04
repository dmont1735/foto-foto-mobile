// styles/global.ts
import { Platform, StyleSheet } from "react-native";
import { colors } from "./theme";

const MAX_CONTENT_WIDTH = 500;

export const globalStyles = StyleSheet.create({
  // ─── Layout ────────────────────────────────────────────
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgMain,
  },

  contentBlock: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
    paddingHorizontal: "5%",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  // ─── Typography ────────────────────────────────────────
  screenTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    width: "100%",
    color: colors.textMain,
  },

  bodyText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    width: "100%",
    color: colors.textMain,
  },

  // ─── Images ────────────────────────────────────────────
  heroImage: {
    resizeMode: "contain",
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    aspectRatio: 3 / 4,
    alignSelf: "center",
  },

  // ─── Buttons ───────────────────────────────────────────
  button: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    overflow: "hidden",
    alignSelf: "center",
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    paddingVertical: 14,
    paddingHorizontal: 24,
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

  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },

  buttonText: {
    color: colors.textHeader,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});
