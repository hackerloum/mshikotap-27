"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { roleHome } from "@/config/site";
import type { UserRole } from "@/types";

export function useAuthGuard(allowed?: UserRole[]) {
  const router = useRouter();
  const { user, hydrated, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (allowed && !allowed.includes(user.role)) {
      router.replace(roleHome[user.role]);
    }
  }, [allowed, hydrated, router, user]);

  return { user, hydrated, ready: hydrated && !!user };
}
