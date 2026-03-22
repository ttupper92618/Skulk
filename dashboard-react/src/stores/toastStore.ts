/**
 * Toast Store
 *
 * Notification system with auto-dismiss timers.
 * Replaces toast.svelte.ts from the original Svelte dashboard.
 */
import { create } from 'zustand';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  durationMs: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, variant?: ToastVariant, durationMs?: number) => void;
  dismissToast: (id: string) => void;
  dismissByMessage: (message: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (message, variant = 'info', durationMs = 4000) => {
    const id = crypto.randomUUID();
    const toast: Toast = { id, message, variant, durationMs };

    set((state) => ({ toasts: [...state.toasts, toast] }));

    if (durationMs > 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, durationMs);
    }
  },

  dismissToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  dismissByMessage: (message) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.message !== message),
    }));
  },
}));
