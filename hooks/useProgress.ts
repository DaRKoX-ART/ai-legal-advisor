import { useMemo } from "react";

import type { SavedAnswer } from "@/types/answer";

export function useProgress(answer: SavedAnswer) {
  return useMemo(() => {
    const actionDone = answer.actionPlan.filter((i) => i.done).length;
    const evidenceDone = answer.evidenceChecklist.filter((i) => i.done).length;
    const doneItems = actionDone + evidenceDone;
    const totalItems =
      answer.actionPlan.length + answer.evidenceChecklist.length;
    const progress = totalItems > 0 ? doneItems / totalItems : 0;
    const isComplete = totalItems > 0 && doneItems === totalItems;
    return { actionDone, evidenceDone, doneItems, totalItems, progress, isComplete };
  }, [answer.actionPlan, answer.evidenceChecklist]);
}
