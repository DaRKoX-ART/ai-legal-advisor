import { Stack } from "expo-router";
import React from "react";

import { palette } from "@/constants/theme";

/**
 * Ask stack — modal presentation for both the composer and the loading overlay.
 *
 *   /ask          (index)  — premium question composer, slides up from bottom
 *   /ask/loading  (loading) — AI analysis overlay, fades in seamlessly
 */
export default function AskStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.dark },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          gestureEnabled: true,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="loading"
        options={{
          gestureEnabled: false,
          presentation: "modal",
          animation: "fade",
        }}
      />
    </Stack>
  );
}
