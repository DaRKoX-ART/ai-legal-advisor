import type { LegalCategoryKey, LegalAidContact } from "@/types/answer";
import type {
  LegalAnswerSource,
  LegalUrgency,
  SupportedLanguage,
} from "@/types/legal";

// AsyncStorage key for the one-time disclaimer acceptance.
// Bumping the suffix (`_v2`, ...) forces all users to re-accept
// after a material change to the disclaimer text.
export const DISCLAIMER_STORAGE_KEY = "@legal_advisor_disclaimer_accepted_v1";

// Version of the disclaimer text shown to users on onboarding. Saved into
// `UserProfile.disclaimerVersion` at sign-in. If the constant changes, the
// app re-prompts onboarding so users explicitly accept the new wording.
// Increment when the disclaimer copy changes materially (e.g. new hotline,
// new data-use clause, scope change).
export const DISCLAIMER_VERSION = "v1";

// Question length bounds. Must match the server-side validation in
// `server/serve.js` so client and server agree on what is acceptable.
export const MIN_QUESTION_LENGTH = 8;
export const MAX_QUESTION_LENGTH = 2000;

// Opt-in dev flag. When set to "true" at build time the app exposes
// an explicit "show demo answer" button on the error card. It is NEVER
// shown automatically and is always labeled as demo, not as real AI.
export const DEMO_ENABLED = process.env.EXPO_PUBLIC_ALLOW_DEMO === "true";

// Canonical legal disclaimer shown in the consent gate, inside the
// AI result card, and on the About screen. Hebrew for now.
export const LEGAL_DISCLAIMER_HE = `אפליקציה זו מספקת מידע משפטי ראשוני בלבד.
היא אינה מהווה ייעוץ משפטי ואינה מחליפה עורך דין מוסמך.
אין להסתמך עליה כבסיס יחיד לקבלת החלטות משפטיות.

לעניינים דחופים, פליליים, חקירת משטרה, בית משפט, אלימות, אלימות במשפחה, פינוי דירה, משמורת ילדים, פיטורים או סיכון כספי משמעותי — יש לפנות באופן מיידי לעורך דין מוסמך, ובמקרי חירום למשטרה (100), למד"א (101), או לקווי סיוע (105 / קו ער"ן 1201).

יש להימנע מהזנת פרטים אישיים רגישים שאינם הכרחיים לשאלה.`;

// Structured disclaimer points for the consent gate.
// Easier to scan than one wall of text. The full text above is still
// shown via the About screen modal for users who want to read it in full.
export const LEGAL_DISCLAIMER_POINTS_HE: Array<{
  icon: string;
  title: string;
  body: string;
}> = [
  {
    icon: "info",
    title: "מידע ראשוני בלבד",
    body: "האפליקציה מספקת מידע משפטי כללי ולא מהווה ייעוץ משפטי אישי.",
  },
  {
    icon: "user-x",
    title: "אינה מחליפה עורך דין",
    body: "אין להסתמך עליה כבסיס יחיד לקבלת החלטות משפטיות חשובות.",
  },
  {
    icon: "alert-triangle",
    title: "במקרים דחופים",
    body: "פליליים, אלימות, פינוי, משמורת או פיטורים — פנה מיידית לעורך דין מוסמך, ובמקרי חירום למשטרה (100) או למוקדי סיוע (105 / 1201).",
  },
  {
    icon: "lock",
    title: "פרטיות",
    body: "הימנע מהזנת פרטים אישיים רגישים שאינם הכרחיים לשאלה.",
  },
];

// Short disclaimer used as a default when the AI response is missing one.
export const FALLBACK_DISCLAIMER_HE =
  "מידע משפטי ראשוני בלבד. אינו מהווה ייעוץ משפטי ואינו מחליף עורך דין מוסמך.";

export const DEMO_DISCLAIMER_HE =
  "תשובת דמו לצורכי הדגמה בלבד. אינה מבוססת על מודל AI חי ואינה מהווה ייעוץ משפטי.";

export const DEMO_BANNER_HE =
  "תשובת דמו בלבד — שירות ה-AI אינו פעיל";

