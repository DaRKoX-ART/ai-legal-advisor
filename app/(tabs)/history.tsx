import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { memo, useCallback, useEffect, useRef } from "react";
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Aurora, auroraVariants, DotGrid, GoldHairline } from "@/components/atmosphere";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Reveal } from "@/components/Reveal";
import { motion, palette, radius, spacing, typography } from "@/constants/theme";
import { CATEGORY_META, useApp } from "@/context/AppContext";
import { useHaptic, useProgress, useReduceMotion } from "@/hooks";
import type { SavedAnswer } from "@/types/answer";

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const { answers, clearAllAnswers, deleteAnswer } = useApp();
  const reduceMotion = useReduceMotion();
  const { impact: hapticImpact, notification: hapticNotification } = useHaptic();

  const onClearAll = () => {
    if (answers.length === 0) return;
    Alert.alert(
      "למחוק את כל התשובות?",
      "פעולה זו תמחק את כל התשובות השמורות במכשיר.",
      [
        { text: "ביטול", style: "cancel" },
        {
          text: "מחק הכל",
          style: "destructive",
          onPress: async () => {
            await clearAllAnswers();
            hapticNotification(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ],
    );
  };

  const count = String(answers.length).padStart(2, "0");

  return (
    <View style={s.root}>
      <Aurora reduceMotion={reduceMotion} gradients={auroraVariants.history} />
      <DotGrid />

      <ScrollView
        contentContainerStyle={[
          s.scroll,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: 120 + Math.max(insets.bottom, 12),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Credit row + gold hairline ── */}
        <Reveal delay={0}>
          <View style={s.creditRow}>
            <Text style={s.wordmark}>F · O · L · I · O</Text>
            <Text style={s.creditCaption}>ארכיון · תשובות שמורות</Text>
          </View>
        </Reveal>

        <Reveal delay={60}>
          <GoldHairline style={{ marginBottom: spacing.lg }} />
        </Reveal>

        {/* ── Hero header — huge count + label ── */}
        <Reveal delay={120}>
          <View style={s.heroRow}>
            <Text style={s.heroCount}>{count}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.heroLabel}>
                {answers.length > 0 ? "תשובות שמורות" : "עדיין ריק"}
              </Text>
              <Text style={s.heroSub}>
                כל התשובות נשמרות במכשיר שלך בלבד.
              </Text>
            </View>
          </View>
        </Reveal>

        {/* ── List ── */}
        {answers.length === 0 ? (
          <Reveal delay={220}>
            <View style={s.empty}>
              <View style={s.emptyMedallion}>
                <Feather name="bookmark" size={22} color={palette.champagne} />
              </View>
              <Text style={s.emptyTitle}>אין תשובות עדיין</Text>
              <Text style={s.emptyBody}>
                שאל את FOLIO שאלה ראשונה והתשובה תופיע כאן.
              </Text>
              <View style={{ height: spacing.lg }} />
              <PrimaryButton
                label="שאל שאלה ראשונה"
                onPress={() => router.replace("/(tabs)/home")}
                trailingIcon="arrow-left"
                variant="ink"
                fullWidth={false}
                glow={!reduceMotion}
              />
            </View>
          </Reveal>
        ) : (
          <View style={s.list}>
            {answers.map((a, i) => (
              <Reveal key={a.id} delay={180 + i * 60} rise={12}>
                <SavedRow
                  answer={a}
                  onDelete={() => deleteAnswer(a.id)}
                />
              </Reveal>
            ))}

            <View style={{ height: spacing.lg }} />
            <GoldHairline />
            <Pressable
              onPress={onClearAll}
              style={({ pressed }) => [s.clearBtn, pressed && { opacity: 0.6 }]}
              accessibilityRole="button"
              accessibilityLabel="מחק את כל התשובות השמורות"
            >
              <Feather name="trash-2" size={14} color={palette.inkDanger} />
              <Text style={s.clearText}>מחק את כל התשובות</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const SavedRow = memo(function SavedRow({
  answer,
  onDelete,
}: {
  answer: SavedAnswer;
  onDelete: () => void;
}) {
  const meta = CATEGORY_META[answer.category];
  const date = new Date(answer.createdAt).toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const { totalItems, doneItems, progress, isComplete } = useProgress(answer);
  const { impact: hapticImpact } = useHaptic();

  const handlePress = useCallback(() => {
    router.push(`/saved/${answer.id}`);
  }, [answer.id]);

  const pressScale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.timing(pressScale, {
      toValue: 0.985,
      duration: 90,
      useNativeDriver: true,
    }).start();
  const pressOut = () =>
    Animated.timing(pressScale, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();

  const onLongPress = () => {
    hapticImpact(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(answer.title, undefined, [
      { text: "ביטול", style: "cancel" },
      {
        text: "מחק",
        style: "destructive",
        onPress: () => {
          Alert.alert("למחוק תשובה זו?", undefined, [
            { text: "ביטול", style: "cancel" },
            { text: "מחק", style: "destructive", onPress: onDelete },
          ]);
        },
      },
    ]);
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      accessibilityRole="button"
      accessibilityLabel={`${answer.title} — ${answer.category}, ${date}`}
      accessibilityHint="הקש פעמיים לפתיחה, הקשה ארוכה כדי למחוק"
    >
      <Animated.View style={[s.row, { transform: [{ scale: pressScale }] }]}>
        {/* Right-edge gold rail (RTL leading edge) */}
        <View style={s.rowRail} />

        <View style={s.rowContent}>
          <View style={s.rowTop}>
            <View
              style={[
                s.categoryChip,
                {
                  backgroundColor: meta.color + "22",
                  borderColor: meta.color + "55",
                },
              ]}
            >
              <View style={[s.categoryDot, { backgroundColor: meta.color }]} />
              <Text style={[s.rowCategory, { color: meta.color }]}>
                {answer.category}
              </Text>
            </View>
            <Text style={s.rowDate}>{date}</Text>
            {answer.source === "demo" ? (
              <View style={s.demoChip}>
                <Text style={s.rowDemo}>דמו</Text>
              </View>
            ) : null}
          </View>

          <Text style={s.rowTitle} numberOfLines={2}>
            {answer.title}
          </Text>
          <Text style={s.rowBrief} numberOfLines={2}>
            {answer.brief}
          </Text>

          {totalItems > 0 ? (
            <View style={s.progressRow}>
              <View style={s.progressTrack}>
                <View
                  style={[
                    s.progressFill,
                    {
                      width: `${Math.round(progress * 100)}%`,
                      backgroundColor: isComplete
                        ? palette.inkSuccess
                        : palette.champagne,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  s.progressLabel,
                  { color: isComplete ? palette.inkSuccess : palette.champagne },
                ]}
              >
                {String(doneItems).padStart(2, "0")} /{" "}
                {String(totalItems).padStart(2, "0")}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={s.rowChev}>
          <Feather name="chevron-left" size={16} color={palette.champagne} />
        </View>
      </Animated.View>
    </Pressable>
  );
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.ink },
  scroll: {
    paddingHorizontal: spacing.lg,
  },

  // Credit
  creditRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  wordmark: {
    ...typography.mono,
    fontSize: 12,
    letterSpacing: 4,
    color: palette.champagne,
  },
  creditCaption: {
    ...typography.mono,
    fontSize: 10,
    letterSpacing: 2.4,
    color: palette.ash,
  },
  // Hero
  heroRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  heroCount: {
    ...typography.display,
    fontSize: 72,
    lineHeight: 68,
    fontWeight: "900",
    letterSpacing: -3,
    color: palette.champagne,
  },
  heroLabel: {
    ...typography.h1,
    fontSize: 22,
    fontWeight: "800",
    color: palette.bone,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: 8,
  },
  heroSub: {
    ...typography.bodySm,
    fontSize: 13,
    color: palette.ash,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: 4,
    lineHeight: 20,
  },

  // List
  list: { marginTop: spacing.xs },

  row: {
    position: "relative",
    flexDirection: "row-reverse",
    alignItems: "stretch",
    borderWidth: 1,
    borderColor: palette.glassBorder,
    backgroundColor: palette.glassRaised,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    overflow: "hidden",
    minHeight: 44,
  },
  rowRail: {
    width: 3,
    backgroundColor: palette.champagne,
    opacity: 0.85,
    marginVertical: 14,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  rowContent: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  rowTop: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: 6,
  },
  categoryChip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  categoryDot: { width: 5, height: 5, borderRadius: 999 },
  rowCategory: {
    ...typography.label,
    fontSize: 10,
    letterSpacing: 0.6,
    fontWeight: "800",
  },
  rowDate: {
    ...typography.mono,
    fontSize: 10,
    color: palette.ash,
    letterSpacing: 1.2,
  },
  demoChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: palette.champagneSofter,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.champagneBorder,
  },
  rowDemo: {
    ...typography.mono,
    fontSize: 9,
    color: palette.champagne,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  rowTitle: {
    ...typography.h2,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 24,
    color: palette.bone,
    textAlign: "right",
    writingDirection: "rtl",
  },
  rowBrief: {
    ...typography.bodySm,
    fontSize: 13,
    lineHeight: 20,
    color: palette.boneDim,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: 4,
  },
  progressRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: palette.glassHi,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 3,
  },
  progressLabel: {
    ...typography.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: "800",
  },
  rowChev: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },

  // Clear all
  clearBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  clearText: {
    ...typography.bodySm,
    fontSize: 13,
    color: palette.inkDanger,
    fontWeight: "700",
  },

  // Empty
  empty: {
    alignItems: "center",
    paddingTop: spacing.xl,
  },
  emptyMedallion: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: palette.glass,
    borderWidth: 1,
    borderColor: palette.champagneBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h1,
    fontSize: 22,
    fontWeight: "800",
    color: palette.bone,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  emptyBody: {
    ...typography.bodySm,
    fontSize: 13,
    color: palette.ash,
    textAlign: "center",
    writingDirection: "rtl",
    marginTop: 6,
    maxWidth: 280,
    lineHeight: 20,
  },
});
