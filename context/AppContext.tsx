import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { legalAidForAnswer } from "@/constants/legal";
import { useAuth } from "@/context/AuthContext";
import { useSync } from "@/hooks/useSync";
import { insertEvent, queueEvent } from "@/services/supabase/analytics";
import type {
  ActionItem,
  EvidenceItem,
  LegacyHistoryItem,
  LegacyMatter,
  LegacySimpleAnswer,
  LegalAidContact,
  LegalCategoryKey,
  SavedAnswer,
} from "@/types/answer";

// ── Categories ────────────────────────────────────────────────────────
export type LegalCategory = LegalCategoryKey;

export const CATEGORY_KEYS: LegalCategory[] = [
  "דיני עונשין",
  "דיני משפחה",
  "חוזים",
  "דיני עבודה",
  "כללי",
];

export const CATEGORY_META: Record<
  LegalCategory,
  { icon: string; color: string; bg: string; desc: string }
> = {
  "דיני עונשין": {
    icon: "shield",
    color: "#111111",
    bg: "#F2F2F2",
    desc: "אישומים פליליים, הגנה, זכויות",
  },
  "דיני משפחה": {
    icon: "users",
    color: "#333333",
    bg: "#F5F5F5",
    desc: "גירושין, משמורת, נישואים",
  },
  חוזים: {
    icon: "file-text",
    color: "#222222",
    bg: "#F0F0F0",
    desc: "הסכמים, סכסוכים, התחייבויות",
  },
  "דיני עבודה": {
    icon: "briefcase",
    color: "#1A1A1A",
    bg: "#EBEBEB",
    desc: "זכויות בעבודה, פיטורים שלא כדין",
  },
  כללי: {
    icon: "help-circle",
    color: "#444444",
    bg: "#EDEDED",
    desc: "שאלות משפטיות כלליות אחרות",
  },
};

// ── Storage keys ──────────────────────────────────────────────────────
const USER_KEY = "@folio/user_v1";
const ANSWERS_KEY = "@folio/answers_v1";
const SETTINGS_KEY = "@folio/settings_v1";
const LEGACY_USER_KEY = "@legal_advisor_user";
const LEGACY_HISTORY_KEY = "@legal_advisor_history";
const LEGACY_MATTERS_KEY = "@folio/matters_v1";

// ── Identity / settings ───────────────────────────────────────────────
export interface UserProfile {
  name: string;
  signedAt: string;
  disclaimerVersion: string;
}
export interface AppSettings {
  demoEnabled: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────
function genId(): string {
  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 9)
  );
}
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
function isHebrew(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text);
}

// ── Item normalizers used by migration ────────────────────────────────
function toActionItem(text: string, i: number): ActionItem {
  return { id: `a-${i}`, text: text.slice(0, 220), done: false };
}
function toEvidenceItem(text: string, i: number): EvidenceItem {
  return { id: `e-${i}`, text: text.slice(0, 180), done: false };
}

/**
 * Pad a partially-formed `SavedAnswer` (e.g. one persisted before
 * Phase A) with empty arrays / sensible defaults for every new field.
 * Importantly, lifts `nextSteps[]` into `actionPlan` so the user's
 * existing answers immediately look right in the new UI.
 */
