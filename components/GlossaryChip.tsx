import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { palette, radius, shadow, spacing, typography } from "@/constants/theme";
import type { GlossaryTerm } from "@/types/answer";

type Props = {
  term: GlossaryTerm;
};

export function GlossaryChip({ term }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={s.chip}
        accessibilityRole="button"
        accessibilityLabel={`הצג הסבר עבור ${term.term}`}
      >
        <Text style={s.chipText}>{term.term}</Text>
        <View style={s.qDot}>
          <Text style={s.qDotText}>?</Text>
        </View>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={s.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={s.card} onPress={() => {}}>
            <Text style={s.cardKicker}>מילון משפטי</Text>
            <Text style={s.cardTerm}>{term.term}</Text>
            <View style={s.rule} />
            <Text style={s.cardDef}>{term.definition}</Text>
            <Pressable onPress={() => setOpen(false)} style={s.closeBtn}>
              <Text style={s.closeText}>סגור</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  chip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 7,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.full,
  },
  chipText: {
    ...typography.bodySm,
    fontSize: 13,
    fontWeight: "700",
    color: palette.text,
    letterSpacing: 0.2,
  },
  qDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: palette.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  qDotText: {
    color: palette.champagneText,
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 12,
  },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(10,9,8,0.78)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 4,
    ...shadow.lg,
  },
  cardKicker: {
    ...typography.label,
    color: palette.accent,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  cardTerm: {
    ...typography.h1,
    fontSize: 22,
    color: palette.text,
    fontWeight: "900",
    textAlign: "right",
    writingDirection: "rtl",
  },
  rule: {
    height: 1,
    backgroundColor: palette.border,
    marginVertical: spacing.sm,
  },
  cardDef: {
    ...typography.body,
    color: palette.textSecondary,
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 24,
  },
  closeBtn: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: palette.accent,
    borderRadius: radius.full,
  },
  closeText: {
    color: palette.champagneText,
    ...typography.h3,
    fontSize: 13,
    fontWeight: "800",
  },
});
