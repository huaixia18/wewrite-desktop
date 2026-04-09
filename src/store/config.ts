import { create } from "zustand";

interface ConfigState {
  config: Record<string, string>;
  loaded: boolean;
  setConfig: (config: Record<string, string>) => void;
  updateKey: (key: string, value: string) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  config: {},
  loaded: false,

  setConfig: (config) => set({ config, loaded: true }),
  updateKey: (key, value) =>
    set((state) => ({ config: { ...state.config, [key]: value } })),
}));