function widenAnswer(raw: Partial<SavedAnswer> & LegacySimpleAnswer): SavedAnswer {
  // Use a single broad cast for migration field access, then validate
  // everything at runtime. This is safer than scattering `as any`.
  const r = (raw as unknown) as Record<string, unknown>;

  const hasActionPlan = Array.isArray(r.actionPlan);
  const actionPlan: ActionItem[] = hasActionPlan
    ? (r.actionPlan as ActionItem[]).map((item, i) => ({
        id: typeof item.id === "string" ? item.id : `a-${i}`,
        text: typeof item.text === "string" ? item.text : "",
        deadline: typeof item.deadline === "string" ? item.deadline : undefined,
        done: !!item.done,
        doneAt: typeof item.doneAt === "number" ? item.doneAt : undefined,
        note: typeof item.note === "string" ? item.note : undefined,
      }))
    : (Array.isArray((raw as LegacySimpleAnswer).nextSteps)
        ? (raw as LegacySimpleAnswer).nextSteps.map(toActionItem)
        : []);

  const evidenceChecklist: EvidenceItem[] = Array.isArray(r.evidenceChecklist)
    ? (r.evidenceChecklist as EvidenceItem[]).map((item, i) => ({
        id: typeof item.id === "string" ? item.id : `e-${i}`,
        text: typeof item.text === "string" ? item.text : "",
        done: !!item.done,
        doneAt: typeof item.doneAt === "number" ? item.doneAt : undefined,
        note: typeof item.note === "string" ? item.note : undefined,
      }))
    : [];

  const legalAid: LegalAidContact[] = Array.isArray(r.legalAid)
    ? (r.legalAid as LegalAidContact[])
    : legalAidForAnswer(raw.category, raw.urgency);

  return {
    id: raw.id,
    question: raw.question,
    title: raw.title,
    brief: raw.brief,
    insight: raw.insight,
    explanation: raw.explanation,
    actionPlan,
    evidenceChecklist,
    commonMistakes: Array.isArray(r.commonMistakes)
      ? (r.commonMistakes as string[]).filter(
          (s) => typeof s === "string",
        )
      : [],
    lawyerReason:
      typeof r.lawyerReason === "string"
        ? r.lawyerReason
        : undefined,
    lawyerQuestions: Array.isArray(r.lawyerQuestions)
      ? (r.lawyerQuestions as string[]).filter(
          (s) => typeof s === "string",
        )
      : [],
    glossary: Array.isArray(r.glossary)
      ? (r.glossary as Array<{ term: string; definition: string }>).filter(
          (g) =>
            g &&
            typeof g === "object" &&
            typeof g.term === "string" &&
            typeof g.definition === "string",
        )
      : [],
    deadlineHint:
      r.deadlineHint &&
      typeof r.deadlineHint === "object" &&
      r.deadlineHint !== null &&
      typeof (r.deadlineHint as Record<string, unknown>).label === "string"
        ? (r.deadlineHint as SavedAnswer["deadlineHint"])
        : undefined,
    legalAid,
    category: raw.category,
    urgency: raw.urgency,
    disclaimer: raw.disclaimer,
    language: raw.language,
    source: raw.source,
    createdAt: raw.createdAt,
  };
}

/** Migration: legacy Matter (pre-simplification) → SavedAnswer. */
function migrateMatterToSaved(m: LegacyMatter): SavedAnswer {
  const base: LegacySimpleAnswer = {
    id: m.id,
    question: m.initialPrompt,
    title: m.title,
    brief: m.brief,
    insight: m.dossier.insight,
    explanation: m.dossier.explanation,
    nextSteps: Array.isArray(m.dossier.nextSteps) ? m.dossier.nextSteps : [],
    category: m.category,
    urgency: m.dossier.urgency || "low",
    disclaimer:
      m.dossier.disclaimer ||
      "מידע משפטי ראשוני בלבד. אינו מהווה ייעוץ משפטי ואינו מחליף עורך דין מוסמך.",
    language: m.dossier.language,
    source: m.dossier.source,
    createdAt: m.createdAt,
  };
  return widenAnswer(base);
}

/** Migration: legacy history row → SavedAnswer. */
function migrateLegacyHistory(legacy: LegacyHistoryItem): SavedAnswer {
  const createdAt =
    typeof legacy.isoDate === "string"
      ? Date.parse(legacy.isoDate) || Date.now()
      : Date.now();
  const titleFromQuestion = legacy.question
    .trim()
    .split(/\s+/)
    .slice(0, 6)
    .join(" ");
  const base: LegacySimpleAnswer = {
    id: legacy.id,
    question: legacy.question,
    title: titleFromQuestion || "תשובה שמורה",
    brief: legacy.question.trim().slice(0, 140),
    explanation: legacy.answer,
    nextSteps: Array.isArray(legacy.nextSteps) ? legacy.nextSteps : [],
    category: legacy.category,
    urgency: legacy.urgency || "low",
    disclaimer:
      legacy.disclaimer ||
      "מידע משפטי ראשוני בלבד. אינו מהווה ייעוץ משפטי ואינו מחליף עורך דין מוסמך.",
    language: legacy.language || (isHebrew(legacy.question) ? "he" : "en"),
    source: legacy.source || "ai",
    createdAt,
  };
  return widenAnswer(base);
}

