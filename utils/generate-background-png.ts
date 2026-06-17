// utils/generateBackgroundPng.ts
import React from "react";
import { OffscreenCapture } from "./offscreen-capture";

/**
 * Renders a background component off-screen, captures it as PNG,
 * and returns the URI. The component is never visible to the user.
 */
export async function generateBackgroundPngUri(
  component: React.FC<{ color: string; width: number; height: number }>,
  color: string,
  width: number,
  height: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Delegate to the one-shot capture component (see below)
    OffscreenCapture.capture({
      component,
      color,
      width,
      height,
      resolve,
      reject,
    });
  });
}
