import Constants from "expo-constants";

import {
  DEMO_DISCLAIMER_HE,
  FALLBACK_DISCLAIMER_HE,
  detectLanguage,
  legalAidForAnswer,
} from "@/constants/legal";
import { reportError } from "@/services/crashReporter";
import type {
  ActionItem,
  DeadlineHint,
  EvidenceItem,
  GlossaryTerm,
  LegalAidContact,
  LegalCategoryKey,
  SavedAnswer,
} from "@/types/answer";
import type {
  LegalAiErrorCode,
  LegalAiErrorPayload,
  LegalUrgency,
  SupportedLanguage,
} from "@/types/legal";

const REQUEST_TIMEOUT_MS = 25000;

/**
 * Resolve the backend `/api/chat` URL the frontend should call.
 *
 * Resolution order (first non-empty wins):
 *
 *   1. `EXPO_PUBLIC_AI_API_URL`        — explicit override
 *   2. `EXPO_PUBLIC_DOMAIN`            — `https://{domain}/api/chat`
 *   3. **Dev-only fallback** (`__DEV__`):
 *        a. Expo dev-server `hostUri` (so phones on LAN auto-resolve to
 *           the developer's PC at port 3000 without any env config).
 *        b. `http://localhost:3000/api/chat` as a last resort.
 *   4. Production with nothing set     → `""`, which forces `askLegal`
 *                                         to emit `AI_UNAVAILABLE`.
 *
 * Expo replaces `EXPO_PUBLIC_*` references at **bundle time**, so if
 * the developer edits `.env` after starting Metro, the new value won't
 * be visible until the bundle is rebuilt with `npx expo start -c`.
 * The `__DEV__` fallback keeps local development working out of the
 * box even when that happens.
 */
function resolveApiUrl(): string {
  if (process.env.EXPO_PUBLIC_AI_API_URL) {
    return process.env.EXPO_PUBLIC_AI_API_URL;
  }
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}/api/chat`;
  }
  if (__DEV__) {
    // Expo embeds the dev server's host (e.g. "192.168.1.20:8081") on
    // `Constants.expoConfig.hostUri`. We strip the port and reuse the
    // host for the backend, since the backend runs on the same PC.
    const expoConfig = Constants.expoConfig as
      | { hostUri?: string }
      | null
      | undefined;
    const legacyManifest = (Constants as unknown as {
      manifest?: { hostUri?: string } | null;
    }).manifest;
    const hostUri =
      (expoConfig && expoConfig.hostUri) ||
      (legacyManifest && legacyManifest.hostUri) ||
      "";
    const host = typeof hostUri === "string" ? hostUri.split(":")[0] : "";
    const safeHost = host && host.length > 0 ? host : "localhost";
    return `http://${safeHost}:3000/api/chat`;
  }
  return "";
}

const RESOLVED_API_URL = resolveApiUrl();

// Optional shared secret enforced by the back-end. When set, every
// `/api/chat` request is sent with `X-FOLIO-Token: <value>`. Bundled at
// build time like all EXPO_PUBLIC_* env vars.
const PROXY_TOKEN =
  typeof process.env.EXPO_PUBLIC_AI_PROXY_TOKEN === "string"
    ? process.env.EXPO_PUBLIC_AI_PROXY_TOKEN
    : "";

/**
 * Dev-only logger. No-op in production builds.
 * Never logs API keys or user prompt contents; only metadata.
 */
function devLog(...args: unknown[]) {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log("[legalAi]", ...args);
  }
}

if (__DEV__) {
  devLog("resolved API URL →", RESOLVED_API_URL || "(empty — will fail)");
}

const KNOWN_CODES: ReadonlyArray<LegalAiErrorCode> = [
  "AI_UNAVAILABLE",
  "INVALID_INPUT",
  "MISSING_API_KEY",
  "UPSTREAM_TIMEOUT",
  "INVALID_AI_RESPONSE",
  "NETWORK_ERROR",
  "RATE_LIMITED",
];

const ALLOWED_CATEGORIES: LegalCategoryKey[] = [
  "דיני עונשין",
  "דיני משפחה",
  "חוזים",
  "דיני עבודה",
  "כללי",
];

function isKnownCode(code: string): code is LegalAiErrorCode {
  return (KNOWN_CODES as readonly string[]).includes(code);
}
function makeError(code: LegalAiErrorCode, message: string): LegalAiErrorPayload {
  return { error: true, code, message };
}
function isValidUrgency(v: unknown): v is LegalUrgency {
  return v === "low" || v === "medium" || v === "high";
}
function isValidLanguage(v: unknown): v is SupportedLanguage {
  return v === "he" || v === "ar" || v === "en";
}
function isValidCategory(v: unknown): v is LegalCategoryKey {
  return (
    typeof v === "string" &&
    (ALLOWED_CATEGORIES as readonly string[]).includes(v)
  );
}

