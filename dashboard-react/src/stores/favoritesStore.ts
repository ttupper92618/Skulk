/**
 * Favorites Store
 *
 * localStorage-persisted set of starred model IDs.
 * Replaces favorites.svelte.ts from the original Svelte dashboard.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesState {
  favoriteIds: string[];
  isFavorite: (modelId: string) => boolean;
  toggleFavorite: (modelId: string) => void;
  getFavoritesSet: () => Set<string>;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: [],

      isFavorite: (modelId) => get().favoriteIds.includes(modelId),

      toggleFavorite: (modelId) => {
        set((state) => {
          const exists = state.favoriteIds.includes(modelId);
          return {
            favoriteIds: exists
              ? state.favoriteIds.filter((id) => id !== modelId)
              : [...state.favoriteIds, modelId],
          };
        });
      },

      getFavoritesSet: () => new Set(get().favoriteIds),
    }),
    {
      name: 'exo-favorites',
    },
  ),
);
