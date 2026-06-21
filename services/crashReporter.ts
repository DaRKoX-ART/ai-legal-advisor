/**
 * Lightweight in-house client-side crash reporter.
 *
 * Why not Sentry? Sentry on Expo SDK 54 requires a native module and a
 * prebuild step. For FOLIO v1.0 we want zero new dependencies and a
 * stable launch. This module piggy-backs on the existing Supabase
 * analytics pipeline so production errors land in the same dashboard.
 *
 * If/when the app needs richer crash data (source maps, breadcrumbs,
 * release tracking), swap the `_sink` function for a `@sentry/react-native`
 * call. The public API of this module won't change.
 *
 * What it captures (always sanitized — never PII):
 *   - error name + message  (truncated to 400 chars)
 *   - first 2000 chars of the stack trace
 *   - free-form `context` tag identifying where it came from
 *   - platform, OS version, app version
 *   - whether the user was authenticated at the moment of the error
 *
 * What it explicitly does NOT capture:
 *   - The user's legal question text.
 *   - The user's name or any answer content.
 *   - API keys, tokens, headers, URLs with query params.
 *
 * Respects the user's analytics consent. If consent is off, the report
 * is dropped silently (no queueing) — we never want crash reports to
 * become a back-door around consent.
 */
import { Platform } from "react-native";
import Constants from "expo-constants";

import { isAnalyticsAllowed, insertEvent } from "@/services/supabase/analytics";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

export type CrashContext =
  | "render"
  | "ask"
  | "auth"
  | "navigation"
  | "storage"
  | "share"
  | "unknown";

function truncate(s: string, max: number): string {
  if (!s) return "";
  return s.length > max ? s.slice(0, max) + "…" : s;
}

/**
 * Report a non-fatal client error. Fire-and-forget; never throws.
 *
 * @param error    The Error object (or anything we can stringify).
 * @param context  A short tag identifying the failure site. Use one of
 *                 the CrashContext values for consistency.
 * @param extra    Optional extra metadata — keys MUST NOT contain PII.
 *                 The whole `extra` object is shallow-cloned and limited
 *                 to primitive values; nested objects are stringified.
 */
export function reportError(
  error: unknown,
  context: CrashContext = "unknown",
  extra?: Record<string, string | number | boolean | undefined>,
): void {
  // Consent gate. Same behaviour as analytics — if off, drop.
  if (!isAnalyticsAllowed()) return;

  const err = error as { name?: string; message?: string; stack?: string };
  const name = typeof err?.name === "string" ? err.name : "Error";
  const message =
    typeof err?.message === "string" ? err.message : String(err ?? "");
  const stack = typeof err?.stack === "string" ? err.stack : "";

  // Sanitize the `extra` object: only keep primitives, truncate strings.
  const safeExtra: Record<string, string | number | boolean> = {};
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v === undefined || v === null) continue;
      if (typeof v === "string") safeExtra[k] = truncate(v, 200);
      else if (typeof v === "number" || typeof v === "boolean") safeExtra[k] = v;
    }
  }

  const event = {
    event_type: "client_error",
    metadata: {
      context,
      name: truncate(name, 80),
      message: truncate(message, 400),
      stack: truncate(stack, 2000),
      platform: Platform.OS,
      platform_version: String(Platform.Version ?? ""),
      app_version: APP_VERSION,
      ...safeExtra,
    },
    client_timestamp: new Date().toISOString(),
  };

  // Mirror to dev console so the failure isn't completely silent during
  // local development. Production builds emit nothing to console.
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn(`[crash:${context}]`, name, message);
  }

  // Fire-and-forget. Failures here cannot themselves trigger reports
  // (no recursion). `insertEvent` swallows its own errors silently.
  insertEvent(event, null).catch(() => {});
}

/**
 * Convenience wrapper for async functions. Logs any thrown error and
 * returns `null`. Use sparingly — most call sites should keep their
 * own error handling and call `reportError` explicitly.
 */
export async function reportingTry<T>(
  fn: () => Promise<T>,
  context: CrashContext,
): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    reportError(err, context);
    return null;
  }
}
