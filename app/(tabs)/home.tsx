import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { memo, useCallback, useMemo, useRef } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Aurora, DotGrid, GoldHairline } from "@/components/atmosphere";
import { Reveal } from "@/components/Reveal";
import { palette, radius, spacing, typography } from "@/constants/theme";
import { CATEGORY_META, useApp } from "@/context/AppContext";
import { useProgress, useReduceMotion } from "@/hooks";
import type { SavedAnswer } from "@/types/answer";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, answers } = useApp();
  const reduceMotion = useReduceMotion();

  const firstName = user?.name?.split(" ")[0] ?? "אורח";
  const recent = useMemo(() => answers.slice(0, 3), [answers]);
  const countLabel = String(answers.length).padStart(2, "0");

  return (
    <View style={s.root}>
      {/* ── Atmospheric backdrops (full-bleed, absolute) ───────────── */}
      <Aurora reduceMotion={reduceMotion} />
      <DotGrid />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            s.scroll,
            {
              paddingTop: insets.top + spacing.lg,
              paddingBottom: 96 + Math.max(insets.bottom, 12) + spacing.lg,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── HERO CREDIT BLOCK ───────────────────────────────── */}
          <Reveal delay={0}>
            <View style={s.creditRow}>
              <Text style={s.wordmark}>F · O · L · I · O</Text>
              <Text style={s.creditCaption}>AI · משפט · ראשוני</Text>
            </View>
          </Reveal>

          <Reveal delay={60}>
            <GoldHairline style={{ marginBottom: spacing.lg }} />
          </Reveal>

          <Reveal delay={120}>
            <Text style={s.heroGreet}>שלום, {firstName}</Text>
          </Reveal>

          <Reveal delay={170}>
            <View style={s.heroMeta}>
              <Text style={s.heroMetaNumber}>{countLabel}</Text>
              <Text style={s.heroMetaDot}>·</Text>
              <Text style={s.heroMetaLabel}>
                {answers.length > 0 ? "תשובות שמורות" : "מוכן/ה לשאלה הראשונה"}
              </Text>
            </View>
          </Reveal>

          {/* ── ASK CARD (opens premium composer) ───────────────── */}
          <Reveal delay={240}>
            <Pressable
              onPress={() => router.push("/ask")}
              style={({ pressed }) => [
                s.askCard,
                pressed && s.askCardPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="שאל שאלה משפטית חדשה"
            >
              <LinearGradient
                colors={[palette.glassRaised, palette.glass]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={s.askCardContent}>
                <View style={s.askCardIconWrap}>
                  <Feather name="edit-3" size={22} color={palette.champagne} />
                </View>
                <View style={s.askCardTextWrap}>
                  <Text style={s.askCardTitle}>שאל/י שאלה משפטית</Text>
                  <Text style={s.askCardSubtitle}>
                    ננסח עבורך תוכנית פעולה ורשימת מסמכים
                  </Text>
                </View>
                <View style={s.askCardArrow}>
                  <Feather
                    name="arrow-left"
                    size={20}
                    color={palette.champagne}
                  />
                </View>
              </View>
            </Pressable>
          </Reveal>

          {/* ── RECENT ANSWERS — premium glass cards ─────────────── */}
          {recent.length > 0 ? (
            <Reveal delay={420}>
              <View style={s.recentHead}>
                <View style={s.sectionTitleRow}>
                  <Text style={s.sectionLabel}>תשובות אחרונות</Text>
                  <Text style={s.sectionNumber}>
                    {String(answers.length).padStart(2, "0")}
                  </Text>
                </View>
                {answers.length > recent.length ? (
                  <Pressable
                    onPress={() => router.push("/(tabs)/history")}
                    style={s.seeAllBtn}
                    accessibilityRole="button"
                    accessibilityLabel="ראה את כל התשובות השמורות"
                  >
                    <Feather
                      name="chevron-left"
                      size={12}
                      color={palette.champagne}
                    />
                    <Text style={s.seeAllText}>הכל</Text>
                  </Pressable>
                ) : null}
              </View>

              {recent.map((a, i) => (
                <RecentCardItem key={a.id} answer={a} index={i} />
              ))}
            </Reveal>
          ) : (
            <Reveal delay={420}>
              <EmptyMedallion />
            </Reveal>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const RecentCardItem = memo(function RecentCardItem({
  answer,
  index,
}: {
  answer: SavedAnswer;
  index: number;
}) {
  const meta = CATEGORY_META[answer.category];
  const { doneItems, totalItems, progress } = useProgress(answer);

  const handlePress = useCallback(() => {
    router.push(`/saved/${answer.id}`);
  }, [answer.id]);

  return (
    <Reveal delay={120 + index * 70} rise={14}>
      <RecentCard
        title={answer.title}
        brief={answer.brief}
        category={answer.category}
        categoryColor={meta.color}
        date={new Date(answer.createdAt)}
        done={doneItems}
        total={totalItems}
        progress={progress}
        onPress={handlePress}
        accessibilityLabel={`${answer.title} — ${answer.category}`}
      />
    </Reveal>
  );
});

const RecentCard = memo(function RecentCard({
  title,
  brief,
  category,
  categoryColor,
  date,
  done,
  total,
  progress,
  onPress,
  accessibilityLabel,
}: {
  title: string;
  brief: string;
  category: string;
  categoryColor: string;
  date: Date;
  done: number;
  total: number;
  progress: number;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
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

  const dateStr = date.toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "short",
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint="פותח את התשובה השמורה"
    >
      <Animated.View style={[s.recentCard, { transform: [{ scale: pressScale }] }]}>
        {/* Right-edge gold rail (RTL accent) */}
        <View style={s.recentRail} />
        <LinearGradient
          colors={[palette.glassRaised, palette.glass]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={s.recentTop}>
          <View
            style={[
              s.categoryChip,
              {
                backgroundColor: categoryColor + "22",
                borderColor: categoryColor + "55",
              },
            ]}
          >
            <View style={[s.categoryDot, { backgroundColor: categoryColor }]} />
            <Text style={[s.categoryLabel, { color: categoryColor }]}>
              {category}
            </Text>
          </View>
          <Text style={s.recentDate}>{dateStr}</Text>
        </View>

        <Text style={s.recentTitle} numberOfLines={2}>
          {title}
        </Text>
        <Text style={s.recentBrief} numberOfLines={2}>
          {brief}
        </Text>

        {total > 0 ? (
          <View style={s.recentProgressRow}>
            <View style={s.recentProgressTrack}>
              <View
                style={[
                  s.recentProgressFill,
                  { width: `${Math.round(progress * 100)}%` },
                ]}
              />
            </View>
            <Text style={s.recentProgressLabel}>
              {String(done).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </Text>
          </View>
        ) : null}

        <View style={s.recentChev}>
          <Feather name="chevron-left" size={16} color={palette.champagne} />
        </View>
      </Animated.View>
    </Pressable>
  );
});

function EmptyMedallion() {
  return (
    <View style={s.emptyWrap}>
      <View style={s.emptyMedallion}>
        <Feather name="bookmark" size={22} color={palette.champagne} />
      </View>
      <Text style={s.emptyTitle}>התשובות שלך יופיעו כאן</Text>
      <Text style={s.emptyBody}>
        כל תשובה נשמרת במכשיר בלבד — כתיק אישי ושקט.
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.ink,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
  },

  // Hero credit
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

  heroGreet: {
    ...typography.display,
    fontSize: 52,
    lineHeight: 56,
    fontWeight: "900",
    letterSpacing: -1.8,
    color: palette.bone,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: spacing.sm,
  },
  heroMeta: {
    flexDirection: "row-reverse",
    alignItems: "baseline",
    gap: spacing.xs,
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },
  heroMetaNumber: {
    ...typography.mono,
    fontSize: 14,
    letterSpacing: 1.2,
    color: palette.champagne,
    fontWeight: "800",
  },
  heroMetaDot: {
    color: palette.ash,
    fontSize: 12,
  },
  heroMetaLabel: {
    ...typography.mono,
    fontSize: 10,
    letterSpacing: 2.2,
    color: palette.ash,
    textTransform: "uppercase",
  },

  // Ask card
  askCard: {
    position: "relative",
    borderWidth: 1,
    borderColor: palette.glassBorder,
    borderRadius: radius.xl,
    overflow: "hidden",
    minHeight: 120,
    marginTop: spacing.sm,
  },
  askCardPressed: {
    borderColor: palette.champagneBorder,
  },
  askCardContent: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    flex: 1,
  },
  askCardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: palette.champagneSoft,
    borderWidth: 1,
    borderColor: palette.champagneBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  askCardTextWrap: {
    flex: 1,
    gap: 4,
  },
  askCardTitle: {
    ...typography.h2,
    fontSize: 18,
    fontWeight: "800",
    color: palette.bone,
    textAlign: "right",
    writingDirection: "rtl",
  },
  askCardSubtitle: {
    ...typography.bodySm,
    fontSize: 13,
    lineHeight: 20,
    color: palette.ash,
    textAlign: "right",
    writingDirection: "rtl",
  },
  askCardArrow: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: palette.glassHi,
    alignItems: "center",
    justifyContent: "center",
  },

  // Recent section
  recentHead: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: "row-reverse",
    alignItems: "baseline",
    gap: spacing.xs,
  },
  sectionLabel: {
    ...typography.h2,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.2,
    color: palette.bone,
  },
  sectionNumber: {
    ...typography.mono,
    fontSize: 11,
    letterSpacing: 1.4,
    color: palette.champagne,
  },
  seeAllBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: palette.champagneBorder,
    borderRadius: radius.full,
    backgroundColor: palette.champagneSofter,
  },
  seeAllText: {
    ...typography.mono,
    fontSize: 10,
    letterSpacing: 1.8,
    color: palette.champagne,
    fontWeight: "800",
  },

  recentCard: {
    position: "relative",
    borderWidth: 1,
    borderColor: palette.glassBorder,
    borderRadius: radius.lg,
    paddingVertical: spacing.md + 2,
    paddingRight: spacing.md + 4,
    paddingLeft: spacing.lg,
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  // Right-edge gold rail (RTL leading edge for Hebrew readers)
  recentRail: {
    position: "absolute",
    right: 0,
    top: 14,
    bottom: 14,
    width: 3,
    backgroundColor: palette.champagne,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    opacity: 0.85,
  },
  recentTop: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
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
  categoryDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
  },
  categoryLabel: {
    ...typography.label,
    fontSize: 10,
    letterSpacing: 0.6,
    fontWeight: "800",
  },
  recentDate: {
    ...typography.mono,
    fontSize: 10,
    color: palette.ash,
    letterSpacing: 1.2,
  },
  recentTitle: {
    ...typography.h2,
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 24,
    color: palette.bone,
    textAlign: "right",
    writingDirection: "rtl",
  },
  recentBrief: {
    ...typography.bodySm,
    fontSize: 13,
    lineHeight: 20,
    color: palette.boneDim,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: 6,
  },
  recentProgressRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  recentProgressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: palette.glassHi,
    borderRadius: 2,
    overflow: "hidden",
  },
  recentProgressFill: {
    height: 3,
    backgroundColor: palette.champagne,
  },
  recentProgressLabel: {
    ...typography.mono,
    fontSize: 10,
    color: palette.champagne,
    letterSpacing: 1.2,
    fontWeight: "800",
  },
  recentChev: {
    position: "absolute",
    left: 14,
    bottom: 16,
  },

  // Empty state
  emptyWrap: {
    alignItems: "center",
    paddingTop: spacing.xxl + spacing.md,
    paddingBottom: spacing.xl,
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
    ...typography.h2,
    fontSize: 18,
    fontWeight: "800",
    color: palette.bone,
    textAlign: "center",
    marginBottom: 6,
  },
  emptyBody: {
    ...typography.bodySm,
    fontSize: 13,
    color: palette.ash,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 20,
  },
});
