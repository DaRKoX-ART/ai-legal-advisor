import React, { useEffect, useRef } from "react";
import { Animated, Easing, type ViewStyle } from "react-native";

import { motion } from "@/constants/theme";

type Props = {
  children: React.ReactNode;
  /** Delay before this element starts revealing, in ms. */
  delay?: number;
  /** Duration of the reveal, in ms. Default: motion.base. */
  duration?: number;
  /** Pixel distance to rise from. Default: motion.riseMd. */
  rise?: number;
  /** Run the animation only once on mount. Default: true. */
  once?: boolean;
  style?: ViewStyle;
};

/**
 * Reveal — wraps any content in a tasteful fade + rise entrance.
 *
 *   - Single Animated.Value drives both opacity and translateY (cheap)
 *   - useNativeDriver always on
 *   - Default rhythm matches `motion.base` so screens breathe in sync
 *
 * Use to stagger compose entrances:
 *   <Reveal delay={0}>{hero}</Reveal>
 *   <Reveal delay={120}>{cta}</Reveal>
 *   <Reveal delay={240}>{tail}</Reveal>
 */
export function Reveal({
  children,
  delay = 0,
  duration = motion.base,
  rise = motion.riseMd,
  once = true,
  style,
}: Props) {
  const t = useRef(new Animated.Value(0)).current;
  const startedRef = useRef(false);

  useEffect(() => {
    if (once && startedRef.current) return;
    startedRef.current = true;
    Animated.timing(t, {
      toValue: 1,
      delay,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [t, delay, duration, once]);

  const translateY = t.interpolate({
    inputRange: [0, 1],
    outputRange: [rise, 0],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
