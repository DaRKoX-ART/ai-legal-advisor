/**
 * Standalone production server for Expo static builds.
 *
 * Serves the output of build.js (static-build/) with two special routes:
 * - GET / or /manifest with expo-platform header → platform manifest JSON
 * - GET / without expo-platform → landing page HTML
 * - POST /api/chat → legal-AI proxy with validation, timeout, and stable
 *   error JSON envelopes.
 *
 * Zero external dependencies — uses only Node.js built-ins.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const STATIC_ROOT = path.resolve(__dirname, "..", "static-build");
const TEMPLATE_PATH = path.resolve(__dirname, "templates", "landing-page.html");
const basePath = (process.env.BASE_PATH || "/").replace(/\/+$/, "");

function loadEnvFile() {
  const envPath = path.resolve(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf-8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed
      .slice(equalsIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".map": "application/json",
};

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "openai/gpt-oss-20b:free";

// Validation / safety constants. Keep MIN/MAX in sync with
// `constants/legal.ts` on the client.
const MIN_QUESTION_LENGTH = 8;
const MAX_QUESTION_LENGTH = 2000;
const UPSTREAM_TIMEOUT_MS = 22000;

// Canonical Hebrew category labels accepted from the client.
// Used only when validating the AI's returned `category` field.
const ALLOWED_CATEGORIES = new Set([
  "דיני עונשין",
  "דיני משפחה",
  "חוזים",
  "דיני עבודה",
  "כללי",
]);

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
  });
  res.end(JSON.stringify(body));
}

// Stable error envelope. The client maps `code` to a localized message.
function sendError(res, statusCode, code, message) {
  return sendJson(res, statusCode, {
    error: true,
    code,
    message: message || code,
  });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 12000) {
        reject(new Error("Request body is too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function extractJsonObject(text) {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

// Script-based language detection. Cheap and deterministic, good enough
// to route the model toward the user's language without a dependency.
function detectLanguage(text) {
  if (/[\u0590-\u05FF]/.test(text)) return "he";
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  return "en";
}

/**
 * The single AI system prompt. Hardened for legal safety, language
 * match, and a strict JSON-shape contract that matches the FOLIO
 * "Legal First Aid File" schema (action plan, evidence checklist,
 * common mistakes, lawyer questions, glossary, deadlineHint).
 *
 * One LLM, one round-trip, one structured file — same product brief.
 */
