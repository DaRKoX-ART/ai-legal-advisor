import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Aurora, DotGrid, GoldHairline } from "@/components/atmosphere";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Reveal } from "@/components/Reveal";
import { DISCLAIMER_STORAGE_KEY } from "@/constants/legal";
import { motion, palette, radius, spacing, typography } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { useHaptic, useReduceMotion } from "@/hooks";

type IconName = React.ComponentProps<typeof Feather>["name"];

const DISCLAIMER_BULLETS: { title: string; body: string; icon: IconName }[] = [
  {
    icon: "info",
    title: "מידע ראשוני בלבד",
    body: "FOLIO נותן הכוונה משפטית התחלתית, לא ייעוץ אישי.",
  },
  {
    icon: "user-check",
    title: "לא מחליף עורך דין",
    body: "להחלטות משמעותיות פנה/י לעורך דין מוסמך.",
  },
  {
    icon: "lock",
    title: "פרטיות",
    body: "התשובות נשמרות במכשיר שלך בלבד.",
  },
];

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const { signIn } = useApp();
  const [name, setName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const reduceMotion = useReduceMotion();

  const canStart = accepted && name.trim().length >= 2 && !busy;

  const { selection: hapticSelection, notification: hapticNotification } =
    useHaptic();

  const toggleAccept = () => {
    setAccepted((v) => !v);
    hapticSelection();
  };

  const start = async () => {
    if (!canStart) return;
    setBusy(true);
    try {
      await signIn(name.trim(), { disclaimerVersion: "v1" });
      await AsyncStorage.setItem(DISCLAIMER_STORAGE_KEY, "true");
      hapticNotification(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/home");
    } finally {
      setBusy(false);
    }
  };

  const inputGlow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(inputGlow, {
      toValue: inputFocused ? 1 : 0,
      duration: motion.fast,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [inputFocused, inputGlow]);

  return (
    <View style={s.root}>
      <Aurora reduceMotion={reduceMotion} style={{ top: -140, height: 540 }} />
      <DotGrid />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            s.scroll,
            { paddingTop: insets.top + spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Mono credit + gold hairline ── */}
          <Reveal delay={0}>
            <View style={s.creditRow}>
              <Text style={s.wordmark}>F · O · L · I · O</Text>
              <Text style={s.creditCaption}>AI · משפט · ראשוני</Text>
            </View>
          </Reveal>

          <Reveal delay={60}>
            <GoldHairline style={{ marginBottom: spacing.xl }} />
          </Reveal>

          {/* ── Massive Hebrew headline ── */}
          <Reveal delay={120}>
            <Text style={s.headline}>עוזר משפטי{"\n"}לכל אחד.</Text>
          </Reveal>

          <Reveal delay={180}>
            <Text style={s.subheadline}>
              פרטי, פשוט, בעברית.{"\n"}
              שאלה אחת. תשובה ברורה.
            </Text>
          </Reveal>

          {/* ── Name input — glass slab with focus glow ── */}
          <Reveal delay={260}>
            <View style={s.section}>
              <Text style={s.sectionLabel}>השם שלך</Text>
              <View style={s.inputOuter}>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    s.inputGlow,
                    {
                      opacity: inputGlow.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.55],
                      }),
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    s.inputWrap,
                    {
                      borderColor: inputGlow.interpolate({
                        inputRange: [0, 1],
                        outputRange: [
                          palette.glassBorder,
                          palette.champagneBorderHi,
                        ],
                      }),
                    } as Animated.AnimatedProps<ViewStyle>,
                  ]}
                >
                  <TextInput
                    value={name}
                    onChangeText={(t) => setName(t.slice(0, 40))}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder="איך לקרוא לך?"
                    placeholderTextColor={palette.ashLow}
                    selectionColor={palette.champagne}
                    style={s.input}
                    textAlign="right"
                    autoCapitalize="words"
                    autoFocus
                    returnKeyType="done"
                    maxLength={40}
                    accessibilityLabel="שמך"
                  />
                </Animated.View>
              </View>
            </View>
          </Reveal>

          {/* ── Disclaimer — glass cards ── */}
          <Reveal delay={340}>
            <Text style={s.disclaimerTitle}>חשוב שתבין/י</Text>
          </Reveal>

          {DISCLAIMER_BULLETS.map((b, i) => (
            <Reveal key={i} delay={400 + i * 70} rise={14}>
              <View style={s.discCard}>
                <View style={s.discIcon}>
                  <Feather
                    name={b.icon}
                    size={14}
                    color={palette.champagne}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.discTitle}>{b.title}</Text>
                  <Text style={s.discBody}>{b.body}</Text>
                </View>
              </View>
            </Reveal>
          ))}

          {/* ── Accept checkbox ── */}
          <Reveal delay={640}>
            <Pressable
              onPress={toggleAccept}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: accepted }}
              style={s.checkRow}
            >
              <View style={[s.checkBox, accepted && s.checkBoxOn]}>
                {accepted ? (
                  <Feather
                    name="check"
                    size={14}
                    color={palette.champagneText}
                  />
                ) : null}
              </View>
              <Text style={s.checkText}>
                קראתי, הבנתי, ואני מבין/ה ש-FOLIO לא מחליף עורך דין.
              </Text>
            </Pressable>
          </Reveal>

          <View style={{ height: 160 }} />
        </ScrollView>

        {/* ── Sticky CTA ── */}
        <View
          style={[
            s.cta,
            { paddingBottom: Math.max(insets.bottom, 12) + spacing.md },
          ]}
        >
          <GoldHairline style={{ marginBottom: spacing.md }} />
          <PrimaryButton
            label={busy ? "מתחיל..." : "פתח את FOLIO"}
            onPress={start}
            disabled={!canStart}
            loading={busy}
            trailingIcon="arrow-left"
            variant="ink"
            glow={canStart && !reduceMotion}
          />
          <Pressable
            onPress={() => router.push("/(auth)/welcome")}
            style={s.onboardingAuthLink}
            accessibilityRole="link"
          >
            <Text style={s.onboardingAuthText}>
              יש לך חשבון? <Text style={s.onboardingAuthBold}>התחברות</Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

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
  headline: {
    ...typography.display,
    fontSize: 46,
    lineHeight: 52,
    fontWeight: "900",
    letterSpacing: -1.6,
    color: palette.bone,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: spacing.sm,
  },
  subheadline: {
    ...typography.bodyLg,
    fontSize: 17,
    lineHeight: 26,
    color: palette.boneDim,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
  },

  // Name section
  section: { marginBottom: spacing.xl },
  sectionLabel: {
    ...typography.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: palette.champagne,
    textTransform: "uppercase",
    textAlign: "right",
    marginBottom: spacing.xs,
  },
  inputOuter: {
    position: "relative",
  },
  inputGlow: {
    position: "absolute",
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: radius.xl + 8,
    backgroundColor: palette.champagne,
    opacity: 0,
  },
  inputWrap: {
    borderWidth: 1,
    borderRadius: radius.xl,
    backgroundColor: palette.glassRaised,
    paddingHorizontal: spacing.md,
  },
  input: {
    ...typography.h2,
    fontSize: 22,
    color: palette.bone,
    paddingVertical: spacing.md,
    textAlign: "right",
    writingDirection: "rtl",
  },

  // Disclaimer
  disclaimerTitle: {
    ...typography.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: palette.champagne,
    textTransform: "uppercase",
    textAlign: "right",
    marginBottom: spacing.sm,
  },
  discCard: {
    flexDirection: "row-reverse",
    gap: spacing.md,
    alignItems: "flex-start",
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    backgroundColor: palette.glassRaised,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  discIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.champagneSoft,
    borderWidth: 1,
    borderColor: palette.champagneBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  discTitle: {
    ...typography.h3,
    fontSize: 15,
    fontWeight: "800",
    color: palette.bone,
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: 2,
  },
  discBody: {
    ...typography.bodySm,
    fontSize: 13,
    color: palette.boneDim,
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 20,
  },

  // Accept checkbox
  checkRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: spacing.lg,
    minHeight: 44,
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: palette.champagneBorderHi,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  checkBoxOn: {
    backgroundColor: palette.champagne,
    borderColor: palette.champagne,
  },
  checkText: {
    flex: 1,
    ...typography.bodySm,
    fontSize: 13,
    color: palette.boneDim,
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 20,
  },

  // CTA
  cta: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: palette.ink,
  },
  onboardingAuthLink: {
    alignItems: "center",
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  onboardingAuthText: {
    ...typography.body,
    color: palette.ash,
    textAlign: "center",
  },
  onboardingAuthBold: {
    ...typography.body,
    color: palette.champagne,
    fontWeight: "700",
  },
});
