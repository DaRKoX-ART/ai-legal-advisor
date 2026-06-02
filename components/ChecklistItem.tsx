import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { palette, radius, spacing, typography } from "@/constants/theme";
import { useHaptic } from "@/hooks";

export type ChecklistVariant = "action" | "evidence";

type Props = {
  id: string;
  text: string;
  deadline?: string;
  done: boolean;
  note?: string;
  variant?: ChecklistVariant;
  onToggle: () => void;
  onChangeNote: (next: string) => void;
};

export function ChecklistItem({
  text,
  deadline,
  done,
  note,
  variant = "action",
  onToggle,
  onChangeNote,
}: Props) {
  const [editingNote, setEditingNote] = React.useState(false);
  const [draft, setDraft] = React.useState(note ?? "");
  const { selection: hapticSelection } = useHaptic();

  useEffect(() => setDraft(note ?? ""), [note]);

  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!done) return;
    pop.setValue(0);
    Animated.timing(pop, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [done, pop]);

  const handlePress = () => {
    hapticSelection();
    onToggle();
  };

  const handleSubmitNote = () => {
    onChangeNote(draft);
    setEditingNote(false);
  };

  const scale = pop.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.14, 1],
  });

  const evidenceGlyph = variant === "evidence";

  return (
    <View style={[s.card, done && s.cardDone]}>
      {done ? <View style={s.doneRail} /> : null}

      <View style={s.inner}>
        <Pressable
          onPress={handlePress}
          hitSlop={10}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done }}
          style={s.checkboxPress}
        >
          <Animated.View
            style={[
              s.checkbox,
              done && s.checkboxOn,
              { transform: [{ scale }] },
            ]}
          >
            {done ? (
              <Feather name="check" size={14} color={palette.champagneText} />
            ) : evidenceGlyph ? (
              <Feather name="file-text" size={11} color={palette.textMuted} />
            ) : (
              <View style={s.innerDot} />
            )}
          </Animated.View>
        </Pressable>

        <Pressable onPress={handlePress} style={s.body} hitSlop={4}>
          <Text style={[s.text, done && s.textDone]}>{text}</Text>

          <View style={s.metaRow}>
            {deadline ? (
              <View style={s.deadlineChip}>
                <Feather
                  name="clock"
                  size={10}
                  color={palette.warning}
                  style={{ marginLeft: 4 }}
                />
                <Text style={s.deadlineText}>{deadline}</Text>
              </View>
            ) : null}

            {done && evidenceGlyph ? (
              <View style={s.statusChip}>
                <Feather
                  name="check"
                  size={9}
                  color={palette.success}
                  style={{ marginLeft: 3 }}
                />
                <Text style={s.statusChipText}>נאסף</Text>
              </View>
            ) : null}

            <Pressable
              onPress={() => setEditingNote((v) => !v)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="הוסף הערה"
              style={s.noteBtn}
            >
              <Feather
                name={note && note.trim().length > 0 ? "edit-2" : "plus"}
                size={9}
                color={palette.textSecondary}
                style={{ marginLeft: 4 }}
              />
              <Text style={s.noteBtnText}>
                {note && note.trim().length > 0 ? "ערוך הערה" : "הוסף הערה"}
              </Text>
            </Pressable>
          </View>

          {editingNote ? (
            <View style={s.noteEditor}>
              <TextInput
                value={draft}
                onChangeText={(t) => setDraft(t.slice(0, 280))}
                placeholder="לדוגמה: שלחתי דואר רשום ב-20.5"
                placeholderTextColor={palette.textMuted}
                style={s.noteInput}
                multiline
                textAlign="right"
                autoFocus
                onBlur={handleSubmitNote}
                returnKeyType="done"
                maxLength={280}
              />
              <View style={s.noteEditorRow}>
                <Pressable onPress={handleSubmitNote} hitSlop={6}>
                  <Text style={s.noteSave}>שמור</Text>
                </Pressable>
                <Text style={s.noteCount}>{draft.length}/280</Text>
              </View>
            </View>
          ) : note && note.trim().length > 0 ? (
            <View style={s.noteShownWrap}>
              <Feather
                name="corner-down-left"
                size={11}
                color={palette.textSecondary}
                style={{ marginLeft: 6, marginTop: 4 }}
              />
              <Text style={s.noteShown}>{note.trim()}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: "row-reverse",
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    overflow: "hidden",
    marginBottom: 8,
  },
  cardDone: {
    backgroundColor: palette.surfaceSubtle,
    borderColor: palette.border,
  },
  doneRail: {
    width: 3,
    backgroundColor: palette.accent,
  },

  inner: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },

  checkboxPress: { paddingTop: 1 },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: palette.borderStrong,
    backgroundColor: palette.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  innerDot: {
    width: 4,
    height: 4,
    backgroundColor: palette.borderStrong,
    borderRadius: 2,
  },

  body: { flex: 1 },
  text: {
    ...typography.body,
    fontSize: 15.5,
    lineHeight: 23,
    color: palette.text,
    textAlign: "right",
    writingDirection: "rtl",
    fontWeight: "500",
  },
  textDone: {
    color: palette.textMuted,
    textDecorationLine: "line-through",
    fontWeight: "400",
  },

  metaRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: 8,
  },

  deadlineChip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: palette.warningSoft,
    borderWidth: 1,
    borderColor: palette.warningBorder,
    borderRadius: 4,
  },
  deadlineText: {
    ...typography.label,
    fontSize: 10,
    color: palette.warning,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  statusChip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: palette.successSoft,
    borderWidth: 1,
    borderColor: palette.successBorder,
    borderRadius: 4,
  },
  statusChipText: {
    ...typography.label,
    fontSize: 9.5,
    color: palette.success,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  noteBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: palette.surfaceSubtle,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 4,
  },
  noteBtnText: {
    ...typography.label,
    fontSize: 9.5,
    color: palette.textSecondary,
    fontWeight: "700",
    letterSpacing: 0.8,
  },

  noteEditor: {
    marginTop: 10,
    padding: spacing.sm,
    backgroundColor: palette.surfaceSubtle,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 6,
  },
  noteInput: {
    ...typography.bodySm,
    color: palette.text,
    minHeight: 40,
    textAlign: "right",
    writingDirection: "rtl",
  },
  noteEditorRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  noteSave: {
    ...typography.h3,
    fontSize: 13,
    color: palette.accent,
    fontWeight: "800",
  },
  noteCount: {
    ...typography.label,
    fontSize: 10,
    color: palette.textMuted,
    letterSpacing: 1,
  },

  noteShownWrap: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  noteShown: {
    flex: 1,
    ...typography.bodySm,
    color: palette.textSecondary,
    textAlign: "right",
    writingDirection: "rtl",
    fontStyle: "italic",
    marginTop: 2,
  },
});
