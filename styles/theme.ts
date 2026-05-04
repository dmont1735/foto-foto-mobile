// theme/colors.ts

export const colors = {
  bgMain: "rgba(248, 156, 210, 0.68)", // #f89cd2ad
  bgHeader: "#4e033e",
  bgContainer: "rgba(248, 156, 210, 0.58)", // #f89cd293
  bgCard: "#ffd4f6",
  bgCardSelected: "#ff50c5",
  bgButtonOption: "#ffc8dd",
  accent: "#ff4089",
  textHeader: "#fdd1ff", // #fdd1ffff → drop full opacity
  textMain: "#222222", // #222222ff → drop full opacity

  // CSS box-shadow → RN shadow props (split per platform)
  buttonShadow: {
    shadowColor: "#915069",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4, // Android
  },
} as const;

export type Colors = typeof colors;
