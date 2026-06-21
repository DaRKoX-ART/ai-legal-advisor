// Shared types for the legal-AI flow.
// Kept standalone (no React imports) so it can be consumed by both
// frontend code and server-side type checks in the future.

export type SupportedLanguage = "he" | "ar" | "en";

export type LegalUrgency = "low" | "medium" | "high";

export type LegalAnswerSource = "ai" | "demo";

// Allowed error codes returned by the backend or generated client-side.
// The frontend maps each code to a localized user-facing message.
export type LegalAiErrorCode =
  | "AI_UNAVAILABLE"
  | "INVALID_INPUT"
  | "MISSING_API_KEY"
  | "UPSTREAM_TIMEOUT"
  | "INVALID_AI_RESPONSE"
  | "NETWORK_ERROR"
  | "RATE_LIMITED";

export interface LegalAiErrorPayload {
  error: true;
  code: LegalAiErrorCode;
  message: string;
}

// Note: the success shape lives in `services/legalAi.ts` as
// `AnswerPayload` so it can include the full first-aid file fields
// (actionPlan, evidenceChecklist, glossary, deadlineHint, legalAid).
// This module stays type-only and shared with the server.
