import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { motion, palette, typography } from "@/constants/theme";

type Props = {
  done: number;
  total: number;
  /** Optional small label shown on the right side of the row. */
  label?: string;
};

/**
 * Section-header progress meter.
 *
 *   3/5 הושלמו                  ▮▮▮▯▯
 *
 * Segmented "ink" dots for small totals (≤ 8) so each tick is visible
 * as a discrete step. For longer lists we fall back to a continuous
 * bar to avoid crowding. The transition between values is animated.
 */
export function ChecklistProgress({ done, total, label }: Props) {
  const ratio = total > 0 ? done / total : 0;
  const anim = useRef(new Animated.Value(ratio)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: ratio,
      duration: motion.slow,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [ratio, anim]);

  const widthInterpolated = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // For short checklists render discrete segment ticks; for longer
  // ones fall back to a continuous bar to avoid visual crowding.
  const segmentMode = total > 0 && total <= 8;

  return (
    <View style={s.wrap}>
      <View style={s.head}>
        <Text style={s.count}>
          {done}/{total} הושלמו
        </Text>
        {label ? <Text style={s.label}>{label}</Text> : null}
      </View>
      {segmentMode ? (
        <View style={s.segRow}>
          {Array.from({ length: total }).map((_, i) => {
            const filled = i < done;
            return (
              <View
                key={i}
                style={[
                  s.segment,
                  filled ? s.segmentOn : s.segmentOff,
                ]}
              />
            );
          })}
        </View>
      ) : (
        <View style={s.track}>
          <Animated.View style={[s.fill, { width: widthInterpolated }]} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 8 },
  head: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  count: {
    ...typography.mono,
    fontSize: 10.5,
    color: palette.textSecondary,
    letterSpacing: 1.4,
  },
  label: {
    ...typography.mono,
    fontSize: 9.5,
    color: palette.textMuted,
    letterSpacing: 1.4,
  },
  segRow: {
    flexDirection: "row-reverse",
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: 2,
  },
  segmentOn: {
    backgroundColor: palette.accent,
  },
  segmentOff: {
    backgroundColor: palette.surfaceSubtle,
    borderWidth: 1,
    borderColor: palette.border,
  },
  track: {
    height: 4,
    backgroundColor: palette.surfaceSubtle,
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: palette.accent,
    borderRadius: 2,
  },
});
