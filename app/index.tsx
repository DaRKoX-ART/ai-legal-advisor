import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View, ViewStyle } from "react-native";

import { CircularSeal } from "@/components/CircularSeal";
import { palette, spacing, typography } from "@/constants/theme";
import { isSupabaseConfigured } from "@/services/supabase/auth";
import { supabase } from "@/services/supabase/client";
import { insertEvent, queueEvent } from "@/services/supabase/analytics";

export default function SplashScreen() {
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const mastOpacity = useRef(new Animated.Value(0)).current;
  const ruleScale = useRef(new Animated.Value(0)).current;
  const sealScale = useRef(new Animated.Value(0.4)).current;
  const sealRot = useRef(new Animated.Value(-25)).current;
  const sealOpacity = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  const letters = ["F", "O", "L", "I", "O"];
  const letterAnims = useRef(
    letters.map(() => ({
      opacity: new Animated.Value(0),
      y: new Animated.Value(28),
    })),
  ).current;

  useEffect(() => {
    const mounted = { current: true };
    const anim = Animated.sequence([
      Animated.timing(screenOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(mastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.stagger(
        80,
        letterAnims.map((l) =>
          Animated.parallel([
            Animated.timing(l.opacity, { toValue: 1, duration: 320, useNativeDriver: true }),
            Animated.timing(l.y, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]),
        ),
      ),
      Animated.timing(ruleScale, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(sealOpacity, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.spring(sealScale, { toValue: 1, tension: 90, friction: 7, useNativeDriver: true }),
        Animated.timing(sealRot, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.timing(footerOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.delay(550),
      Animated.timing(screenOpacity, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]);
    anim.start(() => {
      if (!mounted.current) return;
      async function route() {
        // Analytics: app opened
        const event = {
          event_type: "app_opened",
          metadata: { platform: "mobile" },
          client_timestamp: new Date().toISOString(),
        };

        // Check Supabase session first
        let hasSupabaseSession = false;
        let userId: string | null = null;
        if (isSupabaseConfigured() && supabase) {
          const { data } = await supabase.auth.getSession();
          hasSupabaseSession = !!data.session;
          userId = data.session?.user?.id ?? null;
        }

        // Send analytics (fire-and-forget)
        const ok = await insertEvent(event, userId);
        if (!ok) await queueEvent(event);

        // Fall back to local user check
        const [v1, legacy] = await Promise.all([
          AsyncStorage.getItem("@folio/user_v1"),
          AsyncStorage.getItem("@legal_advisor_user"),
        ]);
        const hasLocalUser = !!(v1 || legacy);

        if (!mounted.current) return;

        if (hasSupabaseSession || hasLocalUser) {
          router.replace("/(tabs)/home");
        } else {
          router.replace("/(auth)/welcome");
        }
      }
      route();
    });
    return () => {
      mounted.current = false;
      anim.stop();
    };
  }, [screenOpacity, mastOpacity, ruleScale, sealScale, sealRot, sealOpacity, footerOpacity, letterAnims]);

  const sealRotation = sealRot.interpolate({
    inputRange: [-25, 0],
    outputRange: ["-25deg", "0deg"],
  });

  return (
    <Animated.View style={[styles.root, { opacity: screenOpacity }]}>
      {/* Top mast */}
      <Animated.View style={[styles.mast, { opacity: mastOpacity }]}>
        <View style={styles.dot} />
        <Animated.Text style={styles.mastText}>
          FOLIO · INITIALIZING
        </Animated.Text>
        <View style={styles.mastRule} />
      </Animated.View>

      {/* Center wordmark */}
      <View style={styles.center}>
        <View style={styles.wordmarkRow}>
          {letters.map((ch, i) => (
            <Animated.Text
              key={i}
              style={[
                styles.letter,
                { opacity: letterAnims[i].opacity, transform: [{ translateY: letterAnims[i].y }] },
              ]}
            >
              {ch}
            </Animated.Text>
          ))}
        </View>

        <Animated.View style={[styles.rule, { transform: [{ scaleX: ruleScale }] }]} />

        <Animated.Text style={[styles.subline, { opacity: ruleScale }]}>
          עוזר משפטי אישי · AI ANALYSIS
        </Animated.Text>

        <Animated.View
          style={[
            styles.sealWrap,
            { opacity: sealOpacity, transform: [{ scale: sealScale }, { rotate: sealRotation }] },
          ]}
        >
          <CircularSeal
            size={108}
            topText="LEGAL FOLIO · AI ASSISTANT"
            bottomText="EST · 2026 · PRIVATE"
            centerLabel="AI"
            centerSub="ANALYSIS"
          />
        </Animated.View>
      </View>

      {/* Footer */}
      <Animated.View style={[styles.footerWrap, { opacity: footerOpacity }]}>
        <View style={styles.footerRule} />
        <Animated.Text style={styles.footer}>
          מידע משפטי ראשוני · אינו תחליף לעורך דין
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  mast: {
    position: "absolute",
    top: 60,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.accent,
  },
  mastText: {
    ...typography.label,
    color: palette.textMuted,
    letterSpacing: 2.2,
  },
  mastRule: {
    flex: 1,
    height: 1,
    backgroundColor: palette.border,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  wordmarkRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  letter: {
    fontFamily: typography.displayXL.fontFamily,
    fontSize: 96,
    lineHeight: 102,
    fontWeight: "900",
    color: palette.text,
    letterSpacing: -4,
  },
  rule: {
    width: 180,
    height: 2,
    backgroundColor: palette.accent,
    marginTop: spacing.md,
    transformOrigin: "right",
  } as ViewStyle,
  subline: {
    ...typography.label,
    color: palette.textSecondary,
    marginTop: spacing.md,
    letterSpacing: 3,
  },
  sealWrap: {
    marginTop: spacing.xxl,
  },
  footerWrap: {
    position: "absolute",
    bottom: 56,
    left: spacing.lg,
    right: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  footerRule: {
    width: 32,
    height: 1,
    backgroundColor: palette.accent,
  },
  footer: {
    ...typography.label,
    color: palette.textMuted,
    textAlign: "center",
    letterSpacing: 2,
  },
});