// ── Per-item validators ──────────────────────────────────────────────
function isStringNonEmpty(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function normalizeActionItem(raw: unknown): { text: string; deadline?: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!isStringNonEmpty(r.text)) return null;
  const text = r.text.trim().slice(0, 220);
  const deadline = isStringNonEmpty(r.deadline)
    ? r.deadline.trim().slice(0, 80)
    : undefined;
  return deadline ? { text, deadline } : { text };
}
function normalizeEvidenceItem(raw: unknown): { text: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!isStringNonEmpty(r.text)) return null;
  return { text: r.text.trim().slice(0, 180) };
}
function normalizeGlossary(raw: unknown): GlossaryTerm | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!isStringNonEmpty(r.term) || !isStringNonEmpty(r.definition)) return null;
  return {
    term: r.term.trim().slice(0, 60),
    definition: r.definition.trim().slice(0, 220),
  };
}
function normalizeDeadlineHint(raw: unknown): DeadlineHint | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  if (!isStringNonEmpty(r.label)) return undefined;
  const label = r.label.trim().slice(0, 80);
  const iso =
    isStringNonEmpty(r.iso) && /^\d{4}-\d{2}-\d{2}$/.test(r.iso)
      ? r.iso
      : undefined;
  const relative = isStringNonEmpty(r.relative)
    ? r.relative.trim().slice(0, 80)
    : undefined;
  if (!iso && !relative) return undefined;
  return { label, ...(iso ? { iso } : {}), ...(relative && !iso ? { relative } : {}) };
}
function normalizeLegalAid(raw: unknown): LegalAidContact[] {
  if (!Array.isArray(raw)) return [];
  const out: LegalAidContact[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    if (!isStringNonEmpty(o.name) || !isStringNonEmpty(o.phone)) continue;
    out.push({
      name: o.name.trim().slice(0, 80),
      phone: o.phone.trim().slice(0, 32),
      note: isStringNonEmpty(o.note) ? o.note.trim().slice(0, 80) : undefined,
    });
    if (out.length >= 4) break;
  }
  return out;
}

/**
 * Generate stable client-side ids for checklist items. The id format
 * `${prefix}-${index}` is stable for a single answer's lifetime —
 * we generate at save time and never regenerate, so checking off an
 * item persists through reloads.
 */
function withIds<T extends { text: string }>(
  items: T[],
  prefix: string,
): (T & { id: string; done: false })[] {
  return items.map((item, i) => ({
    ...item,
    id: `${prefix}-${i}`,
    done: false,
  }));
}

export interface AnswerPayload {
  title: string;
  brief: string;
  insight?: string;
  explanation: string;
  actionPlan: ActionItem[];
  evidenceChecklist: EvidenceItem[];
  commonMistakes: string[];
  lawyerReason?: string;
  lawyerQuestions: string[];
  glossary: GlossaryTerm[];
  deadlineHint?: DeadlineHint;
  legalAid: LegalAidContact[];
  category: LegalCategoryKey;
  urgency: LegalUrgency;
  disclaimer: string;
  language: SupportedLanguage;
  source: "ai";
}

export type AskLegalResult =
  | { ok: true; data: AnswerPayload }
  | { ok: false; error: LegalAiErrorPayload };

/**
 * The single legal-AI call.
 *
 * Sends a flat `{ question, language }` payload, expects the structured
 * first-aid file shape back, validates each field strictly, and returns
 * a discriminated success / error. No retries. No silent fallback.
 */