function buildSystemPrompt(language) {
  const langName =
    language === "he"
      ? "Hebrew"
      : language === "ar"
        ? "Arabic"
        : "English";

  return [
    "You are FOLIO — a private legal-information assistant for a",
    "multi-language (Hebrew/Arabic/English) mobile app. You produce a",
    "structured legal first-aid file, not a chat reply.",
    "",
    "Strict safety rules (ALWAYS):",
    "- Provide GENERAL INITIAL LEGAL INFORMATION ONLY. Never provide",
    "  definitive legal conclusions or personal legal advice.",
    "- Never claim to be a lawyer or to provide a legal opinion.",
    "- Avoid certainty language. Do NOT say \"you will win\",",
    "  \"this is definitely illegal\", \"the court will rule X\", or",
    "  similar guarantees.",
    "- For criminal matters, police investigation, court deadlines,",
    "  violence, domestic violence, child custody, eviction,",
    "  employment termination, or large financial risk: strongly and",
    "  clearly recommend contacting a licensed lawyer IMMEDIATELY,",
    "  and emergency services if relevant.",
    "- Always include a short disclaimer in your response.",
    `- Respond in the user's language. Expected: ${language} (${langName}).`,
    "",
    "NEVER invent phone numbers, addresses, statute citations, case",
    "names, or named lawyers. If a real number is needed, omit it — the",
    "client surfaces vetted Israeli legal-aid resources separately.",
    "",
    "Task: the user is asking ONE legal question. Produce a single",
    "structured initial-information first-aid file. The user will tick",
    "off items in the action plan and evidence checklist over the",
    "following days, so write items as concrete, do-it-now verbs.",
    "",
    "Output: return ONLY a valid JSON object, no markdown, no",
    "commentary, with this EXACT shape:",
    "{",
    "  \"title\": \"4-6 word legal-file-style title in the user's language, no quotes\",",
    "  \"brief\": \"single line, max 140 characters, the essence of the question\",",
    "  \"category\": one of [\"דיני עונשין\", \"דיני משפחה\", \"חוזים\", \"דיני עבודה\", \"כללי\"],",
    "  \"urgency\": \"low\" | \"medium\" | \"high\",",
    "  \"insight\": \"single sentence, the most important takeaway\",",
    "  \"explanation\": \"paragraph, 80-160 words in plain language, in the user's language\",",
    "  \"actionPlan\": [",
    "    { \"text\": \"second-person imperative verb-led step in the user's language\", \"deadline\": \"optional free-text deadline like 'בעוד 14 ימים' or 'עד 28.5'\" }",
    "  ],",
    "  \"evidenceChecklist\": [",
    "    { \"text\": \"specific document, screenshot, name, or date to gather\" }",
    "  ],",
    "  \"commonMistakes\": [\"short 'do not do this' warning specific to this situation\"],",
    "  \"lawyerReason\": \"one sentence: why a licensed lawyer is recommended for this case, or empty string if not applicable\",",
    "  \"lawyerQuestions\": [\"specific question to ask a lawyer, tied to this case\"],",
    "  \"glossary\": [",
    "    { \"term\": \"legal term used in the explanation\", \"definition\": \"plain-language definition, max 140 chars\" }",
    "  ],",
    "  \"deadlineHint\": {",
    "    \"label\": \"what the deadline is for, e.g. 'להגשת כתב הגנה'\",",
    "    \"iso\": \"YYYY-MM-DD if a real date can be inferred from the user's prompt + today, OMIT otherwise\",",
    "    \"relative\": \"free-text Hebrew like 'בעוד 12 ימים', OMIT if iso is set\"",
    "  },",
    "  \"disclaimer\": \"one sentence disclaimer in the user's language stating this is initial legal information only and not a substitute for a licensed lawyer\"",
    "}",
    "",
    "Rules for fields:",
    "- title must read like a short legal-file label.",
    "- brief is a single readable sentence summarizing the situation.",
    "- category is mandatory — pick \"כללי\" only if no other fits.",
    "- insight is the single most actionable sentence from the analysis.",
    "- actionPlan: 3-5 items. Verbs only. Concrete enough to tick off.",
    "  Use deadline ONLY when the user's prompt actually supports it.",
    "- evidenceChecklist: 2-5 items. Concrete noun phrases (documents,",
    "  receipts, screenshots, names, dates). Things the user can gather.",
    "- commonMistakes: 2-4 items. Specific to this case, not generic.",
    "  Examples: 'אל תודה באשמה בכתב', 'אל תמחק התכתבויות בוואטסאפ'.",
    "- lawyerReason: empty string when the user's situation is genuinely",
    "  trivial. Otherwise one clear sentence.",
    "- lawyerQuestions: 3-5 items. Each specific to this case — the kind",
    "  of question a paralegal would prep before a 30-minute lawyer",
    "  meeting. Avoid generic 'מהן זכויותיי?'.",
    "- glossary: 0-3 items. ONLY terms you actually used in 'explanation'",
    "  that a non-lawyer would not immediately understand.",
    "- deadlineHint: OMIT entirely unless the user clearly mentions or",
    "  implies a hard deadline. Never invent one.",
    "- Hebrew always uses Hebrew quotes/punctuation; no English mixed",
    "  in unless legally required.",
  ].join("\n");
}

function normalizeUrgency(value) {
  return value === "low" || value === "medium" || value === "high"
    ? value
    : "low";
}

function normalizeStringList(value, max) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((s) => typeof s === "string" && s.trim().length > 0)
    .map((s) => s.trim())
    .slice(0, max);
}

function clampString(value, min, max) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (trimmed.length < min) return "";
  return trimmed.slice(0, max);
}

function normalizeCategory(value) {
  if (typeof value === "string" && ALLOWED_CATEGORIES.has(value.trim())) {
    return value.trim();
  }
  return "כללי";
}

// ── Israeli legal-aid resources (server-curated, never AI-invented) ──
//
// We deliberately ship these from the server side and overwrite anything
// the model might have hallucinated. Single source of truth for phone
// numbers lives in `constants/legal.ts` on the client; this mirror is
// kept in sync manually. If you edit one, edit the other.
const AID_EMERGENCY = {
  name: "משטרת ישראל",
  phone: "100",
  note: "מצוקה מיידית או אלימות",
};
const AID_MAGEN_DAVID = {
  name: "מד״א",
  phone: "101",
  note: "פציעה או חירום רפואי",
};
const AID_ERAN = {
  name: "ער״ן · עזרה ראשונה נפשית",
  phone: "1201",
  note: "מצוקה רגשית, 24/7, חינם",
};
const AID_CHILD_LINE = {
  name: "המועצה לשלום הילד · 105",
  phone: "105",
  note: "פגיעה בקטינים",
};
const AID_LEGAL_MOJ = {
  name: "לשכת הסיוע המשפטי · משרד המשפטים",
  phone: "1-700-70-60-44",
  note: "ייצוג וייעוץ חינם לזכאים",
};
const AID_VIOLENCE_118 = {
  name: "מוקד נפגעי אלימות במשפחה · 118",
  phone: "118",
  note: "אלימות במשפחה, 24/7",
};
const AID_WOMEN_HOTLINE = {
  name: "ויצו · מוקד 1-800-39-39-04",
  phone: "1-800-39-39-04",
  note: "סיוע משפטי לנשים",
};
const AID_FAMILY_HOTLINE = {
  name: "מוקד הורים וילדים · 1599",
  phone: "1599-500-501",
  note: "ייעוץ בענייני משפחה",
};

