import { useCallback } from "react";

import { useAuth } from "@/context/AuthContext";
import {
  flushQueue,
  insertEvent,
  queueEvent,
  type AnalyticsEvent,
} from "@/services/supabase/analytics";

/**
 * Analytics tracking hook with offline queue support.
 *
 * Usage:
 *   const { track } = useAnalytics();
 *   track("question_asked", { category: "דיני עבודה", language: "he" });
 *
 * Behavior:
 *   - If authenticated and online: sends immediately to Supabase.
 *   - If unauthenticated or offline: queues in AsyncStorage for later flush.
 *   - On every track() call, attempts to flush the queue.
 *   - Completely silent: no UI feedback, no blocking, no errors thrown.
 */
export function useAnalytics() {
  const auth = useAuth();

  const track = useCallback(
    (eventType: string, metadata?: Record<string, unknown>) => {
      const event: AnalyticsEvent = {
        event_type: eventType,
        metadata,
        client_timestamp: new Date().toISOString(),
      };

      const userId = auth.user?.id ?? null;

      // Attempt immediate send + queue flush in the background
      (async () => {
        // Try to flush any previously queued events first
        await flushQueue(userId);

        // Then try to send this event
        const ok = await insertEvent(event, userId);
        if (!ok) {
          // If immediate send fails, queue for later
          await queueEvent(event);
        }
      })();
    },
    [auth.user?.id],
  );

  return { track };
}
