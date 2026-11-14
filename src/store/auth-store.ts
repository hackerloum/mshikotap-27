"use client";

import { onAuthStateChanged } from "firebase/auth";
import { create } from "zustand";
import { api } from "@/lib/api-client";
import { getClientAuth } from "@/lib/firebase/client";
import { authService } from "@/services/auth.service";
import type { UserProfile } from "@/types";

interface ClaimResult {
  ok: boolean;
  reward?: number;
  xpGain?: number;
  levelUp?: boolean;
  nextClaimAt?: string;
  message?: string;
}

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  hydrated: boolean;
  error: string | null;
  init: () => void;
  signInWithGoogle: () => Promise<boolean>;
  claimDaily: () => Promise<ClaimResult>;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setUser: (user: UserProfile | null) => void;
}

let started = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  hydrated: false,
  error: null,

  init: () => {
    if (started) return;
    started = true;

    const auth = getClientAuth();
    if (!auth) {
      set({ hydrated: true });
      return;
    }

    onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        set({ user: null, hydrated: true });
        return;
      }
      try {
        const profile = await authService.loadProfile(firebaseUser);
        set({ user: profile, hydrated: true });
      } catch (error) {
        await authService.logout();
        set({
          user: null,
          hydrated: true,
          error: error instanceof Error ? error.message : "Could not load your account",
        });
      }
    });
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    const result = await authService.signInWithGoogle();
    if (!result.ok) {
      const quiet = result.error.code === "CANCELLED" || result.error.code === "REDIRECTING";
      set({ loading: false, error: quiet ? null : result.error.message });
      return false;
    }
    set({ user: result.data, loading: false, hydrated: true });
    return true;
  },

  claimDaily: async () => {
    const { user } = get();
    if (!user) return { ok: false, message: "Sign in first" };

    const auth = getClientAuth();
    const token = await auth?.currentUser?.getIdToken();
    if (!token) return { ok: false, message: "Sign in again to claim" };

    try {
      const res = await fetch("/api/daily-claim", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!json.ok) {
        return {
          ok: false,
          message: json.error?.message,
          nextClaimAt: json.error?.nextClaimAt,
        };
      }
      set({ user: json.data.profile });
      return {
        ok: true,
        reward: json.data.reward,
        xpGain: json.data.xpGain,
        levelUp: json.data.levelUp,
      };
    } catch {
      return { ok: false, message: "Network hiccup. Try again." };
    }
  },

  refreshProfile: async () => {
    const res = await api<{ profile: UserProfile }>("/api/me", {
      method: "POST",
      body: {},
    });
    if (res.ok) set({ user: res.data.profile });
  },

  logout: async () => {
    await authService.logout();
    set({ user: null });
  },

  clearError: () => set({ error: null }),
  setUser: (user) => set({ user }),
}));
