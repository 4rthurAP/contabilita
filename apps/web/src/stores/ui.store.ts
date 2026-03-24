import { create } from 'zustand';

interface UiState {
  sidebarOpen: boolean;
  mobileSidebarOpen: boolean;
  onboardingDismissed: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  dismissOnboarding: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  mobileSidebarOpen: false,
  onboardingDismissed: localStorage.getItem('onboarding_dismissed') === 'true',
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  dismissOnboarding: () => {
    localStorage.setItem('onboarding_dismissed', 'true');
    set({ onboardingDismissed: true });
  },
}));
