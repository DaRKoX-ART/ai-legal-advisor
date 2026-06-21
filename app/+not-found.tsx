import { LinearGradient } from "expo-linear-gradient";
import { Link, Stack } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { palette, spacing, typography } from "@/constants/theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "404", headerShown: false }} />
      <View style={styles.root}>
        <View style={styles.body}>
          <Text style={styles.code}>FOLIO · ERROR · 404</Text>
          <LinearGradient
            colors={[palette.goldRule0, palette.goldRule1, palette.goldRule0]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.rule}
          />
          <Text style={styles.headline}>הדף לא{"\n"}נמצא.</Text>
          <Text style={styles.body_}>
            הקישור שגוי או שהדף הוסר. חזור אל המסך הראשי כדי להמשיך.
          </Text>
          <Link
            href="/(tabs)/home"
            style={styles.link}
            accessibilityRole="link"
            accessibilityLabel="חזרה לעמוד הבית"
          >
            <Text style={styles.linkText}>חזרה לעמוד הבית →</Text>
          </Link>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    width: "100%",
    paddingHorizontal: spacing.lg,
    alignItems: "flex-end",
  },
  code: {
    ...typography.mono,
    fontSize: 11,
    color: palette.champagne,
    letterSpacing: 2.4,
    marginBottom: spacing.sm,
  },
  rule: { width: "100%", height: 1, marginBottom: spacing.lg },
  headline: {
    ...typography.displayXL,
    fontSize: 64,
    lineHeight: 66,
    fontWeight: "900",
    color: palette.bone,
    letterSpacing: -2,
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: spacing.lg,
  },
  body_: {
    ...typography.bodyLg,
    fontSize: 16,
    color: palette.boneDim,
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  link: { marginTop: spacing.md },
  linkText: {
    ...typography.h3,
    fontSize: 14,
    color: palette.champagne,
    fontWeight: "800",
    letterSpacing: 0.3,
    textAlign: "right",
  },
});
