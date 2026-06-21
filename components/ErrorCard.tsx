import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { palette, spacing, typography } from "@/constants/theme";
import type { LegalAiErrorCode } from "@/types/legal";

const MESSAGES_HE: Record<LegalAiErrorCode, { title: string; body: string }> = {
  AI_UNAVAILABLE: {
    title: "שירות ה-AI אינו זמין כרגע",
    body: "שירות ה-AI אינו זמין כרגע. נסה שוב בעוד רגע.",
  },
  INVALID_INPUT: {
    title: "שאלה לא תקינה",
    body: "ודא שהשאלה אינה ריקה ומכילה לפחות מספר מילים תיאוריות.",
  },
  MISSING_API_KEY: {
    title: "השירות לא הוגדר",
    body: "שירות ה-AI לא הוגדר בצד השרת. פנה למנהל המערכת.",
  },
  UPSTREAM_TIMEOUT: {
    title: "השירות איטי מהרגיל",
    body: "שירות ה-AI לקח יותר מדי זמן להגיב. נסה שוב בעוד רגע.",
  },
  INVALID_AI_RESPONSE: {
    title: "תשובה לא תקינה",
    body: "ה-AI החזיר תשובה לא תקינה. נסה לנסח את השאלה מחדש.",
  },
  NETWORK_ERROR: {
    title: "אין חיבור לשרת",
    body: "לא ניתן להגיע לשרת. בדוק את החיבור לאינטרנט ונסה שוב.",
  },
  RATE_LIMITED: {
    title: "יותר מדי בקשות",
    body: "שלחת הרבה שאלות בזמן קצר. המתן רגע אחד ונסה שוב.",
  },
};

type Props = {
  code: LegalAiErrorCode;
  onRetry?: () => void;
  onShowDemo?: () => void;
  demoEnabled?: boolean;
  /** Theme variant — "paper" default (light), or "ink" for dark canvas. */
  variant?: "paper" | "ink";
};

/**
 * Editorial error notice. No background, no rounded box — just an
 * editorial block with a burgundy hairline rule + status code mono tag
 * + headline + body + inline retry link.
 */
export function ErrorCard({
  code,
  onRetry,
  onShowDemo,
  demoEnabled,
  variant = "paper",
}: Props) {
  const ink = variant === "ink";
  const msg = MESSAGES_HE[code] ?? MESSAGES_HE.AI_UNAVAILABLE;

  const titleColor = ink ? palette.darkText : palette.text;
  const bodyColor = ink ? palette.darkTextSub : palette.textSecondary;
  const accent = ink ? palette.accentOnDark : palette.accent;
  const linkColor = accent;

  return (
    <View style={styles.wrap}>
      <View style={[styles.rule, { backgroundColor: accent }]} />
      <Text style={[styles.code, { color: accent }]}>שגיאה · {code}</Text>
      <Text style={[styles.title, { color: titleColor }]}>{msg.title}</Text>
      <Text style={[styles.body, { color: bodyColor }]}>{msg.body}</Text>

      <View style={styles.actions}>
        {onRetry ? (
          <Pressable
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="נסה שוב"
          >
            <Text style={[styles.link, { color: linkColor }]}>נסה שוב →</Text>
          </Pressable>
        ) : null}
        {demoEnabled && onShowDemo ? (
          <Pressable
            onPress={onShowDemo}
            accessibilityRole="button"
            accessibilityLabel="הצג תשובת דמו"
          >
            <Text style={[styles.linkMuted, { color: bodyColor }]}>
              הצג תשובת דמו →
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: spacing.lg },
  rule: { width: 32, height: 3, marginBottom: spacing.md, alignSelf: "flex-end" },
  code: {
    ...typography.mono,
    fontSize: 11,
    textAlign: "right",
    marginBottom: spacing.xs,
    fontWeight: "800",
    letterSpacing: 2,
  },
  title: {
    ...typography.h1,
    fontSize: 24,
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: spacing.lg,
  },
  actions: { gap: spacing.sm, alignItems: "flex-end" },
  link: {
    ...typography.h3,
    fontSize: 14,
    textAlign: "right",
  },
  linkMuted: {
    ...typography.bodySm,
    textAlign: "right",
  },
});
