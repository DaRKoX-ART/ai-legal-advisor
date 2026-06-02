import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle as SvgCircle, Defs, Pattern, Rect } from "react-native-svg";

import { palette } from "@/constants/theme";

type Props = {
  /** Dot opacity (default 0.05). */
  intensity?: number;
  /** Dot spacing in px (default 22). */
  spacing?: number;
  /** Variant — "paper" (dark dots on cream) or "ink" (light dots on ink). */
  variant?: "paper" | "ink";
};

/**
 * Faint dotted grid background — gives the paper canvas a real
 * document/form texture. Uses a single SVG <Pattern> for GPU-efficient
 * rendering instead of hundreds of individual <View> nodes.
 */
export function PaperTexture({
  intensity = 0.05,
  spacing = 22,
  variant = "paper",
}: Props) {
  const color =
    variant === "ink"
      ? `rgba(244,239,227,${intensity})`
      : `rgba(15,17,23,${intensity})`;

  const patternId = `folio-paper-${variant}-${spacing}-${Math.round(intensity * 100)}`;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern
            id={patternId}
            x="0"
            y="0"
            width={spacing}
            height={spacing}
            patternUnits="userSpaceOnUse"
          >
            <SvgCircle cx="0" cy="0" r="0.75" fill={color} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </Svg>
    </View>
  );
}

// Re-export for convenience.
export const _palette = palette;
