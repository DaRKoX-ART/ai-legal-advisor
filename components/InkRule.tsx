import React, { useEffect, useRef } from "react";
import { Animated, Easing, View, type ViewStyle } from "react-native";

import { palette } from "@/constants/theme";

type Props = {
  /** Final width — number or percentage like "100%". Default "100%". */
  width?: number | `${number}%` | "auto";
  /** Thickness in px (default 1). */
  thickness?: number;
  /** Color (default ink). */
  color?: string;
  /** Animate the draw on mount (default true). */
  animate?: boolean;
  /** Duration of the draw (default 600). */
  duration?: number;
  /** Delay before drawing starts (default 0). */
  delay?: number;
  /** Direction — "rtl" (default for RTL) or "ltr". */
  direction?: "rtl" | "ltr";
  style?: ViewStyle;
};

/**
 * Animated ink rule. When mounted, draws from right-to-left
 * (Hebrew direction) at the configured duration.
 *
 * Use as a decorative section opener or transition flourish.
 */
export function InkRule({
  width = "100%",
  thickness = 1,
  color,
  animate = true,
  duration = 600,
  delay = 0,
  direction = "rtl",
  style,
}: Props) {
  const scale = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const c = color ?? palette.text;

  useEffect(() => {
    if (!animate) return;
    const a = Animated.timing(scale, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    a.start();
    return () => a.stop();
  }, [animate, scale, duration, delay]);

  const origin = direction === "rtl" ? "right" : "left";

  return (
    <Animated.View
      style={[
        {
          width,
          height: thickness,
          backgroundColor: c,
          transformOrigin: origin,
          transform: [{ scaleX: scale }],
        },
        style,
      ]}
    >
      <View />
    </Animated.View>
  );
}
