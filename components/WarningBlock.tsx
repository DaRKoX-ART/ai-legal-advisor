import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { palette, radius, spacing, typography } from "@/constants/theme";

type Props = {
  title?: string;
  bullets: string[];
};

export function WarningBlock({ title = "מה לא לעשות", bullets }: Props) {
  if (bullets.length === 0) return null;
  return (
    <View style={s.wrap}>
      <View style={s.rail} />
      <View style={s.body}>
        <View style={s.head}>
          <View style={s.medallion}>
            <Feather name="alert-octagon" size={16} color={palette.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.eyebrow}>אזהרה</Text>
            <Text style={s.title}>{title}</Text>
          </View>
        </View>

        <View style={s.hairline} />

        <View style={s.list}>
          {bullets.map((b, i) => (
            <View key={`${i}-${b.slice(0, 24)}`} style={s.bulletRow}>
              <View style={s.bulletGlyph}>
                <Text style={s.bulletGlyphText}>×</Text>
              </View>
              <Text style={s.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: "row-reverse",
    backgroundColor: palette.dangerSoft,
    borderWidth: 1,
    borderColor: palette.dangerBorder,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  rail: {
    width: 5,
    backgroundColor: palette.danger,
  },
  body: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },

  head: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.sm,
  },
  medallion: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    ...typography.label,
    fontSize: 9.5,
    color: palette.danger,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "800",
  },
  title: {
    ...typography.h2,
    fontSize: 17,
    fontWeight: "900",
    color: palette.danger,
    letterSpacing: -0.2,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: 1,
  },

  hairline: {
    height: 1,
    backgroundColor: palette.dangerBorder,
  },

  list: { gap: 10 },
  bulletRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  bulletGlyph: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.2,
    borderColor: palette.danger,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  bulletGlyphText: {
    ...typography.h3,
    fontSize: 13,
    color: palette.danger,
    fontWeight: "900",
    lineHeight: 14,
  },
  bulletText: {
    flex: 1,
    ...typography.body,
    fontSize: 14.5,
    lineHeight: 23,
    color: palette.text,
    textAlign: "right",
    writingDirection: "rtl",
    fontWeight: "500",
  },
});
