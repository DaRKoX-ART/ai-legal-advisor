import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, G, Path, Text, TextPath } from "react-native-svg";

import { palette } from "@/constants/theme";

type Props = {
  /** Outer diameter (default 96). */
  size?: number;
  /** Rim text (looped). */
  topText?: string;
  bottomText?: string;
  /** Center text label (e.g. "AI"). */
  centerLabel?: string;
  /** Center subtitle (e.g. "ANALYSIS"). */
  centerSub?: string;
  /** Ink color (default burgundy). */
  color?: string;
};

/**
 * A burgundy outlined circular legal seal with curved rim text and
 * a center label. Used as the FOLIO brand artifact.
 *
 * Rendered with react-native-svg so the curved type is real type on
 * a path, not faked.
 */
export function CircularSeal({
  size = 96,
  topText = "LEGAL FOLIO · AI ASSISTANT",
  bottomText = "EST · 2026 · PRIVATE",
  centerLabel = "AI",
  centerSub = "ANALYSIS",
  color = palette.accent,
}: Props) {
  const r = size / 2;
  const stroke = 1.4;
  const outer = r - stroke / 2;
  const innerRing = r - 8;
  const textRadius = r - 13;

  // Two arcs:
  //  - top: from left to right across the top
  //  - bottom: from left to right across the bottom (so type reads left→right)
  const topPath = `M ${r - textRadius},${r} A ${textRadius},${textRadius} 0 1 1 ${r + textRadius},${r}`;
  const bottomPath = `M ${r - textRadius},${r} A ${textRadius},${textRadius} 0 1 0 ${r + textRadius},${r}`;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <Path id="topRim" d={topPath} />
          <Path id="bottomRim" d={bottomPath} />
        </Defs>

        {/* Outer ring */}
        <Circle
          cx={r}
          cy={r}
          r={outer}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
        />
        {/* Inner ring */}
        <Circle
          cx={r}
          cy={r}
          r={innerRing}
          stroke={color}
          strokeWidth={0.7}
          fill="none"
          opacity={0.6}
        />

        {/* Rim text */}
        <Text
          fill={color}
          fontSize={size * 0.085}
          fontFamily="monospace"
          fontWeight="700"
          letterSpacing={1.4}
        >
          <TextPath href="#topRim" startOffset="50%" textAnchor="middle">
            {topText}
          </TextPath>
        </Text>
        <Text
          fill={color}
          fontSize={size * 0.085}
          fontFamily="monospace"
          fontWeight="700"
          letterSpacing={1.4}
        >
          <TextPath href="#bottomRim" startOffset="50%" textAnchor="middle">
            {bottomText}
          </TextPath>
        </Text>

        {/* Center mark */}
        <G>
          <Text
            x={r}
            y={r - 2}
            fill={color}
            fontSize={size * 0.28}
            fontWeight="900"
            textAnchor="middle"
          >
            {centerLabel}
          </Text>
          <Text
            x={r}
            y={r + size * 0.16}
            fill={color}
            fontSize={size * 0.075}
            fontFamily="monospace"
            fontWeight="700"
            letterSpacing={1.4}
            textAnchor="middle"
          >
            {centerSub}
          </Text>
        </G>
      </Svg>
    </View>
  );
}
