import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { getClientAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { AppError, ok, fromUnknown } from "@/lib/errors/app-error";
import { generateReferralCode } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { demoAdmin, demoAdvertiser, demoUser } from "@/data/demo";
import type { ApiResult, UserProfile, UserRole } from "@/types";
import { activityService } from "@/services/activity.service";

const DEMO_SESSION_KEY = "mshikotap.demo.session";

function demoProfileFor(role: UserRole): UserProfile {
  if (role === "admin") return structuredClone(demoAdmin);
  if (role === "advertiser") return structuredClone(demoAdvertiser);
  return structuredClone(demoUser);
}

export const authService = {
  isDemo() {
    return siteConfig.demoMode || !isFirebaseConfigured;
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

  async login(email: string, password: string): Promise<ApiResult<UserProfile>> {
    try {
      if (this.isDemo()) {
        const role: UserRole = email.includes("admin")
          ? "admin"
          : email.includes("advertiser") || email.includes("brand")
            ? "advertiser"
            : "user";
        const profile = {
          ...demoProfileFor(role),
          email,
          displayName: email.split("@")[0] || "Demo User",
        };
        this.setDemoSession(profile);
        await activityService.log({
          actorId: profile.uid,
          action: "auth.login",
          entityType: "user",
          entityId: profile.uid,
          metadata: { mode: "demo" },
        });
        return ok(profile);
      }

      const auth = getClientAuth();
      if (!auth) throw new AppError("AUTH_UNAVAILABLE", "Auth is not configured", 503);
      const credential = await signInWithEmailAndPassword(auth, email, password);
      // Profile hydration happens via userService in real mode.
      const profile: UserProfile = {
        ...demoUser,
        uid: credential.user.uid,
        email: credential.user.email || email,
        displayName: credential.user.displayName || email.split("@")[0] || "User",
      };
      return ok(profile);
    } catch (error) {
      return fromUnknown(error);
    }
  },

  async register(input: {
    email: string;
    password: string;
    displayName: string;
    role?: UserRole;
    referralCode?: string;
  }): Promise<ApiResult<UserProfile>> {
    try {
      const role = input.role || "user";
      if (this.isDemo()) {
        const profile: UserProfile = {
          ...demoProfileFor(role),
          email: input.email,
          displayName: input.displayName,
          referralCode: generateReferralCode(input.displayName),
          referredBy: input.referralCode,
          role,
        };
        this.setDemoSession(profile);
        await activityService.log({
          actorId: profile.uid,
          action: "auth.register",
          entityType: "user",
          entityId: profile.uid,
          metadata: { mode: "demo", role },
        });
        return ok(profile);
      }

      const auth = getClientAuth();
      if (!auth) throw new AppError("AUTH_UNAVAILABLE", "Auth is not configured", 503);
      const credential = await createUserWithEmailAndPassword(
        auth,
        input.email,
        input.password,
      );
      await updateProfile(credential.user, { displayName: input.displayName });
      const profile: UserProfile = {
        ...demoUser,
        uid: credential.user.uid,
        email: input.email,
        displayName: input.displayName,
        role,
        referralCode: generateReferralCode(input.displayName),
        referredBy: input.referralCode,
      };
      return ok(profile);
    } catch (error) {
      return fromUnknown(error);
    }
  },

  async forgotPassword(email: string): Promise<ApiResult<{ sent: boolean }>> {
    try {
      if (this.isDemo()) return ok({ sent: true });
      const auth = getClientAuth();
      if (!auth) throw new AppError("AUTH_UNAVAILABLE", "Auth is not configured", 503);
      await sendPasswordResetEmail(auth, email);
      return ok({ sent: true });
    } catch (error) {
      return fromUnknown(error);
    }
  },

  async logout(): Promise<ApiResult<{ success: true }>> {
    try {
      if (this.isDemo()) {
        this.setDemoSession(null);
        return ok({ success: true });
      }
      const auth = getClientAuth();
      if (auth) await signOut(auth);
      return ok({ success: true });
    } catch (error) {
      return fromUnknown(error);
    }
  },
};
