import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Reveal } from "@/components/Reveal";
import { palette, radius, spacing, typography } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/services/supabase/client";

type Stats = {
  total_users: number;
  total_requests: number;
  requests_today: number;
  active_users_today: number;
};

export default function AdminOverviewScreen() {
  const auth = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!supabase || !auth.user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase!.rpc("admin_stats");
      if (error) throw error;
      const rows = data as any[];
      if (rows && rows.length > 0) {
        const row = rows[0];
        setStats({
          total_users: Number(row.total_users ?? 0),
          total_requests: Number(row.total_requests ?? 0),
          requests_today: Number(row.requests_today ?? 0),
          active_users_today: Number(row.active_users_today ?? 0),
        });
      }
    } catch (err) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn("[admin] stats failed:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [auth.user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={[
          s.scroll,
          { paddingTop: spacing.lg, paddingBottom: 100 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.champagne}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading && !stats ? (
          <ActivityIndicator color={palette.champagne} style={{ marginTop: spacing.xl }} />
        ) : (
          <>
            <Reveal delay={120}>
              <View style={s.grid}>
                <KpiCard
                  icon="users"
                  label={'סה"כ משתמשים'}
                  value={stats?.total_users ?? 0}
                  color={palette.champagne}
                />
                <KpiCard
                  icon="file-text"
                  label={'סה"כ תיקים'}
                  value={stats?.total_requests ?? 0}
                  color={palette.inkSuccess}
                />
                <KpiCard
                  icon="activity"
                  label="תיקים היום"
                  value={stats?.requests_today ?? 0}
                  color={palette.accent}
                />
                <KpiCard
                  icon="user-check"
                  label="פעילים היום"
                  value={stats?.active_users_today ?? 0}
                  color={palette.bone}
                />
              </View>
            </Reveal>

            <Reveal delay={200}>
              <Text style={s.sectionLabel}>מצב המערכת</Text>
              <View style={s.statusCard}>
                <StatusRow
                  label="Supabase"
                  status={supabase ? "מחובר" : "לא מחובר"}
                  ok={!!supabase}
                />
                <StatusRow
                  label="סנכרון ענן"
                  status={auth.isAuthenticated ? "פעיל" : "לא פעיל"}
                  ok={auth.isAuthenticated}
                />
                <StatusRow
                  label="מצב אנליטיקה"
                  status="פעיל"
                  ok={true}
                  isLast
                />
              </View>
            </Reveal>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function KpiCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={s.kpiCard}>
      <View style={[s.kpiIconWrap, { borderColor: color + "44" }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <Text style={[s.kpiValue, { color }]}>{value.toLocaleString("he-IL")}</Text>
      <Text style={s.kpiLabel}>{label}</Text>
    </View>
  );
}

function StatusRow({
  label,
  status,
  ok,
  isLast,
}: {
  label: string;
  status: string;
  ok: boolean;
  isLast?: boolean;
}) {
  return (
    <View style={[s.statusRow, isLast && s.statusRowLast]}>
      <Text style={s.statusLabel}>{label}</Text>
      <View style={s.statusBadge}>
        <View
          style={[
            s.statusDot,
            { backgroundColor: ok ? palette.inkSuccess : palette.inkDanger },
          ]}
        />
      <Text style={[s.statusText, { color: ok ? palette.inkSuccess : palette.inkDanger }]}>
          {status}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.ink },
  scroll: { paddingHorizontal: spacing.lg },
  grid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  kpiCard: {
    width: "47%",
    backgroundColor: palette.glassRaised,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  kpiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  kpiValue: {
    ...typography.display,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  kpiLabel: {
    ...typography.caption,
    color: palette.ash,
    fontSize: 11,
  },
  sectionLabel: {
    ...typography.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: palette.champagne,
    textTransform: "uppercase",
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: spacing.xs,
    marginTop: spacing.lg,
  },
  statusCard: {
    backgroundColor: palette.glassRaised,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  statusRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.glassBorder,
  },
  statusRowLast: { borderBottomWidth: 0 },
  statusLabel: {
    ...typography.body,
    fontSize: 14,
    color: palette.bone,
  },
  statusBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: "700",
  },
});
