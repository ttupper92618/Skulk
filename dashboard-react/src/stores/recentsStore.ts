/**
 * Recents Store
 *
 * localStorage-persisted list of recently launched model IDs (max 20).
 * Replaces recents.svelte.ts from the original Svelte dashboard.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_RECENTS = 20;

export interface RecentModel {
  modelId: string;
  launchedAt: number;
}

interface RecentsState {
  recents: RecentModel[];
  hasRecents: () => boolean;
  getRecentModelIds: () => string[];
  recordRecentLaunch: (modelId: string) => void;
}

export const useRecentsStore = create<RecentsState>()(
  persist(
    (set, get) => ({
      recents: [],

      hasRecents: () => get().recents.length > 0,

      getRecentModelIds: () => get().recents.map((r) => r.modelId),

      recordRecentLaunch: (modelId) => {
        set((state) => {
          const filtered = state.recents.filter((r) => r.modelId !== modelId);
          const updated: RecentModel[] = [
            { modelId, launchedAt: Date.now() },
            ...filtered,
          ].slice(0, MAX_RECENTS);
          return { recents: updated };
        });
      },
    }),
    {
      name: 'exo-recent-models',
    },
  ),
);
