import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Aurora, DotGrid } from "@/components/atmosphere";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Reveal } from "@/components/Reveal";
import { MAX_QUESTION_LENGTH, MIN_QUESTION_LENGTH } from "@/constants/legal";
import { motion, palette, radius, spacing, typography } from "@/constants/theme";
import { useIntake } from "@/context/IntakeContext";
import { useHaptic, useReduceMotion } from "@/hooks";

const PLACEHOLDERS = [
  "המעסיק פיטר אותי ללא הודעה מוקדמת...",
  "השכן מסרב להוריד את הקירוי...",
  "האם אני יכולה לבטל חוזה שכירות בגלל ליקויים?",
  "תיק פלילי קטן — כדאי להתייעץ עם עו\"ד?",
];

const SUGGESTIONS = [
  "דיני עבודה",
  "חוזים",
  "דיני משפחה",
  "דיירות",
  "פלילי",
];

export default function AskScreen() {
  const insets = useSafeAreaInsets();
  const intake = useIntake();
  const reduceMotion = useReduceMotion();
  const haptic = useHaptic();

  const [text, setText] = useState(intake.prompt);
  const [focused, setFocused] = useState(false);
  const [phIndex, setPhIndex] = useState(0);

  // Persist draft to intake context so it survives modal dismiss
  const handleTextChange = useCallback(
    (t: string) => {
      const clipped = t.slice(0, MAX_QUESTION_LENGTH);
      setText(clipped);
      intake.setPrompt(clipped);
    },
    [intake],
  );

  // Placeholder cycling with crossfade
  const phAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const interval = setInterval(() => {
      if (text.length > 0) return; // don't cycle when user has typed
      Animated.timing(phAnim, {
        toValue: 1,
        duration: 280,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        setPhIndex((i) => (i + 1) % PLACEHOLDERS.length);
        Animated.timing(phAnim, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      });
    }, 4200);
    return () => clearInterval(interval);
  }, [phAnim, text.length]);

  const trimmed = text.trim();
  const canAsk =
    trimmed.length >= MIN_QUESTION_LENGTH &&
    trimmed.length <= MAX_QUESTION_LENGTH;

  // Focus glow
  const focusGlow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(focusGlow, {
      toValue: focused ? 1 : 0,
      duration: motion.fast,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [focused, focusGlow]);

  // Character count color + subtle scale near limit
  const countRatio = trimmed.length / MAX_QUESTION_LENGTH;
  const countColor =
    countRatio > 0.95
      ? palette.inkDanger
      : countRatio > 0.8
        ? palette.champagne
        : palette.ash;

  const nearLimit = countRatio > 0.9;
  const countScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!nearLimit) {
      Animated.timing(countScale, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
      return;
    }
    Animated.sequence([
      Animated.timing(countScale, {
        toValue: 1.12,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(countScale, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [nearLimit, countScale]);

  const handleClose = useCallback(() => {
    router.back();
  }, []);

  const handleSubmit = useCallback(() => {
    if (!canAsk) return;
    haptic.impact(Haptics.ImpactFeedbackStyle.Medium);
    intake.setPrompt(trimmed);
    intake.beginSubmit();
    router.push("/ask/loading");
  }, [canAsk, trimmed, intake, haptic]);

  const handleSuggestion = useCallback(
    (suggestion: string) => {
      haptic.selection();
      const prefix = trimmed.length > 0 ? trimmed + " — " : "";
      const newText = prefix + suggestion + ": ";
      handleTextChange(newText);
    },
    [trimmed, haptic, handleTextChange],
  );

  const placeholderOpacity = text.length === 0
    ? phAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.15] })
    : 0;

  return (
    <View style={s.root}>
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
              paddingBottom: Math.max(insets.bottom, 12) + spacing.xl,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Reveal delay={0}>
            <View style={s.header}>
              <Pressable
                onPress={handleClose}
                style={s.iconBtn}
                accessibilityLabel="סגור"
                accessibilityRole="button"
                hitSlop={12}
              >
                <Feather name="x" size={22} color={palette.bone} />
              </Pressable>
              <Text style={s.headerTitle}>שאלה חדשה</Text>
              <View style={s.iconBtn} />
            </View>
          </Reveal>

          {/* Headline */}
          <Reveal delay={90} rise={motion.riseLg}>
            <Text style={s.headline}>מה מטריד אותך?</Text>
          </Reveal>

          <Reveal delay={170} rise={motion.riseMd}>
            <Text style={s.subhead}>
              תאר/י את המצב בקצרה. ננסח עבורך תוכנית פעולה ורשימת מסמכים.
            </Text>
          </Reveal>

          {/* Composer */}
          <Reveal delay={280} rise={motion.riseMd}>
            <View style={s.composerWrap}>
              <Animated.View
                pointerEvents="none"
                style={[
                  s.composerGlow,
                  {
                    opacity: focusGlow.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.5],
                    }),
                  },
                ]}
              />
              <Animated.View
                style={[
                  s.composer,
                  {
                    borderColor: focusGlow.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        palette.glassBorder,
                        palette.champagneBorderHi,
                      ],
                    }),
                    shadowOpacity: focusGlow.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.25],
                    }),
                  } as Animated.AnimatedProps<any>,
                ]}
              >
                <Text style={s.composerLabel}>השאלה המשפטית</Text>

                <View style={s.inputWrap}>
                  <TextInput
                    value={text}
                    onChangeText={handleTextChange}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder=""
                    selectionColor={palette.champagne}
                    multiline
                    textAlign="right"
                    textAlignVertical="top"
                    style={s.input}
                    accessibilityLabel="השאלה המשפטית שלך"
                    autoFocus
                  />
                  {text.length === 0 && (
                    <Animated.Text
                      style={[s.placeholder, { opacity: placeholderOpacity }]}
                      pointerEvents="none"
                    >
                      {PLACEHOLDERS[phIndex]}
                    </Animated.Text>
                  )}
                </View>

                <View style={s.divider} />
                <View style={s.footerRow}>
                  <Animated.View
                    style={[
                      s.countWrap,
                      { transform: [{ scale: countScale }] },
                    ]}
                  >
                    <Text style={[s.count, { color: countColor }]}>
                      {String(trimmed.length).padStart(3, "0")} /{" "}
                      {MAX_QUESTION_LENGTH}
                    </Text>
                  </Animated.View>
                  <Text style={s.hint}>אל תזין/י פרטים מזהים מיותרים</Text>
                </View>
              </Animated.View>
            </View>
          </Reveal>

          {/* Quick suggestions */}
          <Reveal delay={400}>
            <Text style={s.suggestionsLabel}>נושאים נפוצים</Text>
            <View style={s.chipsRow}>
              {SUGGESTIONS.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  onPress={() => handleSuggestion(suggestion)}
                  style={({ pressed }) => [
                    s.chip,
                    pressed && s.chipPressed,
                  ]}
                >
                  <Text style={s.chipText}>{suggestion}</Text>
                </Pressable>
              ))}
            </View>
          </Reveal>

          {/* CTA */}
          <Reveal delay={500}>
            <View style={s.ctaWrap}>
              <PrimaryButton
                label="קבל תשובה"
                onPress={handleSubmit}
                disabled={!canAsk}
                trailingIcon="arrow-left"
                variant="ink"
                glow={canAsk && !reduceMotion}
              />
            </View>
          </Reveal>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.ink,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },

  // Header
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  headerTitle: {
    ...typography.h3,
    color: palette.bone,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  // Headline
  headline: {
    ...typography.display,
    fontSize: 44,
    lineHeight: 50,
    fontWeight: "900",
    letterSpacing: -1.2,
    color: palette.bone,
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: spacing.sm,
  },
  subhead: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 24,
    color: palette.ash,
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: spacing.lg,
  },

  // Composer
  composerWrap: {
    position: "relative",
  },
  composerGlow: {
    position: "absolute",
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: radius.xxl,
    backgroundColor: palette.champagne,
    opacity: 0,
  },
  composer: {
    borderWidth: 1,
    backgroundColor: palette.glassRaised,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    minHeight: 240,
    overflow: "hidden",
    shadowColor: palette.champagne,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 24,
    elevation: 0,
  },
  composerLabel: {
    ...typography.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: palette.champagne,
    textTransform: "uppercase",
    textAlign: "right",
    marginBottom: spacing.sm,
  },
  inputWrap: {
    position: "relative",
    minHeight: 140,
  },
  input: {
    ...typography.bodyLg,
    fontSize: 18,
    lineHeight: 28,
    color: palette.bone,
    minHeight: 140,
    paddingTop: 0,
    textAlign: "right",
    writingDirection: "rtl",
  },
  placeholder: {
    ...typography.bodyLg,
    fontSize: 18,
    lineHeight: 28,
    color: palette.ashLow,
    textAlign: "right",
    writingDirection: "rtl",
    position: "absolute",
    right: 0,
    top: 0,
    left: 0,
  },
  divider: {
    height: 1,
    width: "100%",
    backgroundColor: palette.champagneSofter,
    marginTop: spacing.sm,
  },
  footerRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  countWrap: {
    marginLeft: spacing.xs,
  },
  count: {
    ...typography.mono,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  hint: {
    flex: 1,
    ...typography.caption,
    fontSize: 11,
    color: palette.ash,
    textAlign: "right",
    writingDirection: "rtl",
  },

  // Suggestions
  suggestionsLabel: {
    ...typography.label,
    fontSize: 10,
    letterSpacing: 1.8,
    color: palette.ash,
    textTransform: "uppercase",
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  chipsRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    backgroundColor: palette.glass,
  },
  chipPressed: {
    backgroundColor: palette.glassHi,
    borderColor: palette.champagneBorder,
  },
  chipText: {
    ...typography.label,
    fontSize: 12,
    color: palette.boneDim,
    letterSpacing: 0.2,
  },

  // CTA
  ctaWrap: {
    marginTop: spacing.lg,
  },
});
