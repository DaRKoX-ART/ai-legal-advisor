import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Aurora, DotGrid, GoldHairline } from "@/components/atmosphere";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Reveal } from "@/components/Reveal";
import { motion, palette, radius, spacing, typography } from "@/constants/theme";
import { useHaptic, useReduceMotion } from "@/hooks";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const { selection: hapticSelection } = useHaptic();

  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  const goToSignIn = () => {
    hapticSelection();
    router.push("/(auth)/sign-in");
  };

  const goToSignUp = () => {
    hapticSelection();
    router.push("/(auth)/sign-up");
  };

  const goToGuest = () => {
    hapticSelection();
    router.push("/onboarding");
  };

  return (
    <View style={s.root}>
      <Aurora reduceMotion={reduceMotion} />
      <DotGrid />

      <ScrollView
        contentContainerStyle={[
          s.scroll,
          {
            paddingTop: insets.top + spacing.xl,
            paddingBottom: Math.max(insets.bottom, 12) + spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Wordmark */}
        <Reveal delay={0}>
          <View style={s.wordmarkRow}>
            <Text style={s.wordmark}>FOLIO</Text>
            <View style={s.wordmarkDot} />
          </View>
        </Reveal>

        {/* Headline */}
        <Reveal delay={120} rise={motion.riseLg}>
          <Text style={s.headline}>עוזר משפטי{'\n'}אישי ופרטי</Text>
        </Reveal>

        <Reveal delay={220} rise={motion.riseMd}>
          <Text style={s.subhead}>
            שאל שאלה בעברית, קבל הסבר מובנה, ועקוב אחרי הצעדים הבאים — הכל
            במכשיר שלך.
          </Text>
        </Reveal>

        <Reveal delay={340}>
          <GoldHairline style={{ marginTop: spacing.lg, marginBottom: spacing.lg }} />
        </Reveal>

        {/* CTAs */}
        <View style={s.ctaStack}>
          <Reveal delay={420} rise={motion.riseMd}>
            <PrimaryButton
              label="התחברות"
              onPress={goToSignIn}
              trailingIcon="arrow-left"
              variant="ink"
              glow={!reduceMotion}
            />
          </Reveal>

          <Reveal delay={500} rise={motion.riseMd}>
            <PrimaryButton
              label="יצירת חשבון"
              onPress={goToSignUp}
              trailingIcon="arrow-left"
              variant="outlineGold"
            />
          </Reveal>

          <Reveal delay={580} rise={motion.riseMd}>
            <Pressable
              onPress={goToGuest}
              style={s.guestBtn}
              accessibilityRole="button"
            >
              <Feather name="user" size={16} color={palette.ash} />
              <Text style={s.guestText}>המשך כאורח</Text>
            </Pressable>
          </Reveal>
        </View>

        {/* Footer legal hint */}
        <Reveal delay={680}>
          <View style={s.footer}>
            <Text style={s.footerText}>
              על ידי המשך את/ה מסכים/ה לתנאי השימוש וההצהרה המשפטית.
            </Text>
          </View>
        </Reveal>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.ink,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },

  // Wordmark
  wordmarkRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  wordmark: {
    ...typography.mono,
    fontSize: 13,
    letterSpacing: 4,
    color: palette.champagne,
    fontWeight: "700",
  },
  wordmarkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.accent,
  },

  // Headline
  headline: {
    ...typography.displaySm,
    fontSize: 42,
    lineHeight: 50,
    fontWeight: "900",
    letterSpacing: -1.2,
    color: palette.bone,
    textAlign: "right",
    writingDirection: "rtl",
  },
  subhead: {
    ...typography.body,
    fontSize: 16,
    lineHeight: 24,
    color: palette.boneDim,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: spacing.xs,
    maxWidth: 340,
    alignSelf: "flex-end",
  },

  // CTAs
  ctaStack: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  guestBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    backgroundColor: palette.glassRaised,
  },
  guestText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: "700",
    color: palette.ash,
  },

  // Footer
  footer: {
    marginTop: spacing.xl,
    alignItems: "center",
  },
  footerText: {
    ...typography.caption,
    fontSize: 11,
    color: palette.ash,
    textAlign: "center",
    lineHeight: 18,
  },
});
