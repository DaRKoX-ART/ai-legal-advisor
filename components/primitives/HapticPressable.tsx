import React from "react";
import { Pressable, PressableProps } from "react-native";

import { useHaptic } from "@/hooks";

type Props = PressableProps & {
  children: React.ReactNode;
};

/**
 * Pressable that automatically triggers a haptic selection on press.
 *
 * Forwards all Pressable props (onPressIn, onPressOut, disabled, etc.)
 * so it can be used as a drop-in replacement wherever a simple pressable
 * with haptic feedback is needed.
 */
export function HapticPressable({ children, onPress, ...rest }: Props) {
  const { selection: hapticSelection } = useHaptic();

  return (
    <Pressable
      {...rest}
      onPress={(e) => {
        hapticSelection();
        onPress?.(e);
      }}
    >
      {children}
    </Pressable>
  );
}
