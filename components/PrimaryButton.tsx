import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

import {
  motion,
  palette,
  radius,
  shadow,
  spacing,
  typography,
} from "@/constants/theme";

type IconName = React.ComponentProps<typeof Feather>["name"];

type Variant = "ink" | "paper" | "outline" | "danger" | "gold" | "outlineGold";
type Size = "md" | "lg";

// Calmer champagne fill — slightly darker than palette.champagne so the
// CTA reads as premium gold rather than a glowing highlight. Used for the
// "ink"/"gold" variants only. Other champagne uses across the app
// (file numbers, hairlines, mono captions) keep palette.champagne.
const CTA_FILL = "#D4A765";

// Restrained gold shadow under the CTA — about half the spread/opacity
// of shadow.glow, so the button still has presence on the ink canvas
// without feeling like a flashlight.
const CTA_SHADOW = {
  shadowColor: "#E8B86D",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.22,
  shadowRadius: 14,
  elevation: 6,
};

type Props = {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  /**
   * Variants (NOCTURNE redesign):
   *   - "ink"        → champagne fill, obsidian text (the unified primary CTA)
   *   - "gold"       → alias of "ink" for explicitness
   *   - "outlineGold"→ transparent, champagne border + text (secondary on ink)
   *   - "paper"      → ivory glass surface, ink text (legacy/light fallback)
   *   - "outline"    → transparent, blue border + text (legacy/light fallback)
   *   - "danger"     → red fill, white text
   */
  variant?: Variant;
  size?: Size;
  leadingIcon?: IconName;
  trailingIcon?: IconName;
  /** Full-width by default. Set `false` to shrink-wrap. */
  fullWidth?: boolean;
  /** When true (and not disabled), the button breathes a soft gold glow. */
  glow?: boolean;
  accessibilityLabel?: string;
};

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  variant = "ink",
  size = "lg",
  leadingIcon,
  trailingIcon,
  fullWidth = true,
  glow,
  accessibilityLabel,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const glowOp = useRef(new Animated.Value(0)).current;
  const isDisabled = disabled || loading;
  const isChampagne = variant === "ink" || variant === "gold";
  const shouldGlow = isChampagne && !isDisabled && glow !== false;

  // ── Breathing champagne glow (slow sine, only when enabled) ────────────
  useEffect(() => {
    if (!shouldGlow) {
      glowOp.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOp, {
          toValue: 1,
          duration: motion.breath,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowOp, {
          toValue: 0,
          duration: motion.breath,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shouldGlow, glowOp]);

  const pressIn = () => {
    Animated.timing(scale, {
      toValue: 0.97,
      duration: 80,
      useNativeDriver: true,
    }).start();
    if (!isDisabled && Platform.OS !== "web") {
      Haptics.impactAsync(
        variant === "danger"
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light,
      ).catch(() => {});
    }
  };
  const pressOut = () =>
    Animated.timing(scale, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();

  const v = resolveVariant(variant, !!isDisabled);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      style={fullWidth ? styles.fullWidth : undefined}
    >
      <Animated.View
        style={[
          styles.wrap,
          fullWidth && styles.fullWidth,
          { transform: [{ scale }] },
        ]}
      >
        {/* Breathing champagne glow halo — sits behind the pill.
            Restrained amplitude so the button feels alive without glowing. */}
        {shouldGlow ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.glow,
              size === "md" ? styles.glowMd : styles.glowLg,
              {
                opacity: glowOp.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.05, 0.14],
                }),
              },
            ]}
          />
        ) : null}

        <View
          style={[
            styles.base,
            size === "md" ? styles.sizeMd : styles.sizeLg,
            v.container,
            fullWidth && styles.fullWidth,
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={v.text.color as string} />
          ) : (
            <>
              {leadingIcon ? (
                <Feather
                  name={leadingIcon}
                  size={size === "md" ? 14 : 16}
                  color={v.text.color}
                />
              ) : null}
              <Text
                style={[styles.text, v.text, size === "md" && styles.textMd]}
              >
                {label}
              </Text>
              {trailingIcon ? (
                <Feather
                  name={trailingIcon}
                  size={size === "md" ? 14 : 16}
                  color={v.text.color}
                />
              ) : null}
            </>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

type ResolvedVariant = {
  container: ViewStyle;
  text: TextStyle;
};

// ── Variant resolution ──────────────────────────────────────────────────
function resolveVariant(variant: Variant, isDisabled: boolean): ResolvedVariant {
  // Champagne primary — the signature CTA. When disabled, becomes a soft
  // gold outline rather than a faded gold pill (which looks ugly).
  if (variant === "ink" || variant === "gold") {
    if (isDisabled) {
      return {
        container: {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: palette.champagneBorder,
        },
        text: { color: palette.ashLow },
      };
    }
    return {
      container: {
        backgroundColor: CTA_FILL,
        ...CTA_SHADOW,
      },
      text: { color: palette.champagneText },
    };
  }

  if (variant === "outlineGold") {
    return {
      container: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: isDisabled
          ? palette.champagneBorder
          : palette.champagneBorderHi,
      },
      text: { color: isDisabled ? palette.ashLow : palette.champagne },
    };
  }

  if (variant === "paper") {
    return {
      container: {
        backgroundColor: palette.surface,
        ...shadow.sm,
        opacity: isDisabled ? 0.4 : 1,
      },
      text: { color: palette.accent },
    };
  }

  if (variant === "outline") {
    return {
      container: {
        backgroundColor: "transparent",
        borderWidth: 1.5,
        borderColor: palette.accent,
        opacity: isDisabled ? 0.4 : 1,
      },
      text: { color: palette.accent },
    };
  }

  // danger
  return {
    container: {
      backgroundColor: palette.danger,
      opacity: isDisabled ? 0.4 : 1,
    },
    text: { color: palette.white },
  };
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    alignSelf: "flex-start",
  },
  fullWidth: { width: "100%", alignSelf: "stretch" },
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
  },
  sizeLg: { height: 56 },
  sizeMd: { height: 44 },
  text: {
    ...typography.h3,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.1,
  },
  textMd: { fontSize: 13.5 },
  // Glow halo sits behind the pill and is sized slightly larger.
  // Tighter inset + calmer fill so it reads as warmth rather than glow.
  glow: {
    position: "absolute",
    left: -10,
    right: -10,
    backgroundColor: CTA_FILL,
    borderRadius: radius.full,
  },
  glowLg: { top: -6, bottom: -6 },
  glowMd: { top: -5, bottom: -5 },
});