export const URGENCY_LABEL_HE: Record<LegalUrgency, string> = {
  low: "דחיפות נמוכה",
  medium: "דחיפות בינונית",
  high: "דחיפות גבוהה",
};

export const LANGUAGE_LABEL_HE: Record<SupportedLanguage, string> = {
  he: "עברית",
  ar: "ערבית",
  en: "אנגלית",
};

export const SOURCE_LABEL_HE: Record<LegalAnswerSource, string> = {
  ai: "תשובת AI",
  demo: "תשובת דמו",
};

// Lightweight script-based language detection. Sufficient for routing
// the AI to answer in the matching language; not a full NLP detector.
export function detectLanguage(text: string): SupportedLanguage {
  if (/[\u0590-\u05FF]/.test(text)) return "he";
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  return "en";
}

export function isRtlLanguage(lang: SupportedLanguage): boolean {
  return lang === "he" || lang === "ar";
}

// ── Israeli free legal-aid resources ─────────────────────────────────
//
// These are well-known public hotlines/services in Israel. The list is
// intentionally short and hand-curated — we do NOT let the AI invent
// phone numbers. The mapping below selects the right resources based on
// the answer's `category` and `urgency`.
//
// Phone numbers are formatted for the OS tel: handler. The UI dials
// them via `tel:<phone>`. If a number ever needs updating, this is the
// single place to edit.

const EMERGENCY_AID: LegalAidContact = {
  name: "משטרת ישראל",
  phone: "100",
  note: "מצוקה מיידית או אלימות",
};
const MAGEN_DAVID: LegalAidContact = {
  name: "מד״א",
  phone: "101",
  note: "פציעה או חירום רפואי",
};
const ERAN: LegalAidContact = {
  name: "ער״ן · עזרה ראשונה נפשית",
  phone: "1201",
  note: "מצוקה רגשית, 24/7, חינם",
};
const CHILD_LINE: LegalAidContact = {
  name: "המועצה לשלום הילד · 105",
  phone: "105",
  note: "פגיעה בקטינים",
};
const LEGAL_AID_MOJ: LegalAidContact = {
  name: "לשכת הסיוע המשפטי · משרד המשפטים",
  phone: "1-700-70-60-44",
  note: "ייצוג וייעוץ חינם לזכאים",
};
const VAAD_HACHARAM: LegalAidContact = {
  name: "מוקד נפגעי אלימות במשפחה · 118",
  phone: "118",
  note: "אלימות במשפחה, 24/7",
};
const KOLECH: LegalAidContact = {
  name: "ויצו · מוקד 1-800-39-39-04",
  phone: "1-800-39-39-04",
  note: "סיוע משפטי לנשים",
};
const HORIM_VILADIM: LegalAidContact = {
  name: "מוקד הורים וילדים · 1599",
  phone: "1599-500-501",
  note: "ייעוץ בענייני משפחה",
};

/**
 * Resolve the legal-aid contacts that should be attached to a saved
 * answer. Always returns a stable, deduplicated list — server and
 * client never have to coordinate ordering.
 */
export function legalAidForAnswer(
  category: LegalCategoryKey,
  urgency: LegalUrgency,
): LegalAidContact[] {
  const out: LegalAidContact[] = [];
  const push = (c: LegalAidContact) => {
    if (!out.some((x) => x.phone === c.phone)) out.push(c);
  };

  if (urgency === "high") {
    if (category === "דיני עונשין" || category === "דיני משפחה") {
      push(EMERGENCY_AID);
    }
  }

  switch (category) {
    case "דיני עונשין":
      push(LEGAL_AID_MOJ);
      push(ERAN);
      break;
    case "דיני משפחה":
      push(VAAD_HACHARAM);
      push(HORIM_VILADIM);
      push(CHILD_LINE);
      push(LEGAL_AID_MOJ);
      break;
    case "דיני עבודה":
      push(LEGAL_AID_MOJ);
      push(KOLECH);
      break;
    case "חוזים":
      push(LEGAL_AID_MOJ);
      break;
    case "כללי":
    default:
      push(LEGAL_AID_MOJ);
      push(ERAN);
      break;
  }

  if (urgency === "high") push(MAGEN_DAVID);
  return out.slice(0, 4);
}
