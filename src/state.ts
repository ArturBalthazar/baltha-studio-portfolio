import { create } from "zustand";

export enum S {
  state_1 = 0,
  state_2,
  state_3,
  state_4,
  state_5,
  state_6,
  state_7,
  state_8,
  state_9,
  state_10
}

type UIState = {
  state: S;
  setState: (s: S) => void;
  next: () => void;
  prev: () => void;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  selectedLogoModel: number; // 0=logo, 1=chain, 2=cookie, 3=badge
  setSelectedLogoModel: (index: number) => void;
  selectedContinent: number; // 0=Africa, 1=North America, 2=Europe, 3=South America, 4=Oceania, 5=Asia
  setSelectedContinent: (index: number) => void;
  navigationMode: 'guided' | 'free'; // Navigation mode for state 5
  setNavigationMode: (mode: 'guided' | 'free') => void;
};

export const useUI = create<UIState>((set, get) => ({
  state: S.state_1,
  setState: (s) => set({ state: s }),
  next: () => set({ state: (get().state + 1) as S }),
  prev: () => set({ state: (get().state - 1) as S }),
  chatOpen: false,
  setChatOpen: (open) => set({ chatOpen: open }),
  selectedLogoModel: 0,
  setSelectedLogoModel: (index) => set({ selectedLogoModel: index }),
  selectedContinent: 2, // Default to Europe (index 2)
  setSelectedContinent: (index) => set({ selectedContinent: index }),
  navigationMode: 'guided', // Default to guided mode
  setNavigationMode: (mode) => set({ navigationMode: mode })
}));
