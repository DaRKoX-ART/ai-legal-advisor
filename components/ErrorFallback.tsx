import { reloadAppAsync } from "expo";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { palette, spacing, typography } from "@/constants/theme";

export type ErrorFallbackProps = {
  error: Error;
  resetError: () => void;
};

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const insets = useSafeAreaInsets();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleRestart = async () => {
    try {
      await reloadAppAsync();
    } catch (restartError) {
      console.error("Failed to restart app:", restartError);
      resetError();
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + 64 }]}>
        <Text style={styles.code}>SYSTEM ERROR</Text>
        <Text style={styles.title}>משהו השתבש.</Text>
        <View style={styles.rule} />
        <Text style={styles.body}>
          האפליקציה נתקלה בשגיאה לא צפויה. טען את האפליקציה מחדש כדי להמשיך.
        </Text>

        <Pressable
          onPress={handleRestart}
          accessibilityRole="button"
          accessibilityLabel="טעינה מחדש"
          style={({ pressed }) => [
            styles.button,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.buttonText}>טעינה מחדש →</Text>
        </Pressable>

        {__DEV__ ? (
          <Pressable
            onPress={() => setIsModalVisible(true)}
            accessibilityRole="button"
            style={styles.devLink}
          >
            <Text style={styles.devLinkText}>הצג פרטי שגיאה (DEV)</Text>
          </Pressable>
        ) : null}
      </View>

      {__DEV__ ? (
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalScrim}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHead}>
                <Text style={styles.modalTitle}>Error Details</Text>
                <Pressable
                  onPress={() => setIsModalVisible(false)}
                  accessibilityRole="button"
                  hitSlop={8}
                >
                  <Text style={styles.modalClose}>סגור</Text>
                </Pressable>
              </View>
              <View style={styles.modalRule} />
              <ScrollView>
                <Text style={styles.errorText} selectable>
                  {error.message}
                  {error.stack ? `\n\n${error.stack}` : ""}
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  code: {
    ...typography.mono,
    color: palette.danger,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.displayXL,
    fontSize: 48,
    lineHeight: 50,
    color: palette.text,
    textAlign: "right",
    writingDirection: "rtl",
  },
  rule: {
    width: 56,
    height: 2,
    backgroundColor: palette.danger,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  body: {
    ...typography.bodyLg,
    color: palette.textSecondary,
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: spacing.xl,
  },
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    backgroundColor: palette.champagne,
    borderRadius: 999,
  },
  buttonText: {
    ...typography.h3,
    color: palette.champagneText,
    fontSize: 14,
    fontWeight: "800",
  },
  devLink: { marginTop: spacing.lg },
  devLinkText: {
    ...typography.mono,
    color: palette.textMuted,
  },

  modalScrim: {
    flex: 1,
    backgroundColor: "rgba(10,9,8,0.78)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    width: "100%",
    height: "80%",
    backgroundColor: palette.surface,
    padding: spacing.lg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  modalHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  modalTitle: {
    ...typography.h2,
    color: palette.text,
  },
  modalClose: {
    ...typography.h3,
    color: palette.accent,
    fontSize: 13,
  },
  modalRule: { height: 1, backgroundColor: palette.border, marginBottom: spacing.md },
  errorText: {
    ...typography.mono,
    fontSize: 11,
    color: palette.text,
    lineHeight: 18,
  },
});
