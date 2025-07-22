// /hooks/useStore.ts
import { create } from 'zustand';
import { User } from '@/lib/types';

interface AppState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// Selectors for performance optimization
export const useCurrentUser = () => useStore((state) => state.user);
export const useIsLoading = () => useStore((state) => state.isLoading);