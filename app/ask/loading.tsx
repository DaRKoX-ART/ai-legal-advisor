import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ErrorCard } from "@/components/ErrorCard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PrimaryButton } from "@/components/PrimaryButton";
import { DEMO_ENABLED } from "@/constants/legal";
import { palette, radius, spacing, typography } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { useIntake } from "@/context/IntakeContext";
import { askLegal, buildDemoAnswer } from "@/services/legalAi";
import { insertEvent, queueEvent } from "@/services/supabase/analytics";

const MIN_LOADING_MS = 900;

export default function LoadingScreen() {
  const intake = useIntake();
  const insets = useSafeAreaInsets();
  const { saveAnswer, settings } = useApp();

  // The error-card demo button shows when EITHER the build-time
  // EXPO_PUBLIC_ALLOW_DEMO flag is set OR the user toggled "demo on
  // failure" in Settings. The build flag is a hard override for
  // staging/QA; the settings toggle is the user-facing control.
  const demoAvailable = DEMO_ENABLED || settings.demoEnabled;

  const startedRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const navigateToSaved = useCallback(
    (id: string) => {
      const delay = Math.max(
        0,
        MIN_LOADING_MS - (Date.now() - (startedAtRef.current ?? Date.now())),
      );
      timeoutRef.current = setTimeout(() => {
        router.dismissAll();
        router.replace(`/saved/${id}`);
        intake.reset();
      }, delay);
    },
    [intake],
  );

  const runAsk = useCallback(async () => {
    if (!intake.prompt) {
      router.back();
      return;
    }
    startedAtRef.current = Date.now();
    intake.beginSubmit();

    // Analytics: question asked
    const askedEvent = {
      event_type: "question_asked",
      metadata: { question_length: intake.prompt.length, source: "ai" },
      client_timestamp: new Date().toISOString(),
    };

    const res = await askLegal(intake.prompt);
    const latency = Date.now() - (startedAtRef.current ?? Date.now());

    // Analytics: answer received
    const receivedEvent = {
      event_type: "answer_received",
      metadata: {
        success: res.ok,
        latency_ms: latency,
        error_code: res.ok ? undefined : res.error.code,
        category: res.ok ? res.data.category : undefined,
        urgency: res.ok ? res.data.urgency : undefined,
        language: res.ok ? res.data.language : undefined,
      },
      client_timestamp: new Date().toISOString(),
    };

    // Fire-and-forget analytics
    (async () => {
      await insertEvent(askedEvent, null);
      await insertEvent(receivedEvent, null);
    })();

    if (res.ok) {
      const saved = saveAnswer({
        question: intake.prompt,
        title: res.data.title,
        brief: res.data.brief,
        insight: res.data.insight,
        explanation: res.data.explanation,
        actionPlan: res.data.actionPlan,
        evidenceChecklist: res.data.evidenceChecklist,
        commonMistakes: res.data.commonMistakes,
        lawyerReason: res.data.lawyerReason,
        lawyerQuestions: res.data.lawyerQuestions,
        glossary: res.data.glossary,
        deadlineHint: res.data.deadlineHint,
        legalAid: res.data.legalAid,
        category: res.data.category,
        urgency: res.data.urgency,
        disclaimer: res.data.disclaimer,
        language: res.data.language,
        source: res.data.source,
      });
      intake.succeed(saved.id);
      navigateToSaved(saved.id);
    } else {
      intake.fail(res.error.code);
    }
  }, [intake, saveAnswer, navigateToSaved]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    runAsk();
  }, [runAsk]);

  const handleDemo = () => {
    if (!intake.prompt) return;
    const demo = buildDemoAnswer(intake.prompt);
    const saved = saveAnswer({
      question: demo.question,
      title: demo.title,
      brief: demo.brief,
      insight: demo.insight,
      explanation: demo.explanation,
      actionPlan: demo.actionPlan,
      evidenceChecklist: demo.evidenceChecklist,
      commonMistakes: demo.commonMistakes,
      lawyerReason: demo.lawyerReason,
      lawyerQuestions: demo.lawyerQuestions,
      glossary: demo.glossary,
      deadlineHint: demo.deadlineHint,
      legalAid: demo.legalAid,
      category: demo.category,
      urgency: demo.urgency,
      disclaimer: demo.disclaimer,
      language: demo.language,
      source: demo.source,
    });
    intake.succeed(saved.id);
    navigateToSaved(saved.id);

    // Analytics: demo answer used
    const event = {
      event_type: "answer_received",
      metadata: { success: true, source: "demo", question_length: intake.prompt.length },
      client_timestamp: new Date().toISOString(),
    };
    insertEvent(event, null).catch(() => queueEvent(event));
  };

  const handleClose = () => {
    intake.reset();
    router.dismissAll();
    router.replace("/(tabs)/home");
  };

  const handleRetry = () => {
    startedRef.current = false;
    runAsk();
  };

  if (intake.status === "error" && intake.errorCode) {
    return (
      <ErrorBoundary>
      <View style={s.root}>
        <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable
            onPress={handleClose}
            style={s.iconBtn}
            accessibilityLabel="סגור"
          >
            <Feather name="x" size={20} color={palette.darkText} />
          </Pressable>
          <Text style={s.topTitle}>הניתוח נכשל</Text>
          <View style={s.iconBtn} />
        </View>
        <ScrollView
          contentContainerStyle={[
            s.errorScroll,
            { paddingBottom: insets.bottom + 140 },
          ]}
        >
          <ErrorCard
            code={intake.errorCode}
            onRetry={handleRetry}
            demoEnabled={demoAvailable}
            onShowDemo={demoAvailable ? handleDemo : undefined}
            variant="ink"
          />
        </ScrollView>
        <View
          style={[
            s.cta,
            { paddingBottom: Math.max(insets.bottom, 12) + spacing.md },
          ]}
        >
          <PrimaryButton
            label="חזור ונסח/י מחדש"
            variant="paper"
            onPress={handleClose}
          />
        </View>
      </View>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <LoadingState insetsTop={insets.top} insetsBottom={insets.bottom} onClose={handleClose} />
    </ErrorBoundary>
  );
}

