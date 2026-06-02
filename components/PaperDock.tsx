// Minimal structural type matching the fields PaperDock actually uses from
// BottomTabBarProps. Avoids depending on @react-navigation/bottom-tabs being
// hoisted by pnpm — the full type is a transitive dep of expo-router.
type TabBarProps = {
  state: {
    routes: { name: string; key: string }[];
    index: number;
  };
  navigation: {
    navigate(name: string): void;
  };
};
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { motion, palette, radius, shadow, spacing } from "@/constants/theme";
import { useHaptic } from "@/hooks";

type IconName = React.ComponentProps<typeof Feather>["name"];

const TABS: { name: string; label: string; icon: IconName }[] = [
  { name: "home", label: "שאלה", icon: "message-circle" },
  { name: "history", label: "שמורים", icon: "bookmark" },
  { name: "about", label: "אני", icon: "user" },
];

/**
 * NOCTURNE dock — floats above the safe area as a single glass pill.
 *
 * Architecture:
 *   - root: positioned wrapper (handles safe-area + side margins)
 *   - card: the floating ink-glass pill (rounded, shadowed, bordered)
 *   - row : tab strip with champagne dot indicator above the active tab
 */
export function PaperDock({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { selection: hapticSelection } = useHaptic();
  const activeIndex = TABS.findIndex(
    (t) => state.routes[state.index]?.name === t.name,
  );

  // Champagne dot slides horizontally above the active tab.
  const dot = useRef(
    new Animated.Value(activeIndex < 0 ? 0 : activeIndex),
  ).current;

  useEffect(() => {
    if (activeIndex < 0) return;
    Animated.spring(dot, {
      toValue: activeIndex,
      tension: 95,
      friction: 11,
      useNativeDriver: false,
    }).start();
  }, [activeIndex, dot]);

  const dotLeft = dot.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ["0%", "33.33%", "66.66%"],
  });

  // Safe area + bottom margin so the pill clearly floats off the screen edge.
  const bottomOffset = Math.max(insets.bottom, 8) + 12;

  return (
    <View pointerEvents="box-none" style={[styles.root, { bottom: bottomOffset }]}>
      <View style={styles.card}>
        {/* Blurred ink-glass backdrop (falls back gracefully on web/Android) */}
        <BlurView
          intensity={Platform.OS === "ios" ? 28 : 18}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        {/* Solid ink tint on top of the blur so the dock is always legible */}
        <View pointerEvents="none" style={styles.tint} />
        {/* Champagne hairline border */}
        <View pointerEvents="none" style={styles.borderRing} />

        <View style={styles.row}>
          {TABS.map((tab, i) => {
            const routeIndex = state.routes.findIndex((r) => r.name === tab.name);
            const active = routeIndex >= 0 && state.index === routeIndex;
            return (
              <TabButton
                key={tab.name}
                tab={tab}
                active={active}
                onPress={() => {
                  hapticSelection();
                  if (routeIndex >= 0) {
                    navigation.navigate(state.routes[routeIndex].name);
                  }
                }}
                isFirst={i === 0}
                isLast={i === TABS.length - 1}
              />
            );
          })}

          {/* Champagne dot above the active tab */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.dotTrack,
              { left: dotLeft } as Animated.AnimatedProps<ViewStyle>,
            ]}
          >
            <View style={styles.dot} />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

function TabButton({
  tab,
  active,
  onPress,
  isFirst: _isFirst,
  isLast: _isLast,
}: {
  tab: { name: string; label: string; icon: IconName };
  active: boolean;
  onPress: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const activeScale = useRef(new Animated.Value(active ? 1 : 0.96)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(activeScale, {
      toValue: active ? 1 : 0.96,
      tension: 120,
      friction: 9,
      useNativeDriver: true,
    }).start();
  }, [active, activeScale]);

  const pressIn = () =>
    Animated.timing(pressScale, {
      toValue: 0.92,
      duration: motion.instant,
      useNativeDriver: true,
    }).start();
  const pressOut = () =>
    Animated.timing(pressScale, {
      toValue: 1,
      duration: motion.fast,
      useNativeDriver: true,
    }).start();

  const iconColor = active ? palette.champagne : palette.boneDim;
  const labelColor = active ? palette.champagne : palette.boneDim;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={styles.tab}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={tab.label}
    >
      <Animated.View
        style={[
          styles.pill,
          { transform: [{ scale: Animated.multiply(activeScale, pressScale) }] },
        ]}
      >
        <Feather name={tab.icon} size={16} color={iconColor} />
        <Text
          style={[
            styles.label,
            { color: labelColor, fontWeight: active ? "800" : "600" },
          ]}
          numberOfLines={1}
        >
          {tab.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const DOCK_HORIZONTAL_MARGIN = spacing.md;

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    left: DOCK_HORIZONTAL_MARGIN,
    right: DOCK_HORIZONTAL_MARGIN,
  },
  card: {
    height: 62,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "rgba(10,9,8,0.55)", // base ink wash under blur
    ...shadow.inkLifted,
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,9,8,0.55)",
  },
  borderRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: palette.champagneBorder,
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
    position: "relative",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  pill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  label: {
    fontSize: 12,
    letterSpacing: -0.1,
  },
  // Champagne dot ─── slides above the active tab
  dotTrack: {
    position: "absolute",
    top: 6,
    width: "33.33%",
    height: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: palette.champagne,
    ...shadow.glow,
  },
});
