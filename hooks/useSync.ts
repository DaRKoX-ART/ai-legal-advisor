import { useCallback, useRef } from "react";

import { useAuth } from "@/context/AuthContext";
import {
  deleteRequest,
  fetchUserRequests,
  upsertRequest,
} from "@/services/supabase/requests";
import type { SavedAnswer } from "@/types/answer";

export type SyncStatus = "idle" | "syncing" | "error";

/**
 * Cloud sync orchestrator.
 *
 * Rules:
 *   - Local AsyncStorage is the primary source of truth for UI.
 *   - Supabase is the backup + sync target (eventual consistency).
 *   - Every mutation is optimistically saved locally, then queued for cloud sync.
 *   - If the user is not authenticated, sync is a silent no-op.
 *   - Fire-and-forget: sync failures are logged (dev only) and retried on next mutation.
 */
export function useSync() {
  const auth = useAuth();
  const pendingRef = useRef<Set<string>>(new Set());

  /**
   * Fire-and-forget upsert of a single answer to the cloud.
   */
  const syncAnswer = useCallback(
    async (answer: SavedAnswer) => {
      if (!auth.isAuthenticated || !auth.user) return;
      const key = answer.id;

      // Deduplicate: if this answer is already syncing, skip
      if (pendingRef.current.has(key)) return;
      pendingRef.current.add(key);

      try {
        await upsertRequest(answer, auth.user.id);
      } catch (err) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn("[sync] upsert failed:", err);
        }
      } finally {
        pendingRef.current.delete(key);
      }
    },
    [auth.isAuthenticated, auth.user],
  );

  /**
   * Fire-and-forget delete of a single answer from the cloud.
   */
  const syncDelete = useCallback(
    async (localId: string) => {
      if (!auth.isAuthenticated || !auth.user) return;
      try {
        await deleteRequest(localId, auth.user.id);
      } catch (err) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn("[sync] delete failed:", err);
        }
      }
    },
    [auth.isAuthenticated, auth.user],
  );

  /**
   * Bulk sync: push all local answers to the cloud.
   * Used after sign-in to migrate existing local data.
   */
  const syncAll = useCallback(
    async (answers: SavedAnswer[]) => {
      if (!auth.isAuthenticated || !auth.user) return { error: "Not authenticated" };
      const errors: string[] = [];
      for (const answer of answers) {
        const { error } = await upsertRequest(answer, auth.user.id);
        if (error) errors.push(error);
      }
      return { error: errors.length > 0 ? errors.join("; ") : null };
    },
    [auth.isAuthenticated, auth.user],
  );

  /**
   * Pull cloud data and merge with local answers.
   * Conflict resolution: last-write-wins by createdAt (simple, predictable).
   */
  const pullFromCloud = useCallback(
    async (localAnswers: SavedAnswer[]): Promise<{
      merged: SavedAnswer[];
      error: string | null;
    }> => {
      if (!auth.isAuthenticated || !auth.user) {
        return { merged: localAnswers, error: null };
      }
      const { requests: cloudAnswers, error } = await fetchUserRequests(
        auth.user.id,
      );
      if (error || cloudAnswers.length === 0) {
        return { merged: localAnswers, error };
      }

      const localMap = new Map(localAnswers.map((a) => [a.id, a]));
      const cloudMap = new Map(cloudAnswers.map((a) => [a.id, a]));

      // Merge: for each ID present in both, pick the one with later createdAt
      const allIds = new Set([...localMap.keys(), ...cloudMap.keys()]);
      const merged: SavedAnswer[] = [];

      for (const id of allIds) {
        const local = localMap.get(id);
        const cloud = cloudMap.get(id);
        if (local && cloud) {
          merged.push(local.createdAt >= cloud.createdAt ? local : cloud);
        } else if (local) {
          merged.push(local);
        } else if (cloud) {
          merged.push(cloud);
        }
      }

      // Sort by createdAt desc (newest first)
      merged.sort((a, b) => b.createdAt - a.createdAt);

      return { merged, error: null };
    },
    [auth.isAuthenticated, auth.user],
  );

  return {
    syncAnswer,
    syncDelete,
    syncAll,
    pullFromCloud,
    isAuthenticated: auth.isAuthenticated,
  };
}
