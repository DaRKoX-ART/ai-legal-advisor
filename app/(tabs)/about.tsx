import { Feather } from "@expo/vector-icons";
import Constants from "expo-constants";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DotGrid, GoldHairline } from "@/components/atmosphere";
import { Reveal } from "@/components/Reveal";
import { LEGAL_DISCLAIMER_HE } from "@/constants/legal";
import { palette, radius, shadow, spacing, typography } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";

type IconName = React.ComponentProps<typeof Feather>["name"];

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const {
    user,
    answers,
    signOut,
    settings,
    updateSettings,
    exportAllAsJson,
    clearAllAnswers,
  } = useApp();

  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const isCloudUser = auth.isAuthenticated;

  const logoutMessage = isCloudUser
    ? "פעולה זו תנתק אותך מהחשבון. התשובות המקומיות יישארו שמורות במכשיר."
    : "פעולה זו תנתק אותך ותחזיר אותך למסך הפתיחה. התשובות יישארו שמורות במכשיר.";

  const performSignOut = () => {
    // Fire-and-forget: navigation must happen even if signOut throws.
    signOut()
      .catch(() => {})
      .finally(() => {
        router.replace("/(auth)/welcome" as any);
      });
  };

  const handleSignOut = () => {
    if (Platform.OS === "web") {
      setShowLogoutConfirm(true);
      return;
    }
    Alert.alert("התנתקות", logoutMessage, [
      { text: "ביטול", style: "cancel" },
      {
        text: "התנתק",
        style: "destructive",
        onPress: performSignOut,
      },
    ]);
  };

  const handleExport = async () => {
    if (answers.length === 0) {
      Alert.alert("אין מה לייצא", "אין תשובות שמורות.");
      return;
    }
    const json = exportAllAsJson();
    try {
      await Share.share({
        message: json,
        title: `FOLIO export · ${answers.length} answers`,
      });
    } catch {
      // user cancelled
    }
  };

  const handleDeleteAll = () => {
    if (answers.length === 0) {
      Alert.alert("אין מה למחוק", "אין תשובות שמורות.");
      return;
    }
    Alert.alert(
      "מחיקת כל התשובות",
      `פעולה זו תמחק לצמיתות את כל ${answers.length} התשובות מהמכשיר.`,
      [
        { text: "ביטול", style: "cancel" },
        {
          text: "מחק הכל",
          style: "destructive",
          onPress: () => clearAllAnswers(),
        },
      ],
    );
  };

  const monogram = (user?.name ?? "א").trim().charAt(0).toUpperCase() || "א";

  return (
    <View style={s.root}>
      <DotGrid />

      <ScrollView
        contentContainerStyle={[
          s.scroll,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: 120 + Math.max(insets.bottom, 12),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Credit + gold hairline ── */}
        <Reveal delay={0}>
          <View style={s.creditRow}>
            <Text style={s.wordmark}>F · O · L · I · O</Text>
            <Text style={s.creditCaption}>פרופיל · הגדרות</Text>
          </View>
        </Reveal>

        <Reveal delay={60}>
          <GoldHairline style={{ marginBottom: spacing.lg }} />
        </Reveal>

        {/* ── Profile tile ── */}
        <Reveal delay={120}>
          <View style={s.profileTile}>
            <View style={s.avatarRing}>
              <View style={s.avatar}>
                <Text style={s.avatarLetter}>{monogram}</Text>
              </View>
            </View>
            <View style={s.profileText}>
              <Text style={s.profileEyebrow}>FOLIO · חשבון</Text>
              <Text style={s.profileName}>{user?.name ?? "אורח"}</Text>
              <Text style={s.profileMeta}>
                {user?.signedAt
                  ? `הצטרף/ה ${user.signedAt} · גרסת הצהרה ${user.disclaimerVersion ?? "v1"}`
                  : "כניסה חדשה"}
              </Text>
            </View>
          </View>
        </Reveal>

        {/* ── Account ── */}
        <Reveal delay={180}>
          <SectionLabel>חשבון</SectionLabel>
        </Reveal>
        <Reveal delay={220}>
          <View style={s.sectionCard}>
            {isCloudUser ? (
              <>
                <DataRow
                  icon="cloud"
                  label="מחובר לענן"
                  description={auth.user?.email ?? "חשבון פעיל"}
                  onPress={() => {}}
                />
                {auth.profile?.is_admin && (
                  <DataRow
                    icon="shield"
                    label="לוח בקרה"
                    description="ניהול מערכת"
                    onPress={() => router.push("/admin" as any)}
                  />
                )}
                <DataRow
                  icon="log-out"
                  label="התנתק"
                  description="ניתן להיכנס שוב בכל עת"
                  tone="danger"
                  onPress={handleSignOut}
                  isLast
                />
              </>
            ) : (
              <>
                <DataRow
                  icon="user"
                  label="מצב אורח"
                  description="התשובות נשמרות במכשיר בלבד"
                  onPress={() => {}}
                />
                <DataRow
                  icon="log-in"
                  label="התחבר או צור חשבון"
                  description="סנכרן את התיקים בענן"
                  onPress={() => router.push("/(auth)/welcome" as any)}
                />
                <DataRow
                  icon="log-out"
                  label="התנתק"
                  description="ניקוי מצב משתמש מקומי"
                  tone="danger"
                  onPress={handleSignOut}
                  isLast
                />
              </>
            )}
          </View>
        </Reveal>

        {/* ── What FOLIO does ── */}
        <Reveal delay={200}>
          <SectionLabel>מה זה FOLIO</SectionLabel>
        </Reveal>
        <Reveal delay={240}>
          <View style={s.sectionCard}>
            <FactLine text="מסביר בעברית פשוטה את המצב המשפטי." />
            <FactLine text="מסווג את התחום (עבודה, חוזים, משפחה, פלילי, כללי)." />
            <FactLine text="נותן צעדים מומלצים מיידיים." />
            <FactLine text="שומר את התשובות במכשיר שלך בלבד." />
            <FactLine
              tone="danger"
              text="לא מחליף עורך דין. לא נותן ייעוץ אישי או הבטחה משפטית."
              isLast
            />
          </View>
        </Reveal>

        {/* ── Settings ── */}
        <Reveal delay={320}>
          <SectionLabel>הגדרות</SectionLabel>
        </Reveal>
        <Reveal delay={360}>
          <View style={s.sectionCard}>
            <SettingRow
              label="מצב דמו"
              description="הצג כפתור 'תשובת דמו' אם ה-AI נכשל."
              value={settings.demoEnabled}
              onValueChange={(v) => updateSettings({ demoEnabled: v })}
            />
            <SettingRow
              label="שיפור האפליקציה"
              description="שליחת נתוני שימוש אנונימיים (ללא תוכן שאלות)."
              value={settings.analyticsEnabled}
              onValueChange={(v) => updateSettings({ analyticsEnabled: v })}
              isLast
            />
          </View>
        </Reveal>

        {/* ── Data ── */}
        <Reveal delay={440}>
          <SectionLabel>הנתונים שלך</SectionLabel>
        </Reveal>
        <Reveal delay={480}>
          <View style={s.sectionCard}>
            <DataRow
              icon="upload"
              label="ייצוא כל התשובות"
              description={`${answers.length} תשובות · JSON`}
              onPress={handleExport}
            />
            <DataRow
              icon="trash-2"
              label="מחיקת כל התשובות"
              description="פעולה לא הפיכה"
              tone="danger"
              onPress={handleDeleteAll}
              isLast
            />
          </View>
        </Reveal>

        {/* ── Legal ── */}
        <Reveal delay={560}>
          <SectionLabel>הצהרה משפטית</SectionLabel>
        </Reveal>
        <Reveal delay={600}>
          <View style={s.sectionCard}>
            <DataRow
              icon="file-text"
              label="קרא את ההצהרה המלאה"
              description={`גרסת ${user?.disclaimerVersion ?? "v1"}`}
              onPress={() => setShowDisclaimer(true)}
              isLast
            />
          </View>
        </Reveal>

        <Reveal delay={680}>
          <View style={{ marginTop: spacing.xxl }}>
            <GoldHairline />
            <Text style={s.colophon}>
              FOLIO · v{APP_VERSION} · עוזר משפטי AI פרטי.
            </Text>
          </View>
        </Reveal>
      </ScrollView>

      {/* ── Disclaimer modal ── */}
      <Modal
        visible={showDisclaimer}
        animationType="fade"
        transparent
        onRequestClose={() => setShowDisclaimer(false)}
      >
        <Pressable style={d.scrim} onPress={() => setShowDisclaimer(false)}>
          <Pressable style={d.sheet} onPress={() => {}}>
            <View style={d.head}>
              <Text style={d.title}>הצהרת אחריות</Text>
              <Pressable
                onPress={() => setShowDisclaimer(false)}
                accessibilityRole="button"
                accessibilityLabel="סגור"
                hitSlop={8}
              >
                <Feather name="x" size={20} color={palette.bone} />
              </Pressable>
            </View>
            <View style={d.rule} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={d.body}>{LEGAL_DISCLAIMER_HE}</Text>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Logout confirmation modal (web fallback) ── */}
      <Modal
        visible={showLogoutConfirm}
        animationType="fade"
        transparent
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <Pressable
          style={d.scrim}
          onPress={() => setShowLogoutConfirm(false)}
        >
          <Pressable style={[d.sheet, { maxHeight: undefined }]} onPress={() => {}}>
            <View style={d.head}>
              <Text style={d.title}>התנתקות</Text>
              <Pressable
                onPress={() => setShowLogoutConfirm(false)}
                accessibilityRole="button"
                accessibilityLabel="סגור"
                hitSlop={8}
              >
                <Feather name="x" size={20} color={palette.bone} />
              </Pressable>
            </View>
            <View style={d.rule} />
            <Text style={d.body}>{logoutMessage}</Text>
            <View
              style={{
                flexDirection: "row-reverse",
                gap: spacing.sm,
                marginTop: spacing.lg,
              }}
            >
              <Pressable
                onPress={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                  borderRadius: radius.lg,
                  backgroundColor: palette.glassRaised,
                  borderWidth: 1,
                  borderColor: palette.glassBorder,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    ...typography.body,
                    fontWeight: "700",
                    color: palette.bone,
                  }}
                >
                  ביטול
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowLogoutConfirm(false);
                  performSignOut();
                }}
                style={{
                  flex: 1,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                  borderRadius: radius.lg,
                  backgroundColor: palette.inkDangerSoft,
                  borderWidth: 1,
                  borderColor: palette.inkDanger,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    ...typography.body,
                    fontWeight: "800",
                    color: palette.inkDanger,
                  }}
                >
                  התנתק
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={s.sectionLabel}>{children}</Text>;
}

