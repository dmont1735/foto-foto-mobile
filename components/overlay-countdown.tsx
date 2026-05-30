import React, { useEffect, useRef, useState } from "react";

import { StyleSheet, Text, View } from "react-native";

type OverlayCountdownProps = {
  visible: boolean;

  start?: number;

  cycles?: number;

  delayBetweenCycles?: number;

  onCycleComplete?: (cycle: number) => void | Promise<void>;

  onAllComplete?: () => void;
};

type CountdownState = "counting" | "waiting" | "done";

export default function OverlayCountdown({
  visible,
  start = 3,
  cycles = 3,
  delayBetweenCycles = 2000,
  onCycleComplete,
  onAllComplete,
}: OverlayCountdownProps) {
  const [count, setCount] = useState(start);

  const [cycle, setCycle] = useState(1);

  const [state, setState] = useState<CountdownState>("counting");

  // prevents duplicate execution
  const transitionLock = useRef(false);

  // reset when reopened
  useEffect(() => {
    if (!visible) return;

    setCount(start);
    setCycle(1);
    setState("counting");

    transitionLock.current = false;
  }, [visible, start]);

  // countdown ticking
  useEffect(() => {
    if (!visible) return;

    if (state !== "counting") return;

    if (count <= 0) return;

    const timer = setTimeout(() => {
      setCount((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [visible, state, count]);

  // cycle completion
  useEffect(() => {
    if (!visible) return;

    if (state !== "counting") return;

    if (count !== 0) return;

    // already processing
    if (transitionLock.current) return;

    transitionLock.current = true;

    const completeCycle = async () => {
      await onCycleComplete?.(cycle);

      const isLastCycle = cycle >= cycles;

      if (isLastCycle) {
        setState("done");
        onAllComplete?.();
        return;
      }

      // hide overlay
      setState("waiting");

      setTimeout(() => {
        setCycle((c) => c + 1);
        setCount(start);

        transitionLock.current = false;

        setState("counting");
      }, delayBetweenCycles);
    };

    completeCycle();
  }, [
    visible,
    state,
    count,
    cycle,
    cycles,
    start,
    delayBetweenCycles,
    onCycleComplete,
    onAllComplete,
  ]);

  // hidden during waiting
  if (!visible || state === "waiting" || state === "done") {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <Text style={styles.countdownText}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },

  countdownText: {
    fontSize: 140,
    fontWeight: "900",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: {
      width: 0,
      height: 4,
    },
    textShadowRadius: 16,
  },
});
