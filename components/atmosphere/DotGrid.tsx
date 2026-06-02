import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle as SvgCircle, Defs, Pattern, Rect } from "react-native-svg";

import { palette } from "@/constants/theme";

export function DotGrid() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern
            id="folio-dot-grid"
            x="0"
            y="0"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <SvgCircle
              cx="1"
              cy="1"
              r="0.7"
              fill={palette.bone}
              opacity={0.06}
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#folio-dot-grid)" />
      </Svg>
    </View>
  );
}
