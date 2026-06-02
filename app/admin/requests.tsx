import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
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
import type { Database } from "@/types/database";

type LegalRequest = Database["public"]["Tables"]["legal_requests"]["Row"];

export default function AdminRequestsScreen() {
  const auth = useAuth();
  const [rows, setRows] = useState<LegalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !auth.user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase!
        .from("legal_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      setRows((data as any[]) ?? []);
    } catch (err) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn("[admin] requests failed:", err);
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
        {loading && !rows.length ? (
          <ActivityIndicator color={palette.champagne} style={{ marginTop: spacing.xl }} />
        ) : (
          <View style={s.list}>
            {rows.map((row, i) => (
              <Reveal key={row.id} delay={i * 50}>
                <Pressable
                  onPress={() =>
                    setExpandedId(expandedId === row.id ? null : row.id)
                  }
                  style={({ pressed }) => [
                    s.card,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <View style={s.cardHeader}>
                    <View style={s.cardLeft}>
                      <Text style={s.cardTitle} numberOfLines={1}>
                        {row.title || "ללא כותרת"}
                      </Text>
                      <Text style={s.cardMeta}>
                        {new Date(row.created_at).toLocaleDateString("he-IL")}
                      </Text>
                    </View>
                    <Feather
                      name={
                        expandedId === row.id
                          ? "chevron-up"
                          : "chevron-down"
                      }
                      size={16}
                      color={palette.ash}
                    />
                  </View>

                  {expandedId === row.id && (
                    <View style={s.cardBody}>
                      <DetailRow label="ID" value={row.local_id ?? "—"} />
                      <DetailRow
                        label="משתמש"
                        value={row.user_id ? row.user_id.slice(0, 12) + "…" : "אורח"}
                      />
                      <DetailRow
                        label="שאלה"
                        value={
                          row.question.length > 120
                            ? row.question.slice(0, 120) + "…"
                            : row.question || "—"
                        }
                      />
                      <DetailRow
                        label="מקור"
                        value={row.source === "demo" ? "דמו" : "AI"}
                        color={row.source === "demo" ? palette.ash : palette.inkSuccess}
                      />
                    </View>
                  )}
                </Pressable>
              </Reveal>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function DetailRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={s.detailRow}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={[s.detailValue, color ? { color } : undefined]}>
        {value}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.ink },
  scroll: { paddingHorizontal: spacing.lg },
  list: { gap: spacing.sm, paddingBottom: spacing.lg },
  card: {
    backgroundColor: palette.glassRaised,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  cardLeft: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    ...typography.body,
    fontSize: 15,
    fontWeight: "700",
    color: palette.bone,
    textAlign: "right",
  },
  cardMeta: {
    ...typography.caption,
    fontSize: 11,
    color: palette.ash,
  },
  cardBody: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.glassBorder,
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  detailLabel: {
    ...typography.caption,
    fontSize: 11,
    color: palette.ash,
    minWidth: 50,
  },
  detailValue: {
    ...typography.body,
    fontSize: 13,
    color: palette.bone,
    flex: 1,
    textAlign: "right",
  },
});
