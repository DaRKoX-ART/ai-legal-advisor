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
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Aurora, DotGrid } from "@/components/atmosphere";
import { AuthInput } from "@/components/auth/AuthInput";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Reveal } from "@/components/Reveal";
import { motion, palette, radius, spacing, typography } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useHaptic, useReduceMotion } from "@/hooks";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const reduceMotion = useReduceMotion();
  const haptic = useHaptic();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

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

  const canSubmit = email.trim().length > 0 && !busy && !success;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setError(null);
    setBusy(true);
    try {
      const { error: authError, success: ok } = await auth.resetPassword(
        email.trim(),
      );
      if (authError || !ok) {
        setError(authError?.message || "שגיאה בשליחת הקישור");
        haptic.notification(Haptics.NotificationFeedbackType.Error);
      } else {
        setSuccess(true);
        haptic.notification(Haptics.NotificationFeedbackType.Success);
      }
    } finally {
      setBusy(false);
    }
  }, [canSubmit, email, auth, haptic]);

  const goBack = useCallback(() => {
    router.back();
  }, []);

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
                onPress={goBack}
                style={s.iconBtn}
                accessibilityLabel="חזור"
                accessibilityRole="button"
                hitSlop={12}
              >
                <Feather name="arrow-right" size={22} color={palette.bone} />
              </Pressable>
              <Text style={s.headerTitle}>איפוס סיסמה</Text>
              <View style={s.iconBtn} />
            </View>
          </Reveal>

          {/* Headline */}
          <Reveal delay={90} rise={motion.riseLg}>
            <Text style={s.headline}>שכחת סיסמה?</Text>
          </Reveal>

          <Reveal delay={170} rise={motion.riseMd}>
            <Text style={s.subhead}>
              נשלח לך קישור לאיפוס הסיסמה לאימייל שתזין/י למטה.
            </Text>
          </Reveal>

          {/* Form */}
          <Reveal delay={280} rise={motion.riseMd}>
            <View style={s.form}>
              {success ? (
                <View style={s.successBox}>
                  <Feather
                    name="check-circle"
                    size={20}
                    color={palette.inkSuccess}
                  />
                  <Text style={s.successText}>
                    הקישור נשלח לאימייל שלך. אנא בדוק/י את תיבת הדואר.
                  </Text>
                </View>
              ) : (
                <>
                  <AuthInput
                    placeholder="אימייל"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    accessibilityLabel="אימייל"
                  />

                  {error ? (
                    <View style={s.errorRow}>
                      <Feather
                        name="alert-circle"
                        size={14}
                        color={palette.inkDanger}
                      />
                      <Text style={s.errorText}>{error}</Text>
                    </View>
                  ) : null}
                </>
              )}
            </View>
          </Reveal>

          {/* CTA */}
          {!success && (
            <Reveal delay={400}>
              <View style={s.ctaWrap}>
                <PrimaryButton
                  label={busy ? "שולח..." : "שלח קישור לאיפוס"}
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                  trailingIcon="arrow-left"
                  variant="ink"
                  glow={canSubmit && !reduceMotion}
                  loading={busy}
                />
              </View>
            </Reveal>
          )}
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
    ...typography.displaySm,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "900",
    letterSpacing: -1,
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

  // Form
  form: {
    gap: spacing.md,
  },
  successBox: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: palette.successSoft,
    borderWidth: 1,
    borderColor: palette.successBorder,
  },
  successText: {
    flex: 1,
    ...typography.body,
    color: palette.inkSuccess,
    textAlign: "right",
    writingDirection: "rtl",
  },
  errorRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: palette.inkDanger,
    textAlign: "right",
    writingDirection: "rtl",
  },

  // CTA
  ctaWrap: {
    marginTop: spacing.md,
  },
});