export async function askLegal(question: string): Promise<AskLegalResult> {
  if (!RESOLVED_API_URL) {
    devLog("aborting: no API URL resolved");
    // This is a critical misconfiguration: a production build shipped
    // without `EXPO_PUBLIC_AI_API_URL`. Surface it once per session so
    // it shows up in the dashboard instead of silently failing.
    reportError(
      new Error("EXPO_PUBLIC_AI_API_URL not configured"),
      "ask",
      { reason: "missing_api_url" },
    );
    return {
      ok: false,
      error: makeError(
        "AI_UNAVAILABLE",
        "EXPO_PUBLIC_AI_API_URL is not configured.",
      ),
    };
  }

  const language = detectLanguage(question);
  devLog("POST →", RESOLVED_API_URL, {
    language,
    questionLen: question.length,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (PROXY_TOKEN) {
    headers["X-FOLIO-Token"] = PROXY_TOKEN;
  }

  let response: Response;
  try {
    response = await fetch(RESOLVED_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ question, language }),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timer);
    const name = (err as { name?: string } | null)?.name;
    if (name === "AbortError") {
      devLog("fetch timed out");
      return {
        ok: false,
        error: makeError("UPSTREAM_TIMEOUT", "Request timed out"),
      };
    }
    devLog("fetch failed (network)", {
      name,
      message: (err as { message?: string } | null)?.message,
    });
    return { ok: false, error: makeError("NETWORK_ERROR", "Network error") };
  }
  clearTimeout(timer);

  devLog("response", { status: response.status, ok: response.ok });

  let json: any = null;
  let rawTextSnippet = "";
  try {
    // Read the body once as text so we can both log it and JSON.parse it.
    // (Calling response.json() consumes the body, so we use response.text()
    // and then JSON.parse to keep a snippet for diagnostics.)
    const text = await response.text();
    rawTextSnippet = text.slice(0, 240);
    json = text ? JSON.parse(text) : null;
  } catch {
    devLog("invalid JSON body. snippet:", rawTextSnippet);
    return {
      ok: false,
      error: makeError("INVALID_AI_RESPONSE", "Bad JSON response"),
    };
  }

  if (!response.ok || json?.error === true) {
    devLog("server error body:", {
      status: response.status,
      code: json?.code,
      message: typeof json?.message === "string" ? json.message : undefined,
      snippet: response.ok ? undefined : rawTextSnippet,
    });
    const rawCode = typeof json?.code === "string" ? json.code : "";
    const code: LegalAiErrorCode = isKnownCode(rawCode)
      ? rawCode
      : "AI_UNAVAILABLE";
    const message =
      typeof json?.message === "string" && json.message.length > 0
        ? json.message
        : "AI service unavailable";

    // Report only operational failures that need attention, not the
    // transient/expected ones (network, rate-limit, input validation).
    if (
      code === "MISSING_API_KEY" ||
      code === "INVALID_AI_RESPONSE" ||
      (code === "AI_UNAVAILABLE" && response.status >= 500)
    ) {
      reportError(new Error(`${code}: ${message}`), "ask", {
        status: response.status,
        code,
      });
    }

    return { ok: false, error: makeError(code, message) };
  }

  if (typeof json.explanation !== "string" || !json.explanation.trim()) {
    devLog("missing required field 'explanation'. keys:", Object.keys(json ?? {}));
    return {
      ok: false,
      error: makeError(
        "INVALID_AI_RESPONSE",
        "Missing required fields in AI response",
      ),
    };
  }

  devLog("ok. response keys:", Object.keys(json));

  // ── Normalize each field defensively ─────────────────────────────
  const rawActions = Array.isArray(json.actionPlan)
    ? (json.actionPlan
        .map(normalizeActionItem)
        .filter(Boolean) as { text: string; deadline?: string }[])
    : [];
  const rawEvidence = Array.isArray(json.evidenceChecklist)
    ? (json.evidenceChecklist
        .map(normalizeEvidenceItem)
        .filter(Boolean) as { text: string }[])
    : [];
  const glossary = Array.isArray(json.glossary)
    ? (json.glossary.map(normalizeGlossary).filter(Boolean) as GlossaryTerm[])
    : [];
  const commonMistakes: string[] = Array.isArray(json.commonMistakes)
    ? json.commonMistakes
        .filter(isStringNonEmpty)
        .map((s: string) => s.trim().slice(0, 200))
        .slice(0, 4)
    : [];
  const lawyerQuestions: string[] = Array.isArray(json.lawyerQuestions)
    ? json.lawyerQuestions
        .filter(isStringNonEmpty)
        .map((s: string) => s.trim().slice(0, 200))
        .slice(0, 5)
    : [];

  const category: LegalCategoryKey = isValidCategory(json.category)
    ? json.category
    : "כללי";
  const urgency: LegalUrgency = isValidUrgency(json.urgency)
    ? json.urgency
    : "low";

  // legalAid comes from the server (curated, never AI-invented). If the
  // server doesn't ship it, fall back to the same client map so the
  // file is still useful in tests / older servers.
  const legalAid =
    normalizeLegalAid(json.legalAid).length > 0
      ? normalizeLegalAid(json.legalAid)
      : legalAidForAnswer(category, urgency);

  // Backward-compat: if a stub server still returns nextSteps[], lift
  // them into the action plan so the client still has work to render.
  if (rawActions.length === 0 && Array.isArray(json.nextSteps)) {
    for (const s of json.nextSteps) {
      if (isStringNonEmpty(s)) rawActions.push({ text: s.trim().slice(0, 220) });
    }
  }

  const data: AnswerPayload = {
    title:
      typeof json.title === "string" && json.title.trim().length > 0
        ? json.title.trim().slice(0, 60)
        : question.trim().split(/\s+/).slice(0, 6).join(" "),
    brief:
      typeof json.brief === "string" && json.brief.trim().length > 0
        ? json.brief.trim().slice(0, 200)
        : question.trim().slice(0, 140),
    insight:
      typeof json.insight === "string" && json.insight.trim().length > 0
        ? json.insight.trim().slice(0, 240)
        : undefined,
    explanation: json.explanation.trim(),
    actionPlan: withIds(rawActions, "a"),
    evidenceChecklist: withIds(rawEvidence, "e"),
    commonMistakes,
    lawyerReason:
      typeof json.lawyerReason === "string" && json.lawyerReason.trim().length > 0
        ? json.lawyerReason.trim().slice(0, 240)
        : undefined,
    lawyerQuestions,
    glossary,
    deadlineHint: normalizeDeadlineHint(json.deadlineHint),
    legalAid,
    urgency,
    disclaimer:
      typeof json.disclaimer === "string" && json.disclaimer.trim().length > 0
        ? json.disclaimer
        : FALLBACK_DISCLAIMER_HE,
    language: isValidLanguage(json.language) ? json.language : language,
    category,
    source: "ai",
  };
  return { ok: true, data };
}

