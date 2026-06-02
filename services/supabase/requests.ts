import { supabase } from "./client";

import type { SavedAnswer } from "@/types/answer";

/**
 * Convert a local SavedAnswer to a database row shape.
 * All JSONB fields are serialized as plain objects/arrays.
 */
function toRow(
  answer: SavedAnswer,
  userId: string,
): Omit<
  import("@/types/database").Database["public"]["Tables"]["legal_requests"]["Insert"],
  "id" | "user_id" | "created_at" | "updated_at"
> {
  return {
    question: answer.question,
    title: answer.title,
    brief: answer.brief,
    insight: answer.insight ?? null,
    explanation: answer.explanation,
    category: answer.category,
    urgency: answer.urgency,
    language: answer.language,
    source: answer.source,
    action_plan: answer.actionPlan as any,
    evidence_checklist: answer.evidenceChecklist as any,
    common_mistakes: answer.commonMistakes as any,
    lawyer_questions: answer.lawyerQuestions as any,
    glossary: answer.glossary as any,
    legal_aid: answer.legalAid as any,
    deadline_hint: (answer.deadlineHint ?? null) as any,
    disclaimer: answer.disclaimer,
    lawyer_reason: answer.lawyerReason ?? null,
    local_id: answer.id,
  };
}

/**
 * Upsert a saved answer to the cloud.
 * Uses local_id as the conflict key so re-upserts update rather than duplicate.
 */
export async function upsertRequest(answer: SavedAnswer, userId: string) {
  if (!supabase) return { error: "Supabase not configured" as const };

  const { error } = await supabase.from("legal_requests").upsert(
    {
      ...toRow(answer, userId),
      user_id: userId,
    } as any,
    { onConflict: "local_id,user_id" },
  );

  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

/**
 * Delete a request from the cloud by its local_id.
 */
export async function deleteRequest(localId: string, userId: string) {
  if (!supabase) return { error: "Supabase not configured" as const };

  const { error } = await supabase
    .from("legal_requests")
    .delete()
    .eq("local_id", localId)
    .eq("user_id", userId);

  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

/**
 * Fetch all cloud requests for a user and convert them to SavedAnswer shape.
 */
export async function fetchUserRequests(userId: string): Promise<{
  requests: SavedAnswer[];
  error: string | null;
}> {
  if (!supabase) return { requests: [], error: null };

  const { data, error } = await supabase
    .from("legal_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return { requests: [], error: error?.message ?? "Unknown error" };
  }

  const requests: SavedAnswer[] = (data as any[]).map((row) => ({
    id: row.local_id ?? row.id,
    question: row.question,
    title: row.title,
    brief: row.brief,
    insight: row.insight ?? undefined,
    explanation: row.explanation,
    actionPlan: Array.isArray(row.action_plan) ? row.action_plan : [],
    evidenceChecklist: Array.isArray(row.evidence_checklist)
      ? row.evidence_checklist
      : [],
    commonMistakes: Array.isArray(row.common_mistakes) ? row.common_mistakes : [],
    lawyerReason: row.lawyer_reason ?? undefined,
    lawyerQuestions: Array.isArray(row.lawyer_questions)
      ? row.lawyer_questions
      : [],
    glossary: Array.isArray(row.glossary) ? row.glossary : [],
    deadlineHint: row.deadline_hint ?? undefined,
    legalAid: Array.isArray(row.legal_aid) ? row.legal_aid : [],
    category: row.category,
    urgency: row.urgency,
    disclaimer: row.disclaimer,
    language: row.language,
    source: row.source,
    createdAt: row.created_at
      ? new Date(row.created_at).getTime()
      : Date.now(),
  }));

  return { requests, error: null };
}
