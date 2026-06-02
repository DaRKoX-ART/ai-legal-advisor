// SavedAnswer — the FOLIO "Legal First Aid File".
//
// One question yields one file. The file is no longer just a report
// the user reads; it is an artifact they edit (check items off, add
// notes) and share. The AI authors all `text/title/...` fields. The
// per-item `done` / `doneAt` / `note` fields are user-mutable state
// stored locally with the answer.

import type {
  LegalAnswerSource,
  LegalUrgency,
  SupportedLanguage,
} from "@/types/legal";

export type LegalCategoryKey =
  | "דיני עונשין"
  | "דיני משפחה"
  | "חוזים"
  | "דיני עבודה"
  | "כללי";

// ── Action checklist items ───────────────────────────────────────────
export interface ActionItem {
  /** Stable client-generated id (e.g. "a-0"). */
  id: string;
  /** AI-authored second-person imperative Hebrew. */
  text: string;
  /** AI-authored free-text deadline, optional ("בעוד 14 ימים" / "עד 28.5"). */
  deadline?: string;
  /** User-mutated. */
  done: boolean;
  doneAt?: number;
  note?: string;
}

// ── Evidence checklist items ─────────────────────────────────────────
export interface EvidenceItem {
  id: string;
  /** AI-authored noun phrase: a document, screenshot, name, date. */
  text: string;
  done: boolean;
  doneAt?: number;
  note?: string;
}

// ── Glossary ─────────────────────────────────────────────────────────
export interface GlossaryTerm {
  term: string;
  /** Plain-Hebrew definition, ≤140 chars. */
  definition: string;
}

// ── Legal aid contact ────────────────────────────────────────────────
export interface LegalAidContact {
  name: string;
  /** Free-form phone string for the OS tel: handler. */
  phone: string;
  /** Optional one-line note ("חינם, 24/7" / "סיוע משפטי מטעם משרד המשפטים"). */
  note?: string;
}

// ── Deadline hint ────────────────────────────────────────────────────
/**
 * Optional, headline-grade deadline highlighted at the top of the file.
 * Only present when the AI can infer it from the user's prompt with
 * confidence. Most files will have no `deadlineHint`.
 *
 *   - `iso`: ISO date when known; client computes the live countdown
 *   - `relative`: free-text Hebrew snapshot ("בעוד 12 ימים")
 *
 * If both are present the client prefers `iso`; if only `relative` is
 * present the client renders it as-is with a small "כפי שנאמד ב-{date}"
 * disclaimer to remind the user it was a snapshot.
 */
export interface DeadlineHint {
  /** What the deadline is for. "להגשת כתב הגנה" / "לערעור". */
  label: string;
  iso?: string;
  relative?: string;
}

// ── The saved file ───────────────────────────────────────────────────
export interface SavedAnswer {
  id: string;
  /** Original user question, kept verbatim for context + share pack. */
  question: string;
  /** Short AI-written title for the answer (≤6 words). */
  title: string;
  /** Single-sentence summary — also the "המצב" block on the file. */
  brief: string;
  /** Optional single-sentence key takeaway. */
  insight?: string;
  /** Plain-language explanation paragraph. */
  explanation: string;
  /** Interactive action plan; the heart of the first-aid file. */
  actionPlan: ActionItem[];
  /** Documents/proofs the user should gather before seeing a lawyer. */
  evidenceChecklist: EvidenceItem[];
  /** Read-only "מה לא לעשות" warnings — 2–4 short bullets. */
  commonMistakes: string[];
  /** "כדאי לפנות לעו״ד כי…" one-sentence rationale, optional. */
  lawyerReason?: string;
  /** Questions the user should bring to their lawyer meeting. */
  lawyerQuestions: string[];
  /** AI-surfaced terms used in the explanation. */
  glossary: GlossaryTerm[];
  /** Optional, single critical deadline. */
  deadlineHint?: DeadlineHint;
  /** Server-curated, vetted hotlines relevant to the category/urgency. */
  legalAid: LegalAidContact[];
  /** AI-inferred legal category. */
  category: LegalCategoryKey;
  urgency: LegalUrgency;
  disclaimer: string;
  language: SupportedLanguage;
  source: LegalAnswerSource;
  createdAt: number;
}

// ── Legacy storage shapes (migration only) ───────────────────────────
export interface LegacyMatter {
  id: string;
  title: string;
  brief: string;
  initialPrompt: string;
  category: LegalCategoryKey;
  createdAt: number;
  dossier: {
    explanation: string;
    nextSteps: string[];
    urgency: LegalUrgency;
    disclaimer: string;
    language: SupportedLanguage;
    source: LegalAnswerSource;
    insight?: string;
  };
}

export interface LegacyHistoryItem {
  id: string;
  category: LegalCategoryKey;
  question: string;
  answer: string;
  nextSteps: string[];
  date: string;
  isoDate?: string;
  language?: SupportedLanguage;
  urgency?: LegalUrgency;
  source?: LegalAnswerSource;
  disclaimer?: string;
}

/**
 * Pre-Phase-A SavedAnswer shape — used only to widen incoming records
 * read from `@folio/answers_v1` when they pre-date this change.
 */
export interface LegacySimpleAnswer {
  id: string;
  question: string;
  title: string;
  brief: string;
  insight?: string;
  explanation: string;
  nextSteps: string[];
  category: LegalCategoryKey;
  urgency: LegalUrgency;
  disclaimer: string;
  language: SupportedLanguage;
  source: LegalAnswerSource;
  createdAt: number;
}
