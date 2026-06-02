import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { palette, spacing, typography } from "@/constants/theme";
import type { DeadlineHint } from "@/types/answer";

type Props = {
  hint: DeadlineHint;
  /** When the answer was created — used to caveat a stale `relative` string. */
  createdAt: number;
};

/**
 * Calm deadline card surfaced at the top of the first-aid file.
 *
 *   - If the AI returned an `iso` date, we compute the live countdown
 *     in days vs. today. Negative values render as "פג תוקפו".
 *   - If only a `relative` string is present, we show it verbatim
 *     with a tiny "כפי שנאמד" caveat so the user knows it's a
 *     snapshot rather than a real-time count.
 *
 * The block is intentionally non-actionable — tapping doesn't do
 * anything. Its only job is to make the user aware. The action plan
 * is where they actually work.
 */
export function Countdown({ hint, createdAt }: Props) {
  let big = "";
  let small = "";
  let stale = false;

  if (hint.iso) {
    const today = startOfDay(Date.now());
    const target = startOfDay(Date.parse(`${hint.iso}T00:00:00Z`));
    const diffDays = Math.round((target - today) / 86400000);
    if (Number.isNaN(diffDays)) {
      big = hint.relative ?? "—";
    } else if (diffDays < 0) {
      big = "פג תוקפו";
      small = formatIso(hint.iso);
    } else if (diffDays === 0) {
      big = "היום";
      small = formatIso(hint.iso);
    } else if (diffDays === 1) {
      big = "מחר";
      small = formatIso(hint.iso);
    } else {
      big = `בעוד ${diffDays} ימים`;
      small = formatIso(hint.iso);
    }
  } else if (hint.relative) {
    big = hint.relative;
    stale = true;
    small = `כפי שנאמד ב-${formatTimestamp(createdAt)}`;
  } else {
    big = "—";
  }

  return (
    <View style={s.wrap}>
      <View style={s.headRow}>
        <Feather name="clock" size={12} color={palette.accent} />
        <Text style={s.eyebrow}>דדליין מרכזי</Text>
      </View>
      <Text style={s.label}>{hint.label}</Text>
      <Text style={s.big}>{big}</Text>
      {small ? (
        <Text style={[s.small, stale && s.smallStale]}>{small}</Text>
      ) : null}
    </View>
  );
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}
function formatIso(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "short",
  });
}

const s = StyleSheet.create({
  wrap: {
    padding: spacing.lg,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.accentBorder,
    borderRadius: 12,
    gap: 4,
    overflow: "hidden",
  },
  headRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  eyebrow: {
    ...typography.mono,
    fontSize: 10,
    color: palette.accent,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    fontWeight: "800",
  },
  label: {
    ...typography.bodySm,
    color: palette.textSecondary,
    textAlign: "right",
    writingDirection: "rtl",
  },
  big: {
    ...typography.h1,
    fontSize: 30,
    color: palette.accent,
    fontWeight: "900",
    textAlign: "right",
    writingDirection: "rtl",
    letterSpacing: -0.6,
    marginTop: 4,
  },
  small: {
    ...typography.mono,
    fontSize: 10.5,
    color: palette.textMuted,
    letterSpacing: 1.4,
    textAlign: "right",
    marginTop: 4,
  },
  smallStale: {
    fontStyle: "italic",
  },
});
