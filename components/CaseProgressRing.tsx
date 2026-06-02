import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import { motion, palette, typography } from "@/constants/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  done: number;
  total: number;
  size?: number;
  /** Optional caption rendered below the ring. */
  caption?: string;
};

/**
 * Circular case-progress ring used on the saved answer detail page.
 *
 *   - SVG stroke arc that animates between values (eases in/out).
 *   - Burgundy stroke while in progress.
 *   - Switches to `palette.ok` and stamps "סגור" once the case is
 *     fully complete (every action + evidence ticked off).
 *   - Subtle "scan" sweep behind the number when done flips upward.
 *
 * Designed to be the report's payoff moment — one clear visualization
 * of progress in a calm, document-style frame.
 */
export function CaseProgressRing({
  done,
  total,
  size = 104,
  caption = "פעולות הושלמו",
}: Props) {
  const ratio = total > 0 ? Math.min(1, Math.max(0, done / total)) : 0;
  const complete = total > 0 && done >= total;

  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: ratio,
      duration: motion.slow,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [ratio, anim]);

  // A faint scale pop when the ring completes — tactile reward.
  const pop = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!complete) return;
    Animated.sequence([
      Animated.timing(pop, {
        toValue: 1.06,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(pop, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [complete, pop]);

  const strokeDashoffset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [c, 0],
  });
  const ringColor = complete ? palette.success : palette.accent;
  const trackColor = palette.surfaceSubtle;

  return (
    <View style={s.wrap}>
      <Animated.View style={{ transform: [{ scale: pop }], width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* Track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={trackColor}
            strokeWidth={stroke}
            fill="none"
          />
          {/* Progress */}
          <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={ringColor}
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${c}, ${c}`}
              strokeDashoffset={strokeDashoffset}
            />
          </G>
        </Svg>

        {/* Center stamp */}
        <View style={[s.center, { width: size, height: size }]} pointerEvents="none">
          {complete ? (
            <Text style={[s.stamp, { color: palette.success, borderColor: palette.success }]}>
              סגור
            </Text>
          ) : (
            <>
              <Text style={s.bigNum}>{done}</Text>
              <View style={s.divider} />
              <Text style={s.smallNum}>{total}</Text>
            </>
          )}
        </View>
      </Animated.View>

      <Text style={s.caption}>{caption}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  center: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  bigNum: {
    ...typography.display,
    fontSize: 30,
    lineHeight: 32,
    color: palette.text,
    fontWeight: "900",
    letterSpacing: -1,
  },
  divider: {
    width: 18,
    height: 1,
    backgroundColor: palette.border,
    marginVertical: 2,
  },
  smallNum: {
    ...typography.mono,
    fontSize: 11,
    color: palette.textMuted,
    letterSpacing: 1.4,
  },
  stamp: {
    ...typography.mono,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 3,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    transform: [{ rotate: "-6deg" }],
  },
  caption: {
    ...typography.mono,
    fontSize: 10,
    color: palette.textMuted,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    marginTop: 2,
  },
});
