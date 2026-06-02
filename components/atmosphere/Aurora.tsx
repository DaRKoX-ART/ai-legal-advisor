import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, ViewStyle } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import { motion, palette } from "@/constants/theme";

type GradientDef = {
  id: string;
  cx: string;
  cy: string;
  r: string;
  stops: { offset: string; color: string; opacity: number }[];
};

type Props = {
  reduceMotion?: boolean;
  style?: ViewStyle;
  gradients?: GradientDef[];
};

const DEFAULT_GRADIENTS: GradientDef[] = [
  {
    id: "auroraViolet",
    cx: "32%",
    cy: "28%",
    r: "58%",
    stops: [
      { offset: "0%", color: palette.auroraViolet, opacity: 0.95 },
      { offset: "55%", color: palette.auroraViolet, opacity: 0.22 },
      { offset: "100%", color: palette.ink, opacity: 0 },
    ],
  },
  {
    id: "auroraAmber",
    cx: "78%",
    cy: "42%",
    r: "52%",
    stops: [
      { offset: "0%", color: palette.auroraAmber, opacity: 0.8 },
      { offset: "60%", color: palette.auroraAmber, opacity: 0.16 },
      { offset: "100%", color: palette.ink, opacity: 0 },
    ],
  },
];

const HISTORY_GRADIENTS: GradientDef[] = [
  {
    id: "auroraHistA",
    cx: "68%",
    cy: "22%",
    r: "58%",
    stops: [
      { offset: "0%", color: palette.auroraViolet, opacity: 0.85 },
      { offset: "55%", color: palette.auroraViolet, opacity: 0.18 },
      { offset: "100%", color: palette.ink, opacity: 0 },
    ],
  },
  {
    id: "auroraHistB",
    cx: "22%",
    cy: "44%",
    r: "52%",
    stops: [
      { offset: "0%", color: palette.auroraAmber, opacity: 0.72 },
      { offset: "60%", color: palette.auroraAmber, opacity: 0.14 },
      { offset: "100%", color: palette.ink, opacity: 0 },
    ],
  },
];

export const auroraVariants = {
  default: DEFAULT_GRADIENTS,
  history: HISTORY_GRADIENTS,
};

export function Aurora({
  reduceMotion = false,
  style,
  gradients = DEFAULT_GRADIENTS,
}: Props) {
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      breath.setValue(0.5);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: motion.auroraBreath,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: motion.auroraBreath,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breath, reduceMotion]);

  const opacity = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1],
  });
  const scale = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.05],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, style, { opacity, transform: [{ scale }] }]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 400 400">
        <Defs>
          {gradients.map((g) => (
            <RadialGradient
              key={g.id}
              id={g.id}
              cx={g.cx}
              cy={g.cy}
              r={g.r}
            >
              {g.stops.map((s, i) => (
                <Stop
                  key={i}
                  offset={s.offset}
                  stopColor={s.color}
                  stopOpacity={s.opacity}
                />
              ))}
            </RadialGradient>
          ))}
        </Defs>
        {gradients.map((g) => (
          <Rect key={g.id} width="400" height="400" fill={`url(#${g.id})`} />
        ))}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: -120,
    left: -80,
    right: -80,
    height: 520,
  },
});
