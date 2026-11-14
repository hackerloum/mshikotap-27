import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";
import { AppError, ok, fromUnknown } from "@/lib/errors/app-error";
import type { ApiResult, UserProfile } from "@/types";

const REFERRAL_KEY = "mshikotap.referral";

const inflight = new Map<string, Promise<UserProfile>>();

export const authService = {
  rememberReferral(code?: string | null) {
    if (typeof window === "undefined" || !code) return;
    window.localStorage.setItem(REFERRAL_KEY, code);
  },

  takeReferral(): string | undefined {
    if (typeof window === "undefined") return undefined;
    return window.localStorage.getItem(REFERRAL_KEY) || undefined;
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
      } finally {
        window.setTimeout(() => inflight.delete(firebaseUser.uid), 1500);
      }
    })();

    inflight.set(firebaseUser.uid, task);
    return task;
  },

  async signInWithGoogle(): Promise<ApiResult<UserProfile>> {
    try {
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
      const auth = getClientAuth();
      if (auth) await signOut(auth);
      return ok({ success: true });
    } catch (error) {
      return fromUnknown(error);
    }
  },
};
