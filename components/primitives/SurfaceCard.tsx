import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";

import { palette, radius } from "@/constants/theme";

type Props = ViewProps & {
  children: React.ReactNode;
  variant?: "glass" | "glassRaised" | "danger" | "warning";
};

/**
 * Reusable glassmorphism card surface.
 *
 * Variants:
 *   - glass       → resting glass background
 *   - glassRaised → slightly lifted glass (default)
 *   - danger      → danger-tinted surface
 *   - warning     → warning-tinted surface
 */
export function SurfaceCard({
  children,
  variant = "glassRaised",
  style,
  ...rest
}: Props) {
  const backgroundColor =
    variant === "glass"
      ? palette.glass
      : variant === "danger"
        ? palette.dangerSoft
        : variant === "warning"
          ? palette.warningSoft
          : palette.glassRaised;

  const borderColor =
    variant === "danger"
      ? palette.dangerBorder
      : variant === "warning"
        ? palette.warningBorder
        : palette.glassBorder;

  return (
    <View
      style={[
        styles.base,
        { backgroundColor, borderColor },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
});
