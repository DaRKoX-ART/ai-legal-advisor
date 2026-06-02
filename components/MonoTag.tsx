import React from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  palette,
  spacing,
  typography,
  urgencyColors,
} from "@/constants/theme";
import type { LegalUrgency } from "@/types/legal";

type Tone = "neutral" | "info" | "accent" | "ok" | "warn" | "ink" | "paper";

type Props = {
  label: string;
  tone?: Tone;
  urgency?: LegalUrgency;
  filled?: boolean;
};

export function MonoTag({ label, tone = "neutral", urgency, filled }: Props) {
  const pack = urgency ? urgencyToTone(urgency) : tonePack[tone];

  return (
    <View
      style={[
        styles.tag,
        filled
          ? { backgroundColor: pack.fg, borderColor: pack.fg }
          : { backgroundColor: pack.bg, borderColor: pack.border },
      ]}
    >
      <Text
        style={[styles.text, { color: filled ? palette.white : pack.fg }]}
        numberOfLines={1}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

function urgencyToTone(u: LegalUrgency) {
  return urgencyColors[u];
}

const tonePack: Record<Tone, { fg: string; bg: string; border: string }> = {
  neutral: {
    fg: palette.textMuted,
    bg: "transparent",
    border: palette.border,
  },
  info: {
    fg: palette.accent,
    bg: palette.accentSoft,
    border: palette.accentBorder,
  },
  accent: {
    fg: palette.accent,
    bg: palette.accentSoft,
    border: palette.accentBorder,
  },
  ok: { fg: palette.success, bg: palette.successSoft, border: palette.successBorder },
  warn: { fg: palette.warning, bg: palette.warningSoft, border: palette.warningBorder },
  ink: { fg: palette.champagneText, bg: palette.champagne, border: palette.champagne },
  paper: {
    fg: palette.textSecondary,
    bg: "transparent",
    border: palette.border,
  },
};

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  text: {
    ...typography.label,
    fontSize: 9.5,
    letterSpacing: 1.4,
  },
});
