/**
 * UI Store
 *
 * All UI-state toggles: sidebar visibility, debug mode, mobile drawers,
 * topology minimized state.  Replaces the UI slices of app.svelte.ts.
 */
import { create } from 'zustand';

interface UIState {
  // Layout
  chatSidebarVisible: boolean;
  topologyMinimized: boolean;
  topologyOnlyMode: boolean;
  debugMode: boolean;

  // Mobile drawers
  mobileChatSidebarOpen: boolean;
  mobileRightSidebarOpen: boolean;

  // Actions
  toggleChatSidebar: () => void;
  setChatSidebarVisible: (visible: boolean) => void;
  toggleTopologyMinimized: () => void;
  setTopologyMinimized: (minimized: boolean) => void;
  toggleTopologyOnlyMode: () => void;
  toggleDebugMode: () => void;
  toggleMobileChatSidebar: () => void;
  setMobileChatSidebarOpen: (open: boolean) => void;
  toggleMobileRightSidebar: () => void;
  setMobileRightSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  chatSidebarVisible: true,
  topologyMinimized: false,
  topologyOnlyMode: false,
  debugMode: false,
  mobileChatSidebarOpen: false,
  mobileRightSidebarOpen: false,

  toggleChatSidebar: () =>
    set((s) => ({ chatSidebarVisible: !s.chatSidebarVisible })),
  setChatSidebarVisible: (visible) => set({ chatSidebarVisible: visible }),

  toggleTopologyMinimized: () =>
    set((s) => ({ topologyMinimized: !s.topologyMinimized })),
  setTopologyMinimized: (minimized) => set({ topologyMinimized: minimized }),

  toggleTopologyOnlyMode: () =>
    set((s) => ({ topologyOnlyMode: !s.topologyOnlyMode })),

  toggleDebugMode: () => set((s) => ({ debugMode: !s.debugMode })),

  toggleMobileChatSidebar: () =>
    set((s) => ({ mobileChatSidebarOpen: !s.mobileChatSidebarOpen })),
  setMobileChatSidebarOpen: (open) => set({ mobileChatSidebarOpen: open }),

  toggleMobileRightSidebar: () =>
    set((s) => ({ mobileRightSidebarOpen: !s.mobileRightSidebarOpen })),
  setMobileRightSidebarOpen: (open) => set({ mobileRightSidebarOpen: open }),
}));