// ── Stage labels ──────────────────────────────────────────────────────────────
const STAGES: ReadonlyArray<string> = [
  "קורא את השאלה שלך",
  "בודק את התחום המשפטי",
  "מנסח תוכנית פעולה",
  "אוסף רשימת מסמכים",
  "מסיים את התיק",
];

const STAGE_INTERVAL_MS = 3500;
const PANEL_LINE_WIDTHS = ["88%", "72%", "94%", "64%", "80%"] as const;

function LoadingState({
  insetsTop,
  insetsBottom,
  onClose,
}: {
  insetsTop: number;
  insetsBottom: number;
  onClose: () => void;
}) {
  // Entrance animation
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);
  const enterY = enter.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });

  // Stage advancement
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGES.length - 1));
    }, STAGE_INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  // Caret blink
  const caret = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(caret, { toValue: 1, duration: 450, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(caret, { toValue: 0, duration: 450, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [caret]);
  const caretOpacity = caret.interpolate({ inputRange: [0, 1], outputRange: [0.15, 1] });

  const topPad = insetsTop + spacing.md;
  const bottomPad = Math.max(insetsBottom, 12) + spacing.md;

  return (
    <View style={[s.root, { paddingTop: topPad, paddingBottom: bottomPad }]}>
      {/* Top strip */}
      <View
        style={s.topStrip}
        accessibilityLiveRegion="polite"
        accessibilityLabel="מנתח את השאלה המשפטית"
      >
        <View style={s.topStripChip}>
          <View style={s.topStripDot} />
          <Text style={s.topStripText}>FOLIO · ניתוח</Text>
        </View>
        <Pressable
          onPress={onClose}
          style={s.topStripClose}
          accessibilityRole="button"
          accessibilityLabel="ביטול"
        >
          <Feather name="x" size={16} color={palette.darkTextMuted} />
        </Pressable>
      </View>

      <Animated.View
        style={[
          s.body,
          { opacity: enter, transform: [{ translateY: enterY }] },
        ]}
      >
        {/* Content lines panel */}
        <ContentPanel stage={stage} />

        {/* Status block */}
        <View style={s.statusBlock}>
          <Text style={s.headline}>מכין את התיק שלך</Text>

          <View style={s.stages}>
            {STAGES.map((label, i) => {
              const done = i < stage;
              const active = i === stage;
              return (
                <View key={label} style={s.stageRow}>
                  <View style={s.stageGlyphWrap}>
                    {done ? (
                      <Feather name="check" size={11} color={palette.accentOnDark} />
                    ) : active ? (
                      <Animated.View style={[s.stageCaret, { opacity: caretOpacity }]} />
                    ) : (
                      <View style={s.stageDot} />
                    )}
                  </View>
                  <Text
                    style={[
                      s.stageText,
                      done && s.stageTextDone,
                      active && s.stageTextActive,
                    ]}
                  >
                    {label}{active ? "…" : ""}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Segmented progress */}
          <View style={s.segRow}>
            {STAGES.map((_, i) => (
              <View key={i} style={[s.seg, i <= stage ? s.segOn : s.segOff]} />
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Footer */}
      <View style={s.footer}>
        <Text style={s.footerText}>עד 25 שניות · המידע נשמר במכשיר בלבד</Text>
      </View>
    </View>
  );
}

function ContentPanel({ stage }: { stage: number }) {
  const lineAnims = useMemo(
    () => PANEL_LINE_WIDTHS.map(() => new Animated.Value(0)),
    [],
  );

  useEffect(() => {
    const visibleCount = Math.min(stage + 1, lineAnims.length);
    for (let i = 0; i < lineAnims.length; i++) {
      const shouldBeVisible = i < visibleCount;
      Animated.timing(lineAnims[i], {
        toValue: shouldBeVisible ? 1 : 0,
        duration: shouldBeVisible ? 520 : 220,
        delay: shouldBeVisible ? i * 60 : 0,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [stage, lineAnims]);

  return (
    <View style={s.panel}>
      <View style={s.panelHead}>
        <Text style={s.panelHeadText}>תיק · בהכנה</Text>
        <View style={s.panelHeadDots}>
          <View style={s.panelHeadDot} />
          <View style={s.panelHeadDot} />
          <View style={s.panelHeadDot} />
        </View>
      </View>

      <View style={s.lines}>
        {PANEL_LINE_WIDTHS.map((width, i) => {
          const anim = lineAnims[i];
          const widthInterpolated = anim.interpolate({
            inputRange: [0, 1],
            outputRange: ["0%", width],
          });
          const opInterpolated = anim.interpolate({
            inputRange: [0, 0.4, 1],
            outputRange: [0, 0.4, 1],
          });
          return (
            <View key={i} style={s.lineRow}>
              <Animated.View
                style={[
                  s.line,
                  i === 0 ? s.lineHead : null,
                  { width: widthInterpolated, opacity: opInterpolated },
                ]}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.dark,
    overflow: "hidden",
  },

  // ── Top strip ───────────────────────────────────────────────
  topStrip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.darkBorder,
  },
  topStripChip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: palette.darkSurface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.darkBorder,
  },
  topStripDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.accentOnDark,
  },
  topStripText: {
    ...typography.label,
    color: palette.darkText,
    letterSpacing: 1.6,
    fontWeight: "700",
  },
  topStripClose: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Body ────────────────────────────────────────────────────
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    justifyContent: "center",
    gap: spacing.lg,
  },

  // ── Panel ───────────────────────────────────────────────────
  panel: {
    backgroundColor: palette.darkSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.darkBorder,
    padding: spacing.lg,
    paddingTop: spacing.md,
    minHeight: 180,
    overflow: "hidden",
  },
  panelHead: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.darkBorder,
  },
  panelHeadText: {
    ...typography.label,
    color: palette.darkTextMuted,
    letterSpacing: 1.6,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  panelHeadDots: { flexDirection: "row-reverse", gap: 4 },
  panelHeadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.accentOnDark,
    opacity: 0.5,
  },

  lines: { gap: 10 },
  lineRow: { alignItems: "flex-end" },
  line: {
    height: 5,
    backgroundColor: palette.darkTextSub,
    borderRadius: 2,
  },
  lineHead: {
    height: 7,
    backgroundColor: palette.darkText,
  },

  // ── Status block ────────────────────────────────────────────
  statusBlock: { alignItems: "flex-end" },
  headline: {
    ...typography.h1,
    fontSize: 28,
    lineHeight: 34,
    color: palette.darkText,
    textAlign: "right",
    writingDirection: "rtl",
    fontWeight: "800",
    marginBottom: spacing.md,
  },

  stages: {
    alignSelf: "stretch",
    gap: 8,
    marginBottom: spacing.md,
  },
  stageRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.sm,
  },
  stageGlyphWrap: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stageDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.darkTextMuted,
  },
  stageCaret: {
    width: 2,
    height: 14,
    backgroundColor: palette.accentOnDark,
    borderRadius: 1,
  },
  stageText: {
    ...typography.body,
    fontSize: 14.5,
    color: palette.darkTextMuted,
    textAlign: "right",
    writingDirection: "rtl",
  },
  stageTextDone: {
    color: palette.darkTextSub,
    textDecorationLine: "line-through",
  },
  stageTextActive: {
    color: palette.darkText,
    fontWeight: "700",
  },

  segRow: {
    flexDirection: "row-reverse",
    alignSelf: "stretch",
    gap: 4,
  },
  seg: { flex: 1, height: 3, borderRadius: 2 },
  segOn: { backgroundColor: palette.accentOnDark },
  segOff: { backgroundColor: palette.darkSurface },

  // ── Footer ──────────────────────────────────────────────────
  footer: {
    alignItems: "center",
    paddingTop: spacing.md,
  },
  footerText: {
    ...typography.label,
    color: palette.darkTextMuted,
    letterSpacing: 0.8,
  },

  // ── Error layout ────────────────────────────────────────────
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: palette.darkBorder,
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    ...typography.h3,
    fontSize: 13,
    color: palette.darkTextSub,
  },
  errorScroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  cta: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: palette.dark,
    borderTopWidth: 1,
    borderTopColor: palette.darkBorder,
  },
});
