/**
 * Lightweight client-side PII detector.
 *
 * Purpose: warn the user BEFORE their question is sent to the AI
 * provider if it appears to contain personally-identifying details
 * that aren't needed for legal guidance. The user can always choose
 * to send anyway — this is a soft confirmation gate, not a hard block.
 *
 * What we look for:
 *   - Israeli national ID (תעודת זהות):    9-digit sequences with a
 *     valid mod-10 checksum (Luhn-like). We require checksum validity
 *     to avoid false positives from random 9-digit sequences (e.g.
 *     case numbers, address codes).
 *   - Israeli phone numbers:                "05X-XXXXXXX" or +972 form.
 *   - Email addresses:                      standard RFC-shaped match.
 *   - Credit card numbers:                  13–19 digit sequences that
 *     pass Luhn. Coarse, but the false-positive rate is acceptable
 *     given the severity of accidentally leaking a card.
 *
 * Returns a deduped, ordered list of kinds detected. The caller maps
 * each kind to a Hebrew label and shows a confirm dialog.
 *
 * NOT a replacement for server-side sanitization. This is a UX nudge.
 */

export type PiiKind = "israeli_id" | "phone" | "email" | "credit_card";

export interface PiiHit {
  kind: PiiKind;
  /** Short Hebrew label for the dialog ("מס׳ ת״ז", "טלפון", ...). */
  label: string;
}

const HEBREW_LABEL: Record<PiiKind, string> = {
  israeli_id: "מספר תעודת זהות",
  phone: "מספר טלפון",
  email: "כתובת אימייל",
  credit_card: "מספר כרטיס אשראי",
};

/** Israeli ID checksum (Luhn-like, official ID-number algorithm). */
function isValidIsraeliId(digits: string): boolean {
  if (digits.length !== 9) return false;
  let total = 0;
  for (let i = 0; i < 9; i++) {
    let value = Number(digits.charAt(i)) * ((i % 2) + 1);
    if (value > 9) value -= 9;
    total += value;
  }
  return total % 10 === 0;
}

/** Standard Luhn algorithm for credit-card validation. */
function isValidLuhn(digits: string): boolean {
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits.charAt(i));
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

const EMAIL_RE = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g;
// Israeli mobile (05X) and landline +972 variants. Allows optional
// dash/space separators. Conservative — false negatives are OK.
const PHONE_RE =
  /\b(?:\+?972[-\s]?|0)5\d[-\s]?\d{3}[-\s]?\d{4}\b|\b(?:\+?972[-\s]?|0)[2-49][-\s]?\d{3}[-\s]?\d{4}\b/g;
// Any run of 9 digits (with optional dashes) for Israeli ID candidates.
const ID_RE = /\b\d{9}\b/g;
// Any run of 13–19 digits (with optional dashes / spaces) for credit cards.
// We strip separators before Luhn validation.
const CARD_RE = /\b(?:\d[-\s]?){13,19}\b/g;

/**
 * Detect PII-shaped substrings in free-form text.
 * Returns an ordered, deduped list of kinds found.
 */
export function detectPii(text: string): PiiHit[] {
  if (!text || typeof text !== "string") return [];
  const found = new Set<PiiKind>();

  // Phone numbers are checked first so that 10-digit phone numbers
  // don't get misclassified as ID-shaped 9-digit runs.
  for (const m of text.matchAll(PHONE_RE)) {
    if (m[0]) found.add("phone");
  }

  for (const m of text.matchAll(EMAIL_RE)) {
    if (m[0]) found.add("email");
  }

  for (const m of text.matchAll(ID_RE)) {
    if (m[0] && isValidIsraeliId(m[0])) {
      found.add("israeli_id");
    }
  }

  for (const m of text.matchAll(CARD_RE)) {
    const digits = m[0].replace(/[-\s]/g, "");
    if (digits.length >= 13 && digits.length <= 19 && isValidLuhn(digits)) {
      found.add("credit_card");
    }
  }

  // Return in a stable user-friendly order.
  const order: PiiKind[] = ["israeli_id", "credit_card", "phone", "email"];
  return order
    .filter((k) => found.has(k))
    .map((kind) => ({ kind, label: HEBREW_LABEL[kind] }));
}

/** Build the Hebrew confirm-dialog body for a list of detections. */
export function buildPiiWarningMessage(hits: PiiHit[]): string {
  if (hits.length === 0) return "";
  const list = hits.map((h) => `• ${h.label}`).join("\n");
  return (
    "זיהינו פרטים אישיים בשאלה שלך:\n\n" +
    list +
    "\n\nלא חייבים להזין פרטים מזהים — תיאור כללי של המקרה מספיק. " +
    "האם להמשיך ולשלוח את השאלה בכל זאת?"
  );
}