// ── Save input ────────────────────────────────────────────────────────
export interface SaveAnswerInput {
  question: string;
  title: string;
  brief: string;
  insight?: string;
  explanation: string;
  actionPlan: ActionItem[];
  evidenceChecklist: EvidenceItem[];
  commonMistakes: string[];
  lawyerReason?: string;
  lawyerQuestions: string[];
  glossary: SavedAnswer["glossary"];
  deadlineHint?: SavedAnswer["deadlineHint"];
  legalAid: LegalAidContact[];
  category: LegalCategory;
  urgency: SavedAnswer["urgency"];
  disclaimer: string;
  language: SavedAnswer["language"];
  source: SavedAnswer["source"];
}

// ── Context value ─────────────────────────────────────────────────────
interface AppContextValue {
  ready: boolean;

  user: UserProfile | null;
  isLoggedIn: boolean;
  signIn: (
    name: string,
    options?: { disclaimerVersion?: string },
  ) => Promise<void>;
  signOut: () => Promise<void>;
  username: string | null;

  settings: AppSettings;
  updateSettings: (next: Partial<AppSettings>) => Promise<void>;

  answers: SavedAnswer[];
  getAnswer: (id: string) => SavedAnswer | undefined;
  saveAnswer: (input: SaveAnswerInput) => SavedAnswer;
  deleteAnswer: (id: string) => void;
  clearAllAnswers: () => Promise<void>;

  // ── Per-item mutations on a saved answer ─────────────────────────
  toggleActionItem: (answerId: string, itemId: string) => void;
  setActionItemNote: (answerId: string, itemId: string, note: string) => void;
  toggleEvidenceItem: (answerId: string, itemId: string) => void;
  setEvidenceItemNote: (
    answerId: string,
    itemId: string,
    note: string,
  ) => void;

  exportAllAsJson: () => string;
}

