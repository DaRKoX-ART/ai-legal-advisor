import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View, type ViewStyle } from "react-native";

import { palette } from "@/constants/theme";

type Props = {
  /** Color of the scan line (default burgundy). */
  color?: string;
  /** Sweep duration in ms (default 2400). */
  duration?: number;
  /** Vertical = top→bottom (default). Horizontal would need explicit width. */
  orientation?: "vertical" | "horizontal";
  /** Show a soft glow trailing the line (default true). */
  withGlow?: boolean;
  /** Container style (must constrain dimensions). */
  style?: ViewStyle;
};

/**
 * Animated scan line — a thin burgundy stroke that sweeps continuously
 * across the parent. Used on the loading state and the Home ink CTA
 * to evoke "AI scanning a document."
 *
 * Place inside a parent with defined dimensions and `overflow: hidden`.
 */
export function ScanLine({
  color,
  duration = 2400,
  orientation = "vertical",
  withGlow = true,
  style,
}: Props) {
  const t = useRef(new Animated.Value(0)).current;
  const c = color ?? palette.accent;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(t, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, duration]);

  // 0 → 1 → 0 sweep. Translate Y from -10% to 110%.
  const translate = t.interpolate({
    inputRange: [0, 1],
    outputRange: ["-10%", "110%"],
  });

  if (orientation === "horizontal") {
    return (
      <View
        style={[StyleSheet.absoluteFill, style, { overflow: "hidden" }]}
        pointerEvents="none"
      >
        <Animated.View
          style={[
            styles.lineX,
            { backgroundColor: c, transform: [{ translateX: translate }] },
          ]}
        />
        {withGlow ? (
          <Animated.View
            style={[
              styles.glowX,
              { backgroundColor: c, transform: [{ translateX: translate }] },
            ]}
          />
        ) : null}
      </View>
    );
  }

  return (
    <View
      style={[StyleSheet.absoluteFill, style, { overflow: "hidden" }]}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          styles.lineY,
          { backgroundColor: c, transform: [{ translateY: translate }] },
        ]}
      />
      {withGlow ? (
        <Animated.View
          style={[
            styles.glowY,
            { backgroundColor: c, transform: [{ translateY: translate }] },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  lineY: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.85,
  },
  glowY: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 30,
    opacity: 0.06,
  },
  lineX: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    opacity: 0.85,
  },
  glowX: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 30,
    opacity: 0.06,
  },
});
