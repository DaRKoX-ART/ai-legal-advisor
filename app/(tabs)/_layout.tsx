import { Tabs } from "expo-router";
import React from "react";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PaperDock } from "@/components/PaperDock";
import { palette } from "@/constants/theme";

/**
 * Tabs with the new PaperDock — text-only nav, no FAB.
 * Each tab is a fully composed screen; the primary "ask" action lives
 * inside the Home screen content, not the chrome.
 */
export default function TabsLayout() {
  return (
    <ErrorBoundary>
      <Tabs
        tabBar={(props) => <PaperDock {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: palette.bg },
        }}
      >
        <Tabs.Screen name="home" />
        <Tabs.Screen name="history" />
        <Tabs.Screen name="about" />
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs>
    </ErrorBoundary>
  );
}