function FactLine({
  text,
  tone = "default",
  isLast,
}: {
  text: string;
  tone?: "default" | "danger";
  isLast?: boolean;
}) {
  const isDanger = tone === "danger";
  return (
    <View style={[s.factRow, isLast && s.lastRow]}>
      <View
        style={[
          s.factDot,
          { backgroundColor: isDanger ? palette.inkDanger : palette.champagne },
        ]}
      />
      <Text
        style={[
          s.factText,
          isDanger && { color: palette.inkDanger, fontWeight: "700" },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function SettingRow({
  label,
  description,
  value,
  onValueChange,
  isLast,
}: {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  isLast?: boolean;
}) {
  return (
    <View style={[s.settingRow, isLast && s.lastRow]}>
      <View style={s.settingText}>
        <Text style={s.settingLabel}>{label}</Text>
        <Text style={s.settingDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: palette.glassBorder,
          true: palette.champagne,
        }}
        thumbColor={value ? palette.champagneText : palette.bone}
        ios_backgroundColor={palette.glassBorder}
        accessibilityLabel={label}
        accessibilityHint={description}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
      />
    </View>
  );
}

function DataRow({
  icon,
  label,
  description,
  tone,
  onPress,
  isLast,
}: {
  icon: IconName;
  label: string;
  description: string;
  tone?: "danger";
  onPress: () => void;
  isLast?: boolean;
}) {
  const isDanger = tone === "danger";
  const color = isDanger ? palette.inkDanger : palette.bone;
  const iconBg = isDanger ? palette.dangerSoft : palette.champagneSoft;
  const iconBorder = isDanger ? palette.dangerBorder : palette.champagneBorder;
  const iconTint = isDanger ? palette.inkDanger : palette.champagne;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.dataRow,
        isLast && s.lastRow,
        pressed && s.dataRowPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View
        style={[
          s.dataIcon,
          { backgroundColor: iconBg, borderColor: iconBorder },
        ]}
      >
        <Feather name={icon} size={16} color={iconTint} />
      </View>
      <View style={s.dataText}>
        <Text style={[s.dataLabel, { color }]}>{label}</Text>
        <Text style={s.dataDesc}>{description}</Text>
      </View>
      <Feather name="chevron-left" size={16} color={palette.ash} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.ink },
  scroll: {
    paddingHorizontal: spacing.lg,
  },

  // Credit
  creditRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  wordmark: {
    ...typography.mono,
    fontSize: 12,
    letterSpacing: 4,
    color: palette.champagne,
  },
  creditCaption: {
    ...typography.mono,
    fontSize: 10,
    letterSpacing: 2.4,
    color: palette.ash,
  },
  // Profile tile
  profileTile: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: palette.glassRaised,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadow.md,
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
    backgroundColor: palette.champagneBorderHi,
  },
  avatar: {
    flex: 1,
    borderRadius: 30,
    backgroundColor: palette.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    ...typography.display,
    fontSize: 26,
    color: palette.champagne,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  profileText: { flex: 1, alignItems: "flex-end" },
  profileEyebrow: {
    ...typography.mono,
    fontSize: 9,
    letterSpacing: 2,
    color: palette.ash,
    marginBottom: 2,
  },
  profileName: {
    ...typography.h2,
    fontSize: 20,
    fontWeight: "800",
    color: palette.bone,
    textAlign: "right",
    writingDirection: "rtl",
  },
  profileMeta: {
    ...typography.caption,
    fontSize: 11,
    color: palette.ash,
    textAlign: "right",
    marginTop: 4,
  },

  // Section
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
    paddingHorizontal: spacing.xs,
  },
  sectionCard: {
    backgroundColor: palette.glassRaised,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: spacing.xs,
  },

  // Fact line
  factRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.glassBorder,
  },
  factDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  factText: {
    flex: 1,
    ...typography.body,
    fontSize: 14,
    lineHeight: 22,
    color: palette.bone,
    textAlign: "right",
    writingDirection: "rtl",
  },

  // Setting row
  settingRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.glassBorder,
  },
  settingText: { flex: 1, alignItems: "flex-end" },
  settingLabel: {
    ...typography.h3,
    fontSize: 15,
    fontWeight: "700",
    color: palette.bone,
    textAlign: "right",
  },
  settingDesc: {
    ...typography.bodySm,
    fontSize: 12,
    color: palette.boneDim,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: 2,
  },

  // Data row
  dataRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.glassBorder,
    gap: spacing.md,
    minHeight: 56,
  },
  dataRowPressed: { backgroundColor: palette.glassHi },
  dataIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dataText: { flex: 1, alignItems: "flex-end" },
  dataLabel: {
    ...typography.h3,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
  },
  dataDesc: {
    ...typography.bodySm,
    fontSize: 12,
    color: palette.boneDim,
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: 2,
  },

  // Last row in a sectionCard — no bottom border
  lastRow: {
    borderBottomWidth: 0,
  },

  colophon: {
    ...typography.mono,
    fontSize: 10,
    color: palette.ash,
    textAlign: "center",
    marginTop: spacing.md,
    letterSpacing: 1.5,
  },
});

const d = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: "rgba(10,9,8,0.78)",
    padding: spacing.lg,
    justifyContent: "center",
  },
  sheet: {
    backgroundColor: palette.inkRaised,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    borderRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: "82%",
    ...shadow.xl,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    ...typography.h1,
    fontSize: 20,
    fontWeight: "800",
    color: palette.bone,
    textAlign: "right",
  },
  rule: {
    height: 1,
    backgroundColor: palette.champagneBorder,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  body: {
    ...typography.body,
    fontSize: 14,
    color: palette.boneDim,
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 22,
  },
});
