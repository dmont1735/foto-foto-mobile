// utils/OffscreenCapture.tsx
import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { captureRef } from "react-native-view-shot";

type CaptureJob = {
  component: React.FC<{ color: string; width: number; height: number }>;
  color: string;
  width: number;
  height: number;
  resolve: (uri: string) => void;
  reject: (err: unknown) => void;
};

// Singleton queue — avoids needing to mount multiple captures at once
let _pendingJob: CaptureJob | null = null;
let _setJob: ((job: CaptureJob | null) => void) | null = null;

export const OffscreenCapture = {
  capture(job: CaptureJob) {
    _pendingJob = job;
    _setJob?.(job);
  },
};

/**
 * Mount this once at the root of your app (e.g. in App.tsx).
 * It stays invisible and only activates when a capture is requested.
 */
export const OffscreenCaptureHost: React.FC = () => {
  const [job, setJob] = React.useState<CaptureJob | null>(null);
  const viewRef = useRef<View>(null);

  useEffect(() => {
    _setJob = setJob;
    return () => {
      _setJob = null;
    };
  }, []);

  useEffect(() => {
    if (!job || !viewRef.current) return;

    captureRef(viewRef, { format: "png", quality: 1 })
      .then((uri) => {
        job.resolve(uri);
        setJob(null);
      })
      .catch((err) => {
        job.reject(err);
        setJob(null);
      });
  }, [job]);

  if (!job) return null;

  const { component: BgComponent, color, width, height } = job;

  return (
    <View
      ref={viewRef}
      style={[
        StyleSheet.absoluteFillObject,
        { opacity: 0, pointerEvents: "none", width, height },
      ]}
      collapsable={false}
    >
      <BgComponent color={color} width={width} height={height} />
    </View>
  );
};
