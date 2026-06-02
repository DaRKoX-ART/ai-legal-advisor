import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { palette } from "@/constants/theme";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import { IntakeProvider } from "@/context/IntakeContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.bg },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="onboarding"
        options={{
          animation: "fade",
          contentStyle: { backgroundColor: palette.bg },
        }}
      />
      <Stack.Screen name="(tabs)" />
      {/* Ask flow — a modal loader on the dark canvas. */}
      <Stack.Screen
        name="ask"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
          contentStyle: { backgroundColor: palette.ink },
        }}
      />
      {/* Saved answer detail. */}
      <Stack.Screen
        name="saved/[id]"
        options={{
          presentation: "card",
          animation: "slide_from_right",
          contentStyle: { backgroundColor: palette.bg },
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AppProvider>
              <IntakeProvider>
              <GestureHandlerRootView style={styles.root}>
                <KeyboardProvider>
                  <View style={styles.root}>
                    <StatusBar style="light" />
                    <RootStack />
                  </View>
                </KeyboardProvider>
              </GestureHandlerRootView>
            </IntakeProvider>
            </AppProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
});
