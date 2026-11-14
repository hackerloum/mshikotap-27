"use client";

import { useEffect } from "react";
import { Toaster } from "sonner";
import { useAuthStore } from "@/store/auth-store";
import { useConfigStore } from "@/store/config-store";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const init = useAuthStore((s) => s.init);
  const loadConfig = useConfigStore((s) => s.load);

  useEffect(() => {
    init();
    void loadConfig();
  }, [init, loadConfig]);

  return (
    <>
      {children}
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          classNames: {
            toast:
              "!rounded-2xl !border-2 !border-ink-600 !bg-ink-800 !font-sans !font-bold !text-white",
          },
        }}
      />
    </>
  );
}
