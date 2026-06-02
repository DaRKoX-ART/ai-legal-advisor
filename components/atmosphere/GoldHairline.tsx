import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, ViewStyle } from "react-native";

import { palette } from "@/constants/theme";

type Props = {
  style?: ViewStyle;
};

export function GoldHairline({ style }: Props) {
  return (
    <LinearGradient
      colors={[palette.goldRule0, palette.goldRule1, palette.goldRule0]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[styles.rule, style]}
    />
  );
}

const styles = StyleSheet.create({
  rule: { height: 1, width: "100%" },
});
