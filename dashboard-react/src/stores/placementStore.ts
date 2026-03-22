/**
 * Placement Store
 *
 * Manages model placement previews — which nodes a model would be
 * sharded across if launched.  Replaces the placement slices of app.svelte.ts.
 */
import { create } from 'zustand';
import { fetchPlacementPreview } from '../api/client';
import type { PlacementPreview } from '../api/types';

interface PlacementState {
  previews: Record<string, PlacementPreview>;
  selectedModelId: string | null;
  isLoading: boolean;
  nodeFilter: Set<string>;

  // Actions
  selectModel: (modelId: string | null) => void;
  loadPreview: (modelId: string) => Promise<void>;
  toggleNodeFilter: (nodeId: string) => void;
  clearNodeFilter: () => void;
}

export const usePlacementStore = create<PlacementState>((set, get) => ({
  previews: {},
  selectedModelId: null,
  isLoading: false,
  nodeFilter: new Set(),

  selectModel: (modelId) => {
    set({ selectedModelId: modelId });
    if (modelId && !get().previews[modelId]) {
      void get().loadPreview(modelId);
    }
  },

  loadPreview: async (modelId) => {
    set({ isLoading: true });
    try {
      const preview = await fetchPlacementPreview(modelId);
      set((state) => ({
        previews: { ...state.previews, [modelId]: preview },
        isLoading: false,
      }));
    } catch {
      set({ isLoading: false });
    }
  },

  toggleNodeFilter: (nodeId) => {
    set((state) => {
      const next = new Set(state.nodeFilter);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return { nodeFilter: next };
    });
  },

  clearNodeFilter: () => set({ nodeFilter: new Set() }),
}));
