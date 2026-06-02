import AsyncStorage from "@react-native-async-storage/async-storage";

import { supabase } from "./client";

const QUEUE_KEY = "@folio/analytics_queue";
const MAX_QUEUE_SIZE = 200;

export type AnalyticsEvent = {
  event_type: string;
  metadata?: Record<string, unknown>;
  client_timestamp: string;
};

/**
 * Insert a single analytics event to Supabase.
 * Returns true on success, false on failure.
 */
export async function insertEvent(
  event: AnalyticsEvent,
  userId: string | null,
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("request_events").insert({
    user_id: userId,
    event_type: event.event_type,
    metadata: event.metadata ?? {},
    client_timestamp: event.client_timestamp,
  } as any);
  if (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn("[analytics] insert failed:", error.message);
    }
    return false;
  }
  return true;
}

/**
 * Load the offline event queue from AsyncStorage.
 */
export async function loadQueue(): Promise<AnalyticsEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save the offline event queue to AsyncStorage.
 */
export async function saveQueue(queue: AnalyticsEvent[]): Promise<void> {
  const trimmed = queue.slice(-MAX_QUEUE_SIZE);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(trimmed));
}

/**
 * Append an event to the offline queue.
 */
export async function queueEvent(event: AnalyticsEvent): Promise<void> {
  const queue = await loadQueue();
  queue.push(event);
  await saveQueue(queue);
}

/**
 * Flush all queued events to Supabase.
 * Returns the number of successfully sent events.
 */
export async function flushQueue(userId: string | null): Promise<number> {
  if (!supabase) return 0;
  const queue = await loadQueue();
  if (queue.length === 0) return 0;

  const batch = queue.map((event) => ({
    user_id: userId,
    event_type: event.event_type,
    metadata: event.metadata ?? {},
    client_timestamp: event.client_timestamp,
  }));

  const { error } = await supabase.from("request_events").insert(batch as any);
  if (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn("[analytics] flush failed:", error.message);
    }
    return 0;
  }

  await AsyncStorage.removeItem(QUEUE_KEY);
  return queue.length;
}
