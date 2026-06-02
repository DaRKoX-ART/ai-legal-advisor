import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export function useHaptic() {
  const selection = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const impact = (
    style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light,
  ) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(style).catch(() => {});
    }
  };

  const notification = (type: Haptics.NotificationFeedbackType) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(type).catch(() => {});
    }
  };

  return { selection, impact, notification };
}
