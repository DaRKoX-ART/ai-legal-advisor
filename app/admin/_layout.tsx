import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { router, Stack, usePathname } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { palette, radius, shadow, spacing, typography } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/services/supabase/client";

const TABS = [
  { path: "/admin", label: "סקירה", icon: "grid" as const },
  { path: "/admin/requests", label: "תיקים", icon: "folder" as const },
  { path: "/admin/users", label: "משתמשים", icon: "users" as const },
];

const HEADER_CONTENT_HEIGHT = 56;

function getTitle(pathname: string): string {
  const tab = TABS.find((t) => t.path === pathname);
  return tab?.label ?? "ניהול";
}

/* ═══════════════════════════════════════════════════════════════════════════════
   AdminNav — floating glass pill (inspired by PaperDock)
   ═══════════════════════════════════════════════════════════════════════════════ */
function AdminNav({ pathname }: { pathname: string }) {
  const insets = useSafeAreaInsets();
  const activeIndex = TABS.findIndex((t) => t.path === pathname);

  const dot = useRef(
    new Animated.Value(activeIndex < 0 ? 0 : activeIndex),
  ).current;

  useEffect(() => {
    if (activeIndex < 0) return;
    Animated.spring(dot, {
      toValue: activeIndex,
      tension: 95,
      friction: 11,
      useNativeDriver: false,
    }).start();
  }, [activeIndex, dot]);

  const dotLeft = dot.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ["0%", "33.33%", "66.66%"],
  });

  const bottomOffset = Math.max(insets.bottom, 8) + 12;

  return (
    <View pointerEvents="box-none" style={[s.navWrap, { bottom: bottomOffset }]}>
      <View style={s.navCard}>
        <BlurView
          intensity={Platform.OS === "ios" ? 28 : 18}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" style={s.navTint} />
        <View pointerEvents="none" style={s.navBorderRing} />

        <View style={s.navRow}>
          {TABS.map((tab) => {
            const active = pathname === tab.path;
            return (
              <Pressable
                key={tab.path}
                onPress={() => router.replace(tab.path as any)}
                style={s.navTab}
              >
                <View style={[s.navPill, active && s.navPillActive]}>
                  <Feather
                    name={tab.icon}
                    size={16}
                    color={active ? palette.champagne : palette.boneDim}
                  />
                  <Text
                    style={[
                      s.navPillLabel,
                      active && s.navPillLabelActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}

          <Animated.View
            pointerEvents="none"
            style={[
              s.dotTrack,
              { left: dotLeft } as Animated.AnimatedProps<ViewStyle>,
            ]}
          >
            <View style={s.dot} />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   AdminLayout — persistent header + stack + floating nav
   ═══════════════════════════════════════════════════════════════════════════════ */
export default function AdminLayout() {
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    async function check() {
      if (!auth.isAuthenticated || !supabase) {
        setIsAdmin(false);
        return;
      }
      const { data, error } = await supabase!
        .from("profiles")
        .select("is_admin")
        .eq("id", auth.user!.id)
        .single();
      if (error || !data) {
        setIsAdmin(false);
        return;
      }
      setIsAdmin(!!(data as any).is_admin);
    }
    check();
  }, [auth.isAuthenticated, auth.user?.id]);

  if (isAdmin === null) {
    return (
      <View style={[s.root, { paddingTop: insets.top + spacing.xl }]}>
        <ActivityIndicator color={palette.champagne} />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={[s.root, { paddingTop: insets.top + spacing.xl }]}>
        <View style={s.deniedCard}>
          <Feather name="lock" size={32} color={palette.inkDanger} />
          <Text style={s.deniedTitle}>גישה נדחתה</Text>
          <Text style={s.deniedBody}>
            אין לך הרשאות מנהל. אם את/ה מנהל/ת, פנה/י למפתח.
          </Text>
          <Pressable
            onPress={() => router.replace("/(tabs)/home" as any)}
            style={s.deniedBtn}
          >
            <Text style={s.deniedBtnText}>חזרה לבית</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const title = getTitle(pathname);

  return (
    <View style={s.root}>
      {/* ── Persistent admin header ── */}
      <View style={[s.header, { paddingTop: insets.top }]}>
        <View style={s.headerInner}>
          {/* Back button (RTL: appears on the right side of the screen) */}
          <Pressable
            onPress={() => router.replace("/(tabs)/about" as any)}
            style={s.backBtn}
            hitSlop={12}
          >
            <Feather name="arrow-left" size={18} color={palette.bone} />
            <Text style={s.backText}>חזרה</Text>
          </Pressable>

          <Text style={s.headerTitle} numberOfLines={1}>
            {title}
          </Text>

          <View style={s.adminBadge}>
            <Text style={s.adminBadgeText}>ADMIN</Text>
          </View>
        </View>
      </View>

      {/* ── Screen stack ── */}
      <View style={s.stackWrap}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: palette.ink },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="requests" />
          <Stack.Screen name="users" />
        </Stack>
      </View>

      {/* ── Floating admin nav ── */}
      <AdminNav pathname={pathname} />
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════════════════════════════════════════ */
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.ink,
  },

  /* ── Header ── */
  header: {
    backgroundColor: palette.ink,
    borderBottomWidth: 1,
    borderBottomColor: palette.glassBorder,
    zIndex: 10,
  },
  headerInner: {
    height: HEADER_CONTENT_HEIGHT,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
  },
  backBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  backText: {
    ...typography.body,
    fontSize: 14,
    color: palette.bone,
    fontWeight: "600",
  },
  headerTitle: {
    ...typography.h2,
    fontSize: 18,
    fontWeight: "800",
    color: palette.bone,
    textAlign: "center",
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  adminBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: palette.champagneSoft,
    borderWidth: 1,
    borderColor: palette.champagneBorder,
    minWidth: 52,
    alignItems: "center",
  },
  adminBadgeText: {
    ...typography.mono,
    fontSize: 9,
    letterSpacing: 1.2,
    color: palette.champagne,
    fontWeight: "800",
  },

  /* ── Stack ── */
  stackWrap: {
    flex: 1,
  },

  /* ── Floating nav ── */
  navWrap: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
  },
  navCard: {
    height: 62,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "rgba(10,9,8,0.55)",
    ...shadow.inkLifted,
  },
  navTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,9,8,0.55)",
  },
  navBorderRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: palette.champagneBorder,
  },
  navRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
    position: "relative",
  },
  navTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  navPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  navPillActive: {
    backgroundColor: palette.champagneSoft,
  },
  navPillLabel: {
    fontSize: 12,
    color: palette.boneDim,
    fontWeight: "600",
  },
  navPillLabelActive: {
    color: palette.champagne,
    fontWeight: "800",
  },
  dotTrack: {
    position: "absolute",
    top: 6,
    width: "33.33%",
    height: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: palette.champagne,
    ...shadow.glow,
  },

  /* ── Denied screen ── */
  deniedCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xxl,
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.inkDanger,
    backgroundColor: palette.inkDangerSoft,
    alignItems: "center",
    gap: spacing.md,
  },
  deniedTitle: {
    ...typography.h2,
    fontSize: 22,
    fontWeight: "800",
    color: palette.bone,
    textAlign: "center",
  },
  deniedBody: {
    ...typography.body,
    color: palette.boneDim,
    textAlign: "center",
    lineHeight: 22,
  },
  deniedBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: palette.glassRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.glassBorder,
  },
  deniedBtnText: {
    ...typography.body,
    color: palette.champagne,
    fontWeight: "700",
  },
});
