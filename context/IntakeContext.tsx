import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type { LegalAiErrorCode } from "@/types/legal";

type Status = "idle" | "submitting" | "done" | "error";

type IntakeState = {
  /** The question the user is currently asking. */
  prompt: string;
  status: Status;
  /** The id of the SavedAnswer that was persisted on success. */
  savedAnswerId: string | null;
  errorCode: LegalAiErrorCode | null;
};

type IntakeContextValue = IntakeState & {
  setPrompt: (q: string) => void;
  beginSubmit: () => void;
  succeed: (savedAnswerId: string) => void;
  fail: (code: LegalAiErrorCode) => void;
  reset: () => void;
};

const initial: IntakeState = {
  prompt: "",
  status: "idle",
  savedAnswerId: null,
  errorCode: null,
};

const Ctx = createContext<IntakeContextValue | null>(null);

/**
 * Transient state for the ask flow:
 *   home → user writes their question, taps "Ask"
 *   ask/loading → AI runs, answer is saved, user is routed to saved/[id]
 *
 * One question. One answer. No multi-step intake, no review.
 */
export function IntakeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<IntakeState>(initial);

  const setPrompt = useCallback((prompt: string) => {
    setState((s) => ({ ...s, prompt }));
  }, []);

  const beginSubmit = useCallback(() => {
    setState((s) => ({ ...s, status: "submitting", errorCode: null }));
  }, []);

  const succeed = useCallback((savedAnswerId: string) => {
    setState((s) => ({
      ...s,
      status: "done",
      savedAnswerId,
      errorCode: null,
    }));
  }, []);

  const fail = useCallback((code: LegalAiErrorCode) => {
    setState((s) => ({ ...s, status: "error", errorCode: code }));
  }, []);

  const reset = useCallback(() => setState(initial), []);

  const value = useMemo<IntakeContextValue>(
    () => ({
      ...state,
      setPrompt,
      beginSubmit,
      succeed,
      fail,
      reset,
    }),
    [state, setPrompt, beginSubmit, succeed, fail, reset],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useIntake() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useIntake must be used within IntakeProvider");
  return v;
}
