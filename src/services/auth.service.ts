import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { getClientAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { AppError, ok, fromUnknown } from "@/lib/errors/app-error";
import { siteConfig } from "@/config/site";
import { demoUser } from "@/data/demo";
import type { ApiResult, UserProfile } from "@/types";

const DEMO_SESSION_KEY = "mshikotap.demo.session";
const REFERRAL_KEY = "mshikotap.referral";

const inflight = new Map<string, Promise<UserProfile>>();

export const authService = {
  isDemo() {
    return siteConfig.demoMode || !isFirebaseConfigured;
  },

  rememberReferral(code?: string | null) {
    if (typeof window === "undefined" || !code) return;
    window.localStorage.setItem(REFERRAL_KEY, code);
  },

  takeReferral(): string | undefined {
    if (typeof window === "undefined") return undefined;
    return window.localStorage.getItem(REFERRAL_KEY) || undefined;
  },

  getDemoSession(): UserProfile | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  },

  setDemoSession(profile: UserProfile | null) {
    if (typeof window === "undefined") return;
    if (!profile) {
      window.localStorage.removeItem(DEMO_SESSION_KEY);
      return;
    }
    window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(profile));
  },

  /** Exchanges a Firebase session for the server-owned game profile. */
  loadProfile(firebaseUser: FirebaseUser): Promise<UserProfile> {
    const existing = inflight.get(firebaseUser.uid);
    if (existing) return existing;

    const task = (async () => {
      try {
        const token = await firebaseUser.getIdToken();
        const res = await fetch("/api/me", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ referral: this.takeReferral() }),
        });
        const json = (await res.json()) as
          | { ok: true; data: { profile: UserProfile } }
          | { ok: false; error: { message: string } };
        if (!json.ok) throw new AppError("PROFILE_FAILED", json.error.message, res.status);
        return json.data.profile;
      } catch (error) {
        if (error instanceof AppError && error.status === 403) throw error;
        return {
          ...demoUser,
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "Player",
          photoURL: firebaseUser.photoURL || undefined,
          role: "user" as const,
          wallet: { ...demoUser.wallet, balance: 0, pendingBalance: 0, lifetimeEarnings: 0 },
          gamification: {
            xp: 0,
            level: 1,
            streakDays: 0,
            longestStreak: 0,
            badges: [],
          },
        } satisfies UserProfile;
      } finally {
        window.setTimeout(() => inflight.delete(firebaseUser.uid), 1500);
      }
    })();

    inflight.set(firebaseUser.uid, task);
    return task;
  },

  async signInWithGoogle(): Promise<ApiResult<UserProfile>> {
    try {
      if (this.isDemo()) {
        const profile = structuredClone(demoUser);
        this.setDemoSession(profile);
        return ok(profile);
      }

      const auth = getClientAuth();
      if (!auth) throw new AppError("AUTH_UNAVAILABLE", "Sign-in is not available right now", 503);

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      try {
        const credential = await signInWithPopup(auth, provider);
        return ok(await this.loadProfile(credential.user));
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (
          code === "auth/popup-blocked" ||
          code === "auth/operation-not-supported-in-this-environment"
        ) {
          await signInWithRedirect(auth, provider);
          return fromUnknown(new AppError("REDIRECTING", "Redirecting to Google…", 0));
        }
        if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
          return fromUnknown(new AppError("CANCELLED", "Sign-in cancelled", 0));
        }
        if (code === "auth/unauthorized-domain") {
          throw new AppError(
            "UNAUTHORIZED_DOMAIN",
            "This domain is not allowed for Google sign-in yet.",
            403,
          );
        }
        if (code === "auth/operation-not-allowed") {
          throw new AppError(
            "PROVIDER_DISABLED",
            "Google sign-in is not switched on yet.",
            503,
          );
        }
        throw error;
      }
    } catch (error) {
      return fromUnknown(error);
    }
  },

  async logout(): Promise<ApiResult<{ success: true }>> {
    try {
      this.setDemoSession(null);
      const auth = getClientAuth();
      if (auth) await signOut(auth);
      return ok({ success: true });
    } catch (error) {
      return fromUnknown(error);
    }
  },
};
