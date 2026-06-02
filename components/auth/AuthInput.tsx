import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { palette, radius, spacing, typography } from "@/constants/theme";

type Props = Omit<TextInputProps, "style"> & {
  containerStyle?: ViewStyle;
  error?: string;
};

export function AuthInput({
  containerStyle,
  error,
  ...rest
}: Props) {
  return (
    <View style={containerStyle}>
      <TextInput
        {...rest}
        placeholderTextColor={palette.ashLow}
        selectionColor={palette.champagne}
        textAlign="right"
        style={[s.input, error ? s.inputError : null]}
      />
      {error ? <Text style={s.errorText}>{error}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  input: {
    ...typography.bodyLg,
    fontSize: 16,
    lineHeight: 24,
    color: palette.bone,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    backgroundColor: palette.glassRaised,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    textAlign: "right",
    writingDirection: "rtl",
  },
  inputError: {
    borderColor: palette.inkDanger,
    backgroundColor: palette.inkDangerSoft,
  },
  errorText: {
    ...typography.caption,
    color: palette.inkDanger,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: spacing.xs,
  },
});