function legalAidFor(category, urgency) {
  const out = [];
  const push = (c) => {
    if (!out.some((x) => x.phone === c.phone)) out.push(c);
  };
  if (urgency === "high") {
    if (category === "דיני עונשין" || category === "דיני משפחה") {
      push(AID_EMERGENCY);
    }
  }
  switch (category) {
    case "דיני עונשין":
      push(AID_LEGAL_MOJ);
      push(AID_ERAN);
      break;
    case "דיני משפחה":
      push(AID_VIOLENCE_118);
      push(AID_FAMILY_HOTLINE);
      push(AID_CHILD_LINE);
      push(AID_LEGAL_MOJ);
      break;
    case "דיני עבודה":
      push(AID_LEGAL_MOJ);
      push(AID_WOMEN_HOTLINE);
      break;
    case "חוזים":
      push(AID_LEGAL_MOJ);
      break;
    case "כללי":
    default:
      push(AID_LEGAL_MOJ);
      push(AID_ERAN);
      break;
  }
  if (urgency === "high") push(AID_MAGEN_DAVID);
  return out.slice(0, 4);
}

// ── First-aid-file validators ───────────────────────────────────────
function clampObjectList(value, schema, max) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const raw of value) {
    if (out.length >= max) break;
    if (!raw || typeof raw !== "object") continue;
    const item = schema(raw);
    if (item) out.push(item);
  }
  return out;
}

function normalizeActionItem(raw) {
  const text = clampString(raw.text, 4, 220);
  if (!text) return null;
  const deadline = clampString(raw.deadline, 1, 80);
  return deadline ? { text, deadline } : { text };
}

function normalizeEvidenceItem(raw) {
  const text = clampString(raw.text, 2, 180);
  if (!text) return null;
  return { text };
}

function normalizeGlossaryItem(raw) {
  const term = clampString(raw.term, 1, 60);
  const definition = clampString(raw.definition, 4, 220);
  if (!term || !definition) return null;
  return { term, definition };
}

function normalizeDeadlineHint(raw) {
  if (!raw || typeof raw !== "object") return undefined;
  const label = clampString(raw.label, 2, 80);
  if (!label) return undefined;
  const iso = clampString(raw.iso, 8, 10);
  const isoValid = iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : undefined;
  const relative = clampString(raw.relative, 2, 80);
  if (!isoValid && !relative) return undefined;
  return {
    label,
    ...(isoValid ? { iso: isoValid } : {}),
    ...(relative && !isoValid ? { relative } : {}),
  };
}

// Wraps `fetch` with an AbortController-backed timeout. The caller
// always receives a tagged result instead of a thrown error.
async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return { kind: "ok", response };
  } catch (err) {
    if (err && err.name === "AbortError") return { kind: "timeout" };
    return {
      kind: "network",
      message: (err && err.message) || "Network error",
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The model call. The caller passes a prepared `messages` array — for
 * FOLIO that is always [system, user]. We don't do follow-up turns.
 */
async function callOpenRouter({ messages }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { kind: "missing-key" };
  }

  const out = await fetchWithTimeout(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.APP_PUBLIC_URL || "http://localhost:3000",
        "X-Title": "AI Legal Advisor",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        temperature: 0.2,
        messages,
      }),
    },
    UPSTREAM_TIMEOUT_MS,
  );

  if (out.kind !== "ok") return out;

  let json;
  try {
    json = await out.response.json();
  } catch {
    return { kind: "bad-response", status: out.response.status };
  }

  if (!out.response.ok) {
    return {
      kind: "upstream-error",
      status: out.response.status,
      message:
        (json && json.error && json.error.message) ||
        "OpenRouter request failed",
    };
  }

  const text = (json.choices && json.choices[0]?.message?.content) || "";
  return { kind: "model-text", text };
}

