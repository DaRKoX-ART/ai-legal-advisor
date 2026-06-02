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

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const reduceMotion = useReduceMotion();
  const haptic = useHaptic();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const passwordsMatch = password === confirmPassword && password.length > 0;
  const canSubmit =
    name.trim().length >= 2 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    passwordsMatch &&
    !busy;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setError(null);
    setBusy(true);
    try {
      const { error: authError } = await auth.signUp(
        email.trim(),
        password,
        name.trim(),
      );
      if (authError) {
        setError(authError.message);
        haptic.notification(Haptics.NotificationFeedbackType.Error);
      } else {
        haptic.notification(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)/home");
      }
    } finally {
      setBusy(false);
    }
  }, [canSubmit, email, password, name, auth, haptic]);

  const goToSignIn = useCallback(() => {
    router.push("/sign-in");
  }, []);

  const goBack = useCallback(() => {
    router.replace("/(auth)/welcome" as any);
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
              <Text style={s.headerTitle}>הרשמה</Text>
              <View style={s.iconBtn} />
            </View>
          </Reveal>

          {/* Headline */}
          <Reveal delay={90} rise={motion.riseLg}>
            <Text style={s.headline}>צור חשבון חדש</Text>
          </Reveal>

          <Reveal delay={170} rise={motion.riseMd}>
            <Text style={s.subhead}>
              התחברות מאפשרת לך לשמור את התיקים בענן ולגשת אליהם מכל מכשיר.
            </Text>
          </Reveal>

          {/* Form */}
          <Reveal delay={280} rise={motion.riseMd}>
            <View style={s.form}>
              <AuthInput
                placeholder="השם שלך"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                accessibilityLabel="שם"
              />

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

              <View>
                <AuthInput
                  placeholder="סיסמה (לפחות 6 תווים)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  textContentType="newPassword"
                  accessibilityLabel="סיסמה"
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  style={s.eyeBtn}
                  accessibilityLabel={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
                >
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={18}
                    color={palette.ash}
                  />
                </Pressable>
              </View>

              <AuthInput
                placeholder="אשר/י סיסמה"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password-new"
                textContentType="newPassword"
                accessibilityLabel="אישור סיסמה"
                error={
                  confirmPassword.length > 0 && !passwordsMatch
                    ? "הסיסמאות אינן תואמות"
                    : undefined
                }
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
            </View>
          </Reveal>

          {/* CTA */}
          <Reveal delay={400}>
            <View style={s.ctaWrap}>
              <PrimaryButton
                label={busy ? "יוצר חשבון..." : "צור חשבון"}
                onPress={handleSubmit}
                disabled={!canSubmit}
                trailingIcon="arrow-left"
                variant="ink"
                glow={canSubmit && !reduceMotion}
                loading={busy}
              />
            </View>
          </Reveal>

          {/* Footer link */}
          <Reveal delay={480}>
            <Pressable
              onPress={goToSignIn}
              style={s.footerLink}
              accessibilityRole="link"
            >
              <Text style={s.footerText}>
                כבר יש לך חשבון?{" "}
                <Text style={s.footerTextBold}>התחברות</Text>
              </Text>
            </Pressable>
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
  eyeBtn: {
    position: "absolute",
    left: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    width: 40,
    alignItems: "center",
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

  // Footer
  footerLink: {
    alignItems: "center",
    paddingTop: spacing.md,
  },
  footerText: {
    ...typography.body,
    color: palette.ash,
    textAlign: "center",
  },
  footerTextBold: {
    ...typography.body,
    color: palette.champagne,
    fontWeight: "700",
  },
});
