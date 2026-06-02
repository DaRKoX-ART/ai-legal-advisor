import { Feather } from "@expo/vector-icons";
import React, { useRef } from "react";
import {
  Animated,
  Easing,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { palette, radius, spacing, typography } from "@/constants/theme";
import { useHaptic } from "@/hooks";
import type { LegalAidContact } from "@/types/answer";

type Props = {
  items: LegalAidContact[];
};

export function LegalAidCard({ items }: Props) {
  if (items.length === 0) return null;
  return (
    <View style={s.list}>
      {items.map((item, i) => (
        <AidRow key={`${item.phone}-${i}`} item={item} />
      ))}
    </View>
  );
}

function AidRow({ item }: { item: LegalAidContact }) {
  const press = useRef(new Animated.Value(1)).current;
  const { selection: hapticSelection } = useHaptic();

  const onPressIn = () => {
    Animated.timing(press, {
      toValue: 0.97,
      duration: 90,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };
  const onPressOut = () => {
    Animated.timing(press, {
      toValue: 1,
      duration: 140,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const onPress = async () => {
    hapticSelection();
    const sanitized = item.phone.replace(/[^\d+]/g, "");
    const url = `tel:${sanitized}`;
    try {
      const can = await Linking.canOpenURL(url);
      if (can) await Linking.openURL(url);
    } catch {}
  };

  return (
    <Animated.View style={{ transform: [{ scale: press }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={s.row}
        accessibilityRole="button"
        accessibilityLabel={`חייג ${item.name}`}
      >
        <View style={s.rowBody}>
          <Text style={s.name}>{item.name}</Text>
          {item.note ? <Text style={s.note}>{item.note}</Text> : null}
        </View>
        <View style={s.callBtn}>
          <View style={s.callIcon}>
            <Feather name="phone" size={12} color={palette.champagneText} />
          </View>
          <Text style={s.callText}>{item.phone}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  list: { gap: 10 },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  rowBody: { flex: 1, gap: 2 },
  name: {
    ...typography.h3,
    fontSize: 15,
    color: palette.text,
    fontWeight: "800",
    textAlign: "right",
    writingDirection: "rtl",
  },
  note: {
    ...typography.bodySm,
    fontSize: 12.5,
    color: palette.textSecondary,
    textAlign: "right",
    writingDirection: "rtl",
  },

  callBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: palette.accent,
    borderRadius: radius.full,
  },
  callIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  callText: {
    ...typography.mono,
    fontSize: 12,
    color: palette.champagneText,
    letterSpacing: 0.4,
    fontWeight: "800",
  },
});