async function callGemini({ messages }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { kind: "missing-key" };
  }

  // Gemini takes a single contents[] array; we flatten the chat messages
  // into role-aware parts. system messages are inlined into the first
  // user message as a preamble — Gemini doesn't have a `system` role.
  const system = messages.find((m) => m.role === "system");
  const chat = messages.filter((m) => m.role !== "system");

  const contents = chat.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  if (contents.length > 0 && system) {
    contents[0].parts.unshift({ text: `${system.content}\n\n` });
  }

  const out = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    },
    UPSTREAM_TIMEOUT_MS,
  );

  if (out.kind !== "ok") return out;

  let json;
  try {
    json = await out.response.json();
  } catch {
    return { kind: "bad-response", status: out.response.status };
  }

  if (!out.response.ok) {
    return {
      kind: "upstream-error",
      status: out.response.status,
      message:
        (json && json.error && json.error.message) ||
        "Gemini request failed",
    };
  }

  const text =
    (json.candidates && json.candidates[0]?.content?.parts?.[0]?.text) || "";
  return { kind: "model-text", text };
}

/**
 * Validate the request body. The client now sends a flat shape:
 *   { question: string, language?: "he" | "ar" | "en" }
 * No conversations, no intents, no categories — the AI infers all
 * structure itself.
 */
function parseRequestBody(body) {
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_INPUT",
      message: "Question is required",
    };
  }
  if (question.length < MIN_QUESTION_LENGTH) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_INPUT",
      message: "Question is too short",
    };
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_INPUT",
      message: "Question is too long",
    };
  }

  const requestedLanguage =
    typeof body.language === "string" &&
    ["he", "ar", "en"].includes(body.language)
      ? body.language
      : null;
  const language = requestedLanguage || detectLanguage(question);
  return { ok: true, shape: { language, question } };
}

function upstreamErrorToHttp(upstream) {
  switch (upstream.kind) {
    case "missing-key":
      return [
        503,
        "MISSING_API_KEY",
        "AI provider API key is not configured on the server",
      ];
    case "timeout":
      return [504, "UPSTREAM_TIMEOUT", "Upstream AI provider timed out"];
    case "network":
      return [
        502,
        "AI_UNAVAILABLE",
        upstream.message || "Could not reach AI provider",
      ];
    case "upstream-error":
      return [
        502,
        "AI_UNAVAILABLE",
        upstream.message || "AI provider returned an error",
      ];
    case "bad-response":
      return [
        502,
        "INVALID_AI_RESPONSE",
        "AI provider returned an unreadable response",
      ];
    default:
      return [502, "AI_UNAVAILABLE", "Unknown upstream provider state"];
  }
}

async function handleChat(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    });
    res.end();
    return;
  }

  if (req.method !== "POST") {
    return sendError(res, 405, "INVALID_INPUT", "Method not allowed");
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    return sendError(res, 400, "INVALID_INPUT", err.message);
  }

  const parsed = parseRequestBody(body);
  if (!parsed.ok) {
    return sendError(res, parsed.status, parsed.code, parsed.message);
  }
  const { language, question } = parsed.shape;

  const messages = [
    { role: "system", content: buildSystemPrompt(language) },
    { role: "user", content: question },
  ];

  const provider = (process.env.AI_PROVIDER || "openrouter").toLowerCase();
  const providerCall = provider === "gemini" ? callGemini : callOpenRouter;
  const upstream = await providerCall({ messages });

  if (upstream.kind !== "model-text") {
    const [status, code, message] = upstreamErrorToHttp(upstream);
    return sendError(res, status, code, message);
  }

  const parsedJson = extractJsonObject(upstream.text);
  if (!parsedJson || typeof parsedJson.explanation !== "string") {
    return sendError(
      res,
      502,
      "INVALID_AI_RESPONSE",
      "AI provider returned a malformed answer",
    );
  }

  const category = normalizeCategory(parsedJson.category);
  const urgency = normalizeUrgency(parsedJson.urgency);

  // ── Shape the first-aid file ────────────────────────────────────────
  // Each list is hard-clamped to a maximum length so the UI never has to
  // worry about a pathological model output. Missing arrays become [].
  const actionPlan = clampObjectList(
    parsedJson.actionPlan,
    normalizeActionItem,
    6,
  );
  const evidenceChecklist = clampObjectList(
    parsedJson.evidenceChecklist,
    normalizeEvidenceItem,
    6,
  );
  const commonMistakes = normalizeStringList(parsedJson.commonMistakes, 4).map(
    (s) => s.slice(0, 200),
  );
  const lawyerReason = clampString(parsedJson.lawyerReason, 0, 220) || "";
  const lawyerQuestions = normalizeStringList(
    parsedJson.lawyerQuestions,
    5,
  ).map((s) => s.slice(0, 200));
  const glossary = clampObjectList(parsedJson.glossary, normalizeGlossaryItem, 4);
  const deadlineHint = normalizeDeadlineHint(parsedJson.deadlineHint);
  const legalAid = legalAidFor(category, urgency);

  // Backward-compat: if the model omitted actionPlan but produced the
  // legacy nextSteps[], lift each string into an ActionItem so older
  // model variants still produce a valid file.
  if (actionPlan.length === 0 && Array.isArray(parsedJson.nextSteps)) {
    for (const s of normalizeStringList(parsedJson.nextSteps, 6)) {
      if (s) actionPlan.push({ text: s.slice(0, 220) });
    }
  }

  const responseBody = {
    title:
      clampString(parsedJson.title, 2, 80) ||
      deriveFallbackTitle(question, language),
    brief:
      clampString(parsedJson.brief, 6, 200) || clampString(question, 6, 140),
    insight: clampString(parsedJson.insight, 6, 220) || "",
    explanation: parsedJson.explanation.trim(),
    actionPlan,
    evidenceChecklist,
    commonMistakes,
    lawyerReason,
    lawyerQuestions,
    glossary,
    legalAid,
    urgency,
    disclaimer:
      clampString(parsedJson.disclaimer, 6, 280) ||
      "מידע משפטי ראשוני בלבד. אינו מהווה ייעוץ משפטי ואינו מחליף עורך דין מוסמך.",
    language,
    category,
  };
  if (deadlineHint) responseBody.deadlineHint = deadlineHint;

  return sendJson(res, 200, responseBody);
}