/**
 * Demo answer — only used when the user explicitly taps "תשובת דמו"
 * on the error card and EXPO_PUBLIC_ALLOW_DEMO=true.
 *
 * Carries source: "demo" so the UI banner is mandatory and the share
 * pack is clearly marked as not-AI-authored.
 */
export function buildDemoAnswer(
  question: string,
): Omit<SavedAnswer, "id" | "createdAt"> {
  const language = detectLanguage(question);
  const trimmed = question.trim();
  const category: LegalCategoryKey = "כללי";
  const urgency: LegalUrgency = "medium";

  const rawActions = [
    { text: "תעד את האירוע בכתב — מי, מתי, איפה, ומה נאמר" },
    { text: "אסוף את כל המסמכים הרלוונטיים במקום אחד" },
    { text: "התייעץ עם עורך דין מוסמך לפני נקיטת צעדים נוספים" },
    { text: "שמור על תקשורת כתובה בלבד עם הצד השני" },
  ];
  const rawEvidence = [
    { text: "כל ההתכתבויות עם הצד השני (וואטסאפ, מייל, SMS)" },
    { text: "כל מסמך כתוב (חוזה, מכתב, אישור)" },
    { text: "שמות עדים ופרטי קשר, אם קיימים" },
  ];

  return {
    question: trimmed,
    title: trimmed.split(/\s+/).slice(0, 5).join(" ") || "תשובת דמו",
    brief: trimmed.slice(0, 140),
    insight:
      "כל מקרה משפטי דורש בדיקה אישית — תשובת דמו זו אינה מבוססת על AI חי.",
    explanation:
      "תשובת דמו: זוהי תוצאה לדוגמה בלבד ולא נוצרה על-ידי מודל AI. במצב משפטי אמיתי, חשוב להתייעץ עם עורך דין מוסמך הבקיא בתחום, ולתעד הכל בכתב.",
    actionPlan: withIds(rawActions, "a"),
    evidenceChecklist: withIds(rawEvidence, "e"),
    commonMistakes: [
      "אל תודה באשמה בכתב",
      "אל תמחק התכתבויות — הן ראיה חשובה",
      "אל תתעלם ממכתבים רשמיים גם אם הם לא נעימים",
    ],
    lawyerReason: "מדובר בתשובת דמו — לא הופעל מודל AI על המקרה שלך.",
    lawyerQuestions: [
      "מה תוקפו של המסמך/האירוע מבחינה משפטית?",
      "מהן זכויותיי במצב הספציפי הזה?",
      "מה לוח הזמנים שלי לפעולה?",
      "כמה זה צפוי לעלות לי?",
    ],
    glossary: [],
    legalAid: legalAidForAnswer(category, urgency),
    urgency,
    disclaimer: DEMO_DISCLAIMER_HE,
    language,
    category,
    source: "demo",
  };
}
