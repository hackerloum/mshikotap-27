import { create } from "zustand";
import { defaultSettings, toPublicConfig, type PublicConfig } from "@/config/system";

type ConfigState = {
  config: PublicConfig;
  loaded: boolean;
  load: () => Promise<void>;
};

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: toPublicConfig(defaultSettings),
  loaded: false,
  load: async () => {
    if (get().loaded) return;
    set({ loaded: true });
    try {
      const res = await fetch("/api/config", { cache: "no-store" });
      const json = (await res.json()) as { ok: boolean; data?: PublicConfig };
      if (json.ok && json.data) set({ config: json.data });
    } catch {
      set({ loaded: false });
    }
  },
}));