/**
 * Deterministic fallback title if the model failed to provide one.
 * Takes the first ~6 words of the user's prompt and falls back to a
 * generic localized "שאלה משפטית" if even that fails.
 */
function deriveFallbackTitle(text, language) {
  if (typeof text !== "string" || !text.trim()) {
    return language === "he"
      ? "שאלה משפטית"
      : language === "ar"
        ? "سؤال قانوني"
        : "Legal question";
  }
  const words = text.trim().split(/\s+/).slice(0, 6).join(" ");
  return words.slice(0, 60);
}

function getAppName() {
  try {
    const appJsonPath = path.resolve(__dirname, "..", "app.json");
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf-8"));
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}

function serveManifest(platform, res) {
  const manifestPath = path.join(STATIC_ROOT, platform, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(
      JSON.stringify({ error: `Manifest not found for platform: ${platform}` }),
    );
    return;
  }

  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.writeHead(200, {
    "content-type": "application/json",
    "expo-protocol-version": "1",
    "expo-sfv-version": "0",
  });
  res.end(manifest);
}

function serveLandingPage(req, res, landingPageTemplate, appName) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = forwardedProto || "https";
  const host = req.headers["x-forwarded-host"] || req.headers["host"];
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;

  const html = landingPageTemplate
    .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
    .replace(/EXPS_URL_PLACEHOLDER/g, expsUrl)
    .replace(/APP_NAME_PLACEHOLDER/g, appName);

  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(html);
}

function serveStaticFile(urlPath, res) {
  const safePath = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.join(STATIC_ROOT, safePath);

  if (!filePath.startsWith(STATIC_ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const content = fs.readFileSync(filePath);
  res.writeHead(200, { "content-type": contentType });
  res.end(content);
}

const landingPageTemplate = fs.existsSync(TEMPLATE_PATH)
  ? fs.readFileSync(TEMPLATE_PATH, "utf-8")
  : "<!doctype html><html><body><p>AI Legal Advisor server is running.</p></body></html>";
const appName = getAppName();

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  let pathname = url.pathname;

  if (basePath && pathname.startsWith(basePath)) {
    pathname = pathname.slice(basePath.length) || "/";
  }

  if (pathname === "/api/chat") {
    return handleChat(req, res);
  }

  if (pathname === "/" || pathname === "/manifest") {
    const platform = req.headers["expo-platform"];
    if (platform === "ios" || platform === "android") {
      return serveManifest(platform, res);
    }

    if (pathname === "/") {
      return serveLandingPage(req, res, landingPageTemplate, appName);
    }
  }

  serveStaticFile(pathname, res);
});

const port = parseInt(process.env.PORT || "3000", 10);
server.listen(port, "0.0.0.0", () => {
  console.log(`AI Legal Advisor server listening on port ${port}`);
});
