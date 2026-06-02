import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CaseProgressRing } from "@/components/CaseProgressRing";
import { ChecklistItem } from "@/components/ChecklistItem";
import { ChecklistProgress } from "@/components/ChecklistProgress";
import { Countdown } from "@/components/Countdown";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GlossaryChip } from "@/components/GlossaryChip";
import { LegalAidCard } from "@/components/LegalAidCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Reveal } from "@/components/Reveal";
import { WarningBlock } from "@/components/WarningBlock";
import {
  motion,
  palette,
  radius,
  shadow,
  spacing,
  typography,
} from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { useAnalytics, useHaptic, useProgress } from "@/hooks";
import { composeLawyerPack } from "@/services/lawyerPack";
import type { ActionItem, EvidenceItem } from "@/types/answer";

export default function SavedAnswerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const {
    getAnswer,
    deleteAnswer,
    toggleActionItem,
    setActionItemNote,
    toggleEvidenceItem,
    setEvidenceItemNote,
  } = useApp();

  const answer = useMemo(
    () => (id ? getAnswer(id) : undefined),
    [id, getAnswer],
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const { track } = useAnalytics();

  // Track answer viewed
  const hasTrackedView = useRef(false);
  useEffect(() => {
    if (answer && !hasTrackedView.current) {
      hasTrackedView.current = true;
      track("answer_viewed", {
        request_id: answer.id,
        category: answer.category,
        source: answer.source,
      });
    }
  }, [answer, track]);

  if (!answer) {
    return (
      <View style={s.notFound}>
        <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable
            onPress={() => router.back()}
            style={s.iconBtn}
            accessibilityLabel="חזור"
          >
            <Feather name="chevron-right" size={20} color={palette.text} />
          </Pressable>
          <Text style={s.topTitle}>התיק לא נמצא</Text>
          <View style={s.iconBtn} />
        </View>
        <View style={s.notFoundContent}>
          <Text style={s.notFoundTitle}>התיק כבר לא קיים.</Text>
          <Text style={s.notFoundBody}>
            ייתכן שמחקת אותו. אפשר תמיד לפתוח תיק חדש מהבית.
          </Text>
          <View style={{ height: spacing.lg }} />
          <PrimaryButton
            label="חזרה לבית"
            onPress={() => router.replace("/(tabs)/home")}
            variant="ink"
          />
        </View>
      </View>
    );
  }

  const date = new Date(answer.createdAt);
  const dateLong = date.toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const fileNo = buildFileNumber(answer.id, answer.createdAt);
  const {
    actionDone,
    evidenceDone,
    doneItems: totalDone,
    totalItems: totalSteps,
  } = useProgress(answer);
  const urgency = urgencyMeta(answer.urgency);
  const { impact: hapticImpact, notification: hapticNotification } = useHaptic();

  const onSharePack = async () => {
    setMenuOpen(false);
    hapticImpact(Haptics.ImpactFeedbackStyle.Light);
    try {
      const message = composeLawyerPack(answer);
      await Share.share({ message, title: `FOLIO · ${answer.title}` });
      track("lawyer_pack_shared", { request_id: answer.id, category: answer.category });
    } catch {}
  };

  const onDelete = () => {
    setMenuOpen(false);
    Alert.alert("למחוק את התיק?", "פעולה זו אינה ניתנת לביטול.", [
      { text: "ביטול", style: "cancel" },
      {
        text: "מחק",
        style: "destructive",
        onPress: () => {
          deleteAnswer(answer.id);
          hapticNotification(Haptics.NotificationFeedbackType.Warning);
          router.back();
        },
      },
    ]);
  };

  return (
    <ErrorBoundary>
    <View style={s.root}>
      {/* Top bar */}
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={s.iconBtn}
          accessibilityLabel="חזור"
        >
          <Feather name="chevron-right" size={20} color={palette.text} />
        </Pressable>
        <Text style={s.topTitle}>תיק משפטי</Text>
        <Pressable
          onPress={() => setMenuOpen((v) => !v)}
          style={s.iconBtn}
          accessibilityLabel="אפשרויות"
        >
          <Feather name="more-vertical" size={20} color={palette.text} />
        </Pressable>
      </View>

      {menuOpen ? (
        <View style={[s.menu, { top: insets.top + 64 }]}>
          <Pressable style={s.menuItem} onPress={onSharePack}>
            <Feather name="share" size={16} color={palette.text} />
            <Text style={s.menuLabel}>שתף את התיק</Text>
          </Pressable>
          <View style={s.menuDivider} />
          <Pressable style={s.menuItem} onPress={onDelete}>
            <Feather name="trash-2" size={16} color={palette.danger} />
            <Text style={[s.menuLabel, { color: palette.danger }]}>מחק</Text>
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + 140,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero mast ── */}
        <Reveal delay={0}>
          <DossierMast
            title={answer.title}
            category={answer.category}
            urgency={urgency}
            source={answer.source}
            dateLong={dateLong}
            fileNo={fileNo}
          />
        </Reveal>

        {answer.source === "demo" ? (
          <Reveal delay={motion.staggerSm}>
            <View style={s.demoBanner}>
              <Feather name="info" size={13} color={palette.warning} />
              <Text style={s.demoBannerText}>
                תיק זה הופק במצב דמו — לא נוצר על-ידי מודל AI חי.
              </Text>
            </View>
          </Reveal>
        ) : null}

        {answer.deadlineHint ? (
          <Reveal delay={motion.staggerSm}>
            <View style={s.section}>
              <Countdown hint={answer.deadlineHint} createdAt={answer.createdAt} />
            </View>
          </Reveal>
        ) : null}

        {/* ── Situation ── */}
        <Reveal delay={motion.staggerSm * 2}>
          <View style={s.section}>
            <SectionHead number="01" icon="bookmark" title="המצב" />
            <Text style={s.situation}>{answer.brief}</Text>
            {answer.insight && answer.insight.trim().length > 0 ? (
              <View style={s.insight}>
                <View style={s.insightRail} />
                <View style={s.insightBody}>
                  <Text style={s.insightKicker}>תובנה מרכזית</Text>
                  <Text style={s.insightText}>{answer.insight.trim()}</Text>
                </View>
              </View>
            ) : null}
          </View>
        </Reveal>

        {/* ── Action plan ── */}
        {answer.actionPlan.length > 0 ? (
          <Reveal delay={motion.staggerSm * 3}>
            <View style={s.section}>
              <SectionHead number="02" icon="check-square" title="מה לעשות עכשיו" />
              <View style={s.progressWrap}>
                <ChecklistProgress done={actionDone} total={answer.actionPlan.length} />
              </View>
              <View>
                {answer.actionPlan.map((item) => (
                  <ActionChecklistItem
                    key={item.id}
                    answerId={answer.id}
                    item={item}
                  />
                ))}
              </View>
            </View>
          </Reveal>
        ) : null}

        {/* ── Evidence ── */}
        {answer.evidenceChecklist.length > 0 ? (
          <Reveal delay={motion.staggerSm * 4}>
            <View style={s.section}>
              <SectionHead number="03" icon="folder" title="מה להביא איתך" />
              <View style={s.progressWrap}>
                <ChecklistProgress done={evidenceDone} total={answer.evidenceChecklist.length} />
              </View>
              <View>
                {answer.evidenceChecklist.map((item) => (
                  <EvidenceChecklistItem
                    key={item.id}
                    answerId={answer.id}
                    item={item}
                  />
                ))}
              </View>
            </View>
          </Reveal>
        ) : null}

        {/* ── Warnings ── */}
        {answer.commonMistakes.length > 0 ? (
          <Reveal delay={motion.staggerSm * 5}>
            <View style={s.section}>
              <SectionHead number="04" icon="alert-octagon" title="זהירות" accent />
              <WarningBlock bullets={answer.commonMistakes} />
            </View>
          </Reveal>
        ) : null}

        {/* ── Lawyer questions ── */}
        {answer.lawyerQuestions.length > 0 ? (
          <Reveal delay={motion.staggerSm * 6}>
            <View style={s.section}>
              <SectionHead number="05" icon="message-square" title="לקראת הפגישה עם עורך הדין" />
              {answer.lawyerReason && answer.lawyerReason.trim().length > 0 ? (
                <View style={s.lawyerReasonWrap}>
                  <Feather name="info" size={12} color={palette.textSecondary} style={{ marginLeft: 6, marginTop: 4 }} />
                  <Text style={s.lawyerReason}>{answer.lawyerReason.trim()}</Text>
                </View>
              ) : null}
              <View style={s.qList}>
                {answer.lawyerQuestions.map((q, i) => (
                  <View key={`q-${i}`} style={s.qCard}>
                    <View style={s.qNumWrap}>
                      <Text style={s.qNum}>{String(i + 1).padStart(2, "0")}</Text>
                    </View>
                    <View style={s.qDivider} />
                    <Text style={s.qText}>{q}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Reveal>
        ) : null}

        {/* ── Legal aid ── */}
        {answer.legalAid.length > 0 ? (
          <Reveal delay={motion.staggerSm * 7}>
            <View style={s.section}>
              <SectionHead number="06" icon="phone" title="עזרה משפטית חינם" />
              <LegalAidCard items={answer.legalAid} />
            </View>
          </Reveal>
        ) : null}

        {/* ── Glossary ── */}
        {answer.glossary.length > 0 ? (
          <Reveal delay={motion.staggerSm * 8}>
            <View style={s.section}>
              <SectionHead number="07" icon="book-open" title="מילון משפטי" />
              <View style={s.chipRow}>
                {answer.glossary.map((g, i) => (
                  <GlossaryChip key={`g-${i}-${g.term}`} term={g} />
                ))}
              </View>
            </View>
          </Reveal>
        ) : null}

        {/* ── Explanation ── */}
        <Reveal delay={motion.staggerSm * 9}>
          <View style={s.section}>
            <SectionHead number="08" icon="file-text" title="הסבר משפטי" />
            <Text style={s.explanation}>{answer.explanation}</Text>
          </View>
        </Reveal>

        {/* ── Disclaimer footnote ── */}
        <Reveal delay={motion.staggerSm * 10}>
          <View style={s.footnote}>
            <Text style={s.footnoteKicker}>הצהרה</Text>
            <Text style={s.footnoteText}>{answer.disclaimer}</Text>
          </View>
        </Reveal>

        {/* ── Progress payoff ── */}
        {totalSteps > 0 ? (
          <Reveal delay={motion.staggerSm * 11}>
            <View style={s.completionCard}>
              <View style={s.completionLeft}>
                <Text style={s.completionKicker}>סיכום התיק</Text>
                <Text style={s.completionTitle}>התקדמות{"\n"}פעולות</Text>
                <View style={s.completionMetaRow}>
                  <View style={s.completionDot} />
                  <Text style={s.completionMeta}>
                    {answer.actionPlan.length > 0
                      ? `פעולות ${actionDone}/${answer.actionPlan.length}`
                      : "אין פעולות"}
                  </Text>
                </View>
                <View style={s.completionMetaRow}>
                  <View style={s.completionDot} />
                  <Text style={s.completionMeta}>
                    {answer.evidenceChecklist.length > 0
                      ? `מסמכים ${evidenceDone}/${answer.evidenceChecklist.length}`
                      : "אין מסמכים"}
                  </Text>
                </View>
              </View>
              <CaseProgressRing done={totalDone} total={totalSteps} />
            </View>
          </Reveal>
        ) : null}
      </ScrollView>

      {/* Sticky dock */}
      <Dock
        bottomInset={insets.bottom}
        onShare={onSharePack}
        onNew={() => router.replace("/(tabs)/home")}
      />
    </View>
    </ErrorBoundary>
  );
}

// ── Sub-components ────────────────────────────────────────────────────

type UrgencyMeta = { label: string; color: string; bg: string; border: string };

function DossierMast({
  title,
  category,
  urgency,
  source,
  dateLong,
  fileNo,
}: {
  title: string;
  category: string;
  urgency: UrgencyMeta;
  source: "ai" | "demo";
  dateLong: string;
  fileNo: string;
}) {
  return (
    <View style={s.mast}>
      {/* Top row: category chip + file number */}
      <View style={s.mastTopRow}>
        <View style={[s.categoryChip, { backgroundColor: urgency.bg, borderColor: urgency.border }]}>
          <Text style={[s.categoryChipText, { color: urgency.color }]}>{category}</Text>
        </View>
        <View style={s.mastTopRight}>
          <View style={[s.urgencyDot, { backgroundColor: urgency.color }]} />
          <Text style={s.mastFileNo}>{fileNo}</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={s.mastTitle}>{title}</Text>

      {/* Meta row */}
      <View style={s.mastMeta}>
        <Feather name="calendar" size={11} color={palette.textMuted} style={{ marginLeft: 4 }} />
        <Text style={s.mastMetaText}>{dateLong}</Text>
        <View style={s.mastMetaDot} />
        <View style={[s.mastSourceBadge, source === "demo" && s.mastSourceBadgeDemo]}>
          <Text style={s.mastSourceText}>{source === "ai" ? "AI" : "דמו"}</Text>
        </View>
        <View style={s.mastMetaDot} />
        <Text style={[s.urgencyLabel, { color: urgency.color }]}>{urgency.label}</Text>
      </View>
    </View>
  );
}

function SectionHead({
  number,
  icon,
  title,
  accent = false,
}: {
  number: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  title: string;
  accent?: boolean;
}) {
  const iconColor = accent ? palette.white : palette.accent;
  const bg = accent ? palette.danger : palette.accentLight;
  const border = accent ? palette.dangerBorder : palette.accentBorder;
  return (
    <View style={s.secHead}>
      <View style={[s.secIcon, { backgroundColor: bg, borderColor: border }]}>
        <Feather name={icon} size={14} color={iconColor} />
      </View>
      <Text style={[s.secNum, accent && { color: palette.danger }]}>{number}</Text>
      <Text style={s.secTitle}>{title}</Text>
      <View style={s.secRule} />
    </View>
  );
}

function Dock({
  bottomInset,
  onShare,
  onNew,
}: {
  bottomInset: number;
  onShare: () => void;
  onNew: () => void;
}) {
  const press = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.timing(press, { toValue: 0.96, duration: 90, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.timing(press, { toValue: 1, duration: 140, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();

  return (
    <View
      style={[s.dock, { paddingBottom: Math.max(bottomInset, 12) + spacing.sm }]}
    >
      <Animated.View style={{ transform: [{ scale: press }] }}>
        <Pressable
          onPress={onNew}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={s.dockSecondary}
          accessibilityRole="button"
          accessibilityLabel="שאל שאלה חדשה"
        >
          <Feather name="plus" size={16} color={palette.champagne} />
          <Text style={s.dockSecondaryLabel}>שאלה חדשה</Text>
        </Pressable>
      </Animated.View>
      <View style={{ flex: 1 }}>
        <PrimaryButton
          label="שתף את התיק"
          onPress={onShare}
          trailingIcon="share"
          variant="ink"
        />
      </View>
    </View>
  );
}

// ── Memoized checklist wrappers ────────────────────────────────────────

const ActionChecklistItem = memo(function ActionChecklistItem({
  answerId,
  item,
}: {
  answerId: string;
  item: ActionItem;
}) {
  const { toggleActionItem, setActionItemNote } = useApp();

  const handleToggle = useCallback(() => {
    toggleActionItem(answerId, item.id);
  }, [answerId, item.id, toggleActionItem]);

  const handleNote = useCallback(
    (n: string) => {
      setActionItemNote(answerId, item.id, n);
    },
    [answerId, item.id, setActionItemNote],
  );

  return (
    <ChecklistItem
      id={item.id}
      text={item.text}
      deadline={item.deadline}
      done={item.done}
      note={item.note}
      onToggle={handleToggle}
      onChangeNote={handleNote}
    />
  );
});

const EvidenceChecklistItem = memo(function EvidenceChecklistItem({
  answerId,
  item,
}: {
  answerId: string;
  item: EvidenceItem;
}) {
  const { toggleEvidenceItem, setEvidenceItemNote } = useApp();

  const handleToggle = useCallback(() => {
    toggleEvidenceItem(answerId, item.id);
  }, [answerId, item.id, toggleEvidenceItem]);

  const handleNote = useCallback(
    (n: string) => {
      setEvidenceItemNote(answerId, item.id, n);
    },
    [answerId, item.id, setEvidenceItemNote],
  );

  return (
    <ChecklistItem
      id={item.id}
      text={item.text}
      done={item.done}
      note={item.note}
      variant="evidence"
      onToggle={handleToggle}
      onChangeNote={handleNote}
    />
  );
});

// ── Helpers ────────────────────────────────────────────────────────────
function urgencyMeta(u: "low" | "medium" | "high"): UrgencyMeta {
  if (u === "high") {
    return { label: "גבוהה", color: palette.danger, bg: palette.dangerSoft, border: palette.dangerBorder };
  }
  if (u === "medium") {
    return { label: "בינונית", color: palette.warning, bg: palette.warningSoft, border: palette.warningBorder };
  }
  return { label: "נמוכה", color: palette.textMuted, bg: "transparent", border: palette.border };
}

function buildFileNumber(id: string, createdAt: number): string {
  const year = new Date(createdAt).getFullYear();
  const tail = id.replace(/[^a-z0-9]/gi, "").slice(-4).toUpperCase();
  const padded = (tail + "0000").slice(0, 4);
  return `${year}-${padded}`;
}

// ── Styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },

  // ── Top bar ──
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.champagneBorder,
    backgroundColor: palette.ink,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    ...typography.mono,
    fontSize: 12,
    color: palette.champagne,
    letterSpacing: 2.4,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  // ── Menu ──
  menu: {
    position: "absolute",
    right: spacing.md,
    backgroundColor: palette.inkRaised,
    borderWidth: 1,
    borderColor: palette.champagneBorder,
    borderRadius: radius.lg,
    paddingVertical: 6,
    minWidth: 180,
    zIndex: 20,
    ...shadow.lg,
  },
  menuItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  menuLabel: { ...typography.body, color: palette.text },
  menuDivider: {
    height: 1,
    backgroundColor: palette.border,
    marginHorizontal: spacing.xs,
  },

  // ── Mast ──
  mast: {
    backgroundColor: palette.glassRaised,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.lg,
  },
  mastTopRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  categoryChipText: {
    ...typography.label,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  mastTopRight: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  urgencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mastFileNo: {
    ...typography.mono,
    fontSize: 10,
    color: palette.champagne,
    letterSpacing: 1.8,
    fontWeight: "800",
  },
  mastTitle: {
    ...typography.h1,
    fontSize: 26,
    lineHeight: 32,
    color: palette.text,
    textAlign: "right",
    writingDirection: "rtl",
    fontWeight: "800",
    letterSpacing: -0.4,
    marginBottom: spacing.md,
  },
  mastMeta: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.champagneBorder,
  },
  mastMetaText: {
    ...typography.label,
    fontSize: 11,
    color: palette.textMuted,
  },
  mastMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: palette.borderStrong,
  },
  mastSourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: palette.accentSoft,
    borderRadius: radius.sm,
  },
  mastSourceBadgeDemo: {
    backgroundColor: palette.warningSoft,
  },
  mastSourceText: {
    ...typography.label,
    fontSize: 10,
    color: palette.accent,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  urgencyLabel: {
    ...typography.label,
    fontSize: 11,
    fontWeight: "700",
  },

  // ── Demo banner ──
  demoBanner: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.warningSoft,
    borderWidth: 1,
    borderColor: palette.warningBorder,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  demoBannerText: {
    ...typography.bodySm,
    color: palette.warning,
    flex: 1,
    textAlign: "right",
    writingDirection: "rtl",
    fontWeight: "600",
  },

  // ── Section scaffolding ──
  section: { marginBottom: spacing.xl },
  secHead: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  secIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secNum: {
    ...typography.label,
    fontSize: 11,
    color: palette.textMuted,
    letterSpacing: 1.2,
    fontWeight: "700",
  },
  secTitle: {
    ...typography.h2,
    fontSize: 18,
    color: palette.text,
    fontWeight: "800",
    letterSpacing: -0.2,
    textAlign: "right",
    writingDirection: "rtl",
  },
  secRule: {
    flex: 1,
    height: 1,
    backgroundColor: palette.border,
    marginRight: 4,
  },

  // ── Situation ──
  situation: {
    ...typography.bodyLg,
    fontSize: 17,
    lineHeight: 28,
    color: palette.text,
    textAlign: "right",
    writingDirection: "rtl",
  },
  insight: {
    flexDirection: "row-reverse",
    marginTop: spacing.md,
    backgroundColor: palette.accentLight,
    borderWidth: 1,
    borderColor: palette.accentBorder,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  insightRail: {
    width: 4,
    backgroundColor: palette.accent,
  },
  insightBody: {
    flex: 1,
    padding: spacing.md,
  },
  insightKicker: {
    ...typography.label,
    color: palette.accent,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 6,
    fontWeight: "700",
  },
  insightText: {
    ...typography.body,
    fontSize: 15.5,
    color: palette.text,
    textAlign: "right",
    writingDirection: "rtl",
    fontWeight: "600",
    lineHeight: 25,
  },

  progressWrap: { marginBottom: spacing.md },

  // ── Lawyer questions ──
  lawyerReasonWrap: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    padding: spacing.sm,
    backgroundColor: palette.surfaceSubtle,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  lawyerReason: {
    flex: 1,
    ...typography.bodySm,
    fontSize: 13,
    color: palette.textSecondary,
    fontStyle: "italic",
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 20,
  },
  qList: { gap: 8 },
  qCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.glassRaised,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  qNumWrap: {
    width: 38,
    alignItems: "center",
  },
  qNum: {
    ...typography.mono,
    fontSize: 22,
    color: palette.champagne,
    fontWeight: "800",
    letterSpacing: 1,
  },
  qDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: palette.champagneBorder,
  },
  qText: {
    flex: 1,
    ...typography.body,
    fontSize: 14.5,
    lineHeight: 22,
    color: palette.text,
    textAlign: "right",
    writingDirection: "rtl",
    fontWeight: "500",
  },

  // ── Glossary ──
  chipRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
  },

  // ── Explanation ──
  explanation: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 26,
    color: palette.textSecondary,
    textAlign: "right",
    writingDirection: "rtl",
  },

  // ── Footnote ──
  footnote: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  footnoteKicker: {
    ...typography.label,
    color: palette.textMuted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  footnoteText: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 18,
    color: palette.textMuted,
    textAlign: "right",
    writingDirection: "rtl",
    fontStyle: "italic",
  },

  // ── Completion card ──
  completionCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: palette.glassRaised,
    borderWidth: 1,
    borderColor: palette.champagneBorder,
    borderRadius: radius.xl,
    ...shadow.lg,
  },
  completionLeft: { flex: 1, gap: 4 },
  completionKicker: {
    ...typography.label,
    color: palette.accent,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontWeight: "700",
    textAlign: "right",
  },
  completionTitle: {
    ...typography.h1,
    fontSize: 22,
    lineHeight: 26,
    color: palette.text,
    textAlign: "right",
    writingDirection: "rtl",
    fontWeight: "800",
    letterSpacing: -0.4,
    marginTop: 2,
    marginBottom: 6,
  },
  completionMetaRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  completionDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.border,
  },
  completionMeta: {
    ...typography.bodySm,
    fontSize: 12.5,
    color: palette.textSecondary,
    textAlign: "right",
  },

  // ── Dock ──
  dock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: palette.ink,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.champagneBorder,
  },
  dockSecondary: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    height: 56,
    borderWidth: 1,
    borderColor: palette.champagneBorderHi,
    borderRadius: radius.full,
    backgroundColor: palette.glassRaised,
  },
  dockSecondaryLabel: {
    ...typography.h3,
    fontSize: 13.5,
    color: palette.champagne,
    fontWeight: "800",
  },

  // ── Not found ──
  notFound: { flex: 1, backgroundColor: palette.bg },
  notFoundContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    alignItems: "flex-end",
  },
  notFoundTitle: {
    ...typography.h1,
    fontSize: 22,
    color: palette.text,
    textAlign: "right",
    marginBottom: spacing.sm,
  },
  notFoundBody: {
    ...typography.body,
    color: palette.textSecondary,
    textAlign: "right",
    writingDirection: "rtl",
  },
});
