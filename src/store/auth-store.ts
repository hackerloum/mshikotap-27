"use client";

import { create } from "zustand";
import { authService } from "@/services/auth.service";
import type { UserProfile, UserRole } from "@/types";

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  hydrated: boolean;
  error: string | null;
  hydrate: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (input: {
    email: string;
    password: string;
    displayName: string;
    role?: UserRole;
    referralCode?: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  setUser: (user: UserProfile | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  hydrated: false,
  error: null,

  hydrate: () => {
    const session = authService.getDemoSession();
    set({ user: session, hydrated: true });
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    const result = await authService.login(email, password);
    if (!result.ok) {
      set({ loading: false, error: result.error.message });
      return false;
    }
    set({ user: result.data, loading: false });
    return true;
  },

  register: async (input) => {
    set({ loading: true, error: null });
    const result = await authService.register(input);
    if (!result.ok) {
      set({ loading: false, error: result.error.message });
      return false;
    }
    set({ user: result.data, loading: false });
    return true;
  },

  logout: async () => {
    await authService.logout();
    set({ user: null });
  },

  clearError: () => set({ error: null }),
  setUser: (user) => set({ user }),
}));