const AppContext = createContext<AppContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const sync = useSync();
  const [ready, setReady] = useState(false);
  const [localUser, setLocalUser] = useState<UserProfile | null>(null);
  const [answers, setAnswers] = useState<SavedAnswer[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ demoEnabled: false });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [
        rawUser,
        rawAnswers,
        rawSettings,
        legacyUser,
        legacyMatters,
        legacyHistory,
      ] = await Promise.all([
        AsyncStorage.getItem(USER_KEY),
        AsyncStorage.getItem(ANSWERS_KEY),
        AsyncStorage.getItem(SETTINGS_KEY),
        AsyncStorage.getItem(LEGACY_USER_KEY),
        AsyncStorage.getItem(LEGACY_MATTERS_KEY),
        AsyncStorage.getItem(LEGACY_HISTORY_KEY),
      ]);
      if (cancelled) return;

      // ── Identity ────────────────────────────────────────────────
      if (rawUser) {
        try {
          setLocalUser(JSON.parse(rawUser));
        } catch {}
      } else if (legacyUser) {
        const profile: UserProfile = {
          name: legacyUser,
          signedAt: todayIso(),
          disclaimerVersion: "v1",
        };
        setLocalUser(profile);
        AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
      }

      // ── Saved answers ──────────────────────────────────────────
      // Three-tier migration:
      //   1) @folio/answers_v1  → already on the SavedAnswer key, but
      //      may pre-date Phase A; widen each record.
      //   2) @folio/matters_v1  → legacy Matter shape; convert.
      //   3) @legal_advisor_history → original history rows; convert.
      let initialAnswers: SavedAnswer[] = [];
      let needsRewrite = false;
      if (rawAnswers) {
        try {
          const parsed = JSON.parse(rawAnswers);
          if (Array.isArray(parsed)) {
            initialAnswers = parsed.map(
              (a) => widenAnswer(a as LegacySimpleAnswer & Partial<SavedAnswer>),
            );
            // If any pre-Phase-A record was widened, persist the new
            // shape so we don't pay the migration cost on every launch.
            needsRewrite = parsed.some(
              (a: LegacySimpleAnswer & Partial<SavedAnswer>) =>
                !Array.isArray(a.actionPlan),
            );
          }
        } catch {}
      } else if (legacyMatters) {
        try {
          const parsed = JSON.parse(legacyMatters);
          if (Array.isArray(parsed)) {
            initialAnswers = parsed.map(migrateMatterToSaved);
            needsRewrite = true;
            await AsyncStorage.removeItem(LEGACY_MATTERS_KEY);
          }
        } catch {}
      } else if (legacyHistory) {
        try {
          const parsed = JSON.parse(legacyHistory);
          if (Array.isArray(parsed)) {
            initialAnswers = parsed.map(migrateLegacyHistory);
            needsRewrite = true;
            await AsyncStorage.removeItem(LEGACY_HISTORY_KEY);
          }
        } catch {}
      }
      if (needsRewrite) {
        await AsyncStorage.setItem(ANSWERS_KEY, JSON.stringify(initialAnswers));
      }
      setAnswers(initialAnswers);

      // ── Settings ───────────────────────────────────────────────
      if (rawSettings) {
        try {
          const parsed = JSON.parse(rawSettings);
          if (parsed && typeof parsed === "object") {
            setSettings({ demoEnabled: !!parsed.demoEnabled });
          }
        } catch {}
      }

      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // One-time sync when user signs in: pull from cloud and merge with local
  const hasSyncedRef = useRef(false);
  useEffect(() => {
    if (!auth.isAuthenticated || hasSyncedRef.current) return;
    hasSyncedRef.current = true;

    (async () => {
      // Pull cloud data and merge
      const { merged, error } = await sync.pullFromCloud(answers);
      if (!error && merged.length > 0) {
        // If merge produced different results, persist
        const changed =
          merged.length !== answers.length ||
          merged.some((a, i) => a.id !== answers[i]?.id);
        if (changed) {
          setAnswers(merged);
          await AsyncStorage.setItem(ANSWERS_KEY, JSON.stringify(merged));
        }
      }

      // Push any local-only answers to cloud
      if (answers.length > 0) {
        await sync.syncAll(answers);
      }
    })();
  }, [auth.isAuthenticated, answers, sync]);

  // ── Persistence ─────────────────────────────────────────────────────
  const persistAnswers = useCallback(async (next: SavedAnswer[]) => {
    setAnswers(next);
    AsyncStorage.setItem(ANSWERS_KEY, JSON.stringify(next));
  }, []);

  // ── Identity ────────────────────────────────────────────────────────
  const signInLocal = useCallback(
    async (name: string, options?: { disclaimerVersion?: string }) => {
      const profile: UserProfile = {
        name: name.trim().slice(0, 60),
        signedAt: todayIso(),
        disclaimerVersion: options?.disclaimerVersion || "v1",
      };
      setLocalUser(profile);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
    },
    [],
  );

  const signOutLocal = useCallback(async () => {
    setLocalUser(null);
    await AsyncStorage.removeItem(USER_KEY);
  }, []);

  const signOut = useCallback(async () => {
    await signOutLocal();
    if (auth.configured) {
      // Best-effort: don't let a network hiccup during Supabase signOut
      // block the UI or prevent navigation.
      await auth.signOut().catch(() => {});
    }
  }, [signOutLocal, auth]);

  // ── Settings ────────────────────────────────────────────────────────
  const updateSettings = useCallback(
    async (patch: Partial<AppSettings>) => {
      const next: AppSettings = { ...settings, ...patch };
      setSettings(next);
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    },
    [settings],
  );

  // ── Saved answers ───────────────────────────────────────────────────
  const saveAnswer = useCallback(
    (input: SaveAnswerInput): SavedAnswer => {
      const answer: SavedAnswer = {
        id: genId(),
        createdAt: Date.now(),
        ...input,
      };
      const next = [answer, ...answers].slice(0, 200);
      persistAnswers(next);
      sync.syncAnswer(answer);
      return answer;
    },
    [answers, persistAnswers, sync],
  );

  const deleteAnswer = useCallback(
    (id: string) => {
      const next = answers.filter((a) => a.id !== id);
      persistAnswers(next);
      sync.syncDelete(id);
    },
    [answers, persistAnswers, sync],
  );

  const clearAllAnswers = useCallback(async () => {
    setAnswers([]);
    await AsyncStorage.removeItem(ANSWERS_KEY);
  }, []);

  const getAnswer = useCallback(
    (id: string) => answers.find((a) => a.id === id),
    [answers],
  );

  // ── Per-item mutations ──────────────────────────────────────────────
  // All mutations are immutable: we map the array, replacing the one
  // target answer + the one target item. AsyncStorage persists the new
  // array. Per-item state lives inline on the SavedAnswer, so a single
  // share-pack always reflects the current progress.
  const toggleActionItem = useCallback(
    (answerId: string, itemId: string) => {
      const now = Date.now();
      let updated: SavedAnswer | null = null;
      const next = answers.map((a) => {
        if (a.id !== answerId) return a;
        updated = {
          ...a,
          actionPlan: a.actionPlan.map((item) =>
            item.id !== itemId
              ? item
              : {
                  ...item,
                  done: !item.done,
                  doneAt: !item.done ? now : undefined,
                },
          ),
        };
        return updated;
      });
      persistAnswers(next);

      // Analytics + sync
      if (updated) {
        sync.syncAnswer(updated);
        const done = (updated as SavedAnswer).actionPlan.find((i) => i.id === itemId)?.done;
        const event = {
          event_type: "checklist_toggled",
          metadata: { request_id: answerId, item_type: "action", done },
          client_timestamp: new Date().toISOString(),
        };
        insertEvent(event, auth.user?.id ?? null).catch(() => queueEvent(event));
      }
    },
    [answers, persistAnswers, sync, auth.user?.id],
  );

  const setActionItemNote = useCallback(
    (answerId: string, itemId: string, note: string) => {
      const trimmed = note.trim().slice(0, 280);
      let updated: SavedAnswer | null = null;
      const next = answers.map((a) => {
        if (a.id !== answerId) return a;
        updated = {
          ...a,
          actionPlan: a.actionPlan.map((item) =>
            item.id !== itemId
              ? item
              : { ...item, note: trimmed.length > 0 ? trimmed : undefined },
          ),
        };
        return updated;
      });
      persistAnswers(next);
      if (updated) sync.syncAnswer(updated);
    },
    [answers, persistAnswers, sync],
  );

  const toggleEvidenceItem = useCallback(
    (answerId: string, itemId: string) => {
      const now = Date.now();
      let updated: SavedAnswer | null = null;
      const next = answers.map((a) => {
        if (a.id !== answerId) return a;
        updated = {
          ...a,
          evidenceChecklist: a.evidenceChecklist.map((item) =>
            item.id !== itemId
              ? item
              : {
                  ...item,
                  done: !item.done,
                  doneAt: !item.done ? now : undefined,
                },
          ),
        };
        return updated;
      });
      persistAnswers(next);

      // Analytics + sync
      if (updated) {
        sync.syncAnswer(updated);
        const done = (updated as SavedAnswer).evidenceChecklist.find((i) => i.id === itemId)?.done;
        const event = {
          event_type: "checklist_toggled",
          metadata: { request_id: answerId, item_type: "evidence", done },
          client_timestamp: new Date().toISOString(),
        };
        insertEvent(event, auth.user?.id ?? null).catch(() => queueEvent(event));
      }
    },
    [answers, persistAnswers, sync, auth.user?.id],
  );

  const setEvidenceItemNote = useCallback(
    (answerId: string, itemId: string, note: string) => {
      const trimmed = note.trim().slice(0, 280);
      let updated: SavedAnswer | null = null;
      const next = answers.map((a) => {
        if (a.id !== answerId) return a;
        updated = {
          ...a,
          evidenceChecklist: a.evidenceChecklist.map((item) =>
            item.id !== itemId
              ? item
              : { ...item, note: trimmed.length > 0 ? trimmed : undefined },
          ),
        };
        return updated;
      });
      persistAnswers(next);
      if (updated) sync.syncAnswer(updated);
    },
    [answers, persistAnswers, sync],
  );

  const exportAllAsJson = useCallback(() => {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        user: localUser,
        settings,
        answers,
      },
      null,
      2,
    );
  }, [localUser, settings, answers]);

  // Derive effective user: Supabase profile takes precedence over local user
  const effectiveUser: UserProfile | null = auth.profile
    ? {
        name: auth.profile.name,
        signedAt: auth.profile.created_at.slice(0, 10),
        disclaimerVersion: auth.profile.disclaimer_version || "v1",
      }
    : localUser;

  const isLoggedIn = !!effectiveUser;

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      user: effectiveUser,
      isLoggedIn,
      signIn: signInLocal,
      signOut,
      username: effectiveUser?.name ?? null,
      settings,
      updateSettings,
      answers,
      getAnswer,
      saveAnswer,
      deleteAnswer,
      clearAllAnswers,
      toggleActionItem,
      setActionItemNote,
      toggleEvidenceItem,
      setEvidenceItemNote,
      exportAllAsJson,
    }),
    [
      ready,
      effectiveUser,
      isLoggedIn,
      signInLocal,
      signOut,
      settings,
      updateSettings,
      answers,
      getAnswer,
      saveAnswer,
      deleteAnswer,
      clearAllAnswers,
      toggleActionItem,
      setActionItemNote,
      toggleEvidenceItem,
      setEvidenceItemNote,
      exportAllAsJson,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
