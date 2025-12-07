import { create } from "zustand";

export enum S {
  state_0 = 0,
  state_1,
  state_2,
  state_3,
  state_4,
  state_5,
  state_6,
  state_7,
  state_final // Contact/Connect state - always the last destination
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
  navigationMode: 'guided' | 'free'; // Navigation mode for states 4 & 5
  setNavigationMode: (mode: 'guided' | 'free') => void;
  audioEnabled: boolean; // Global audio manager
  setAudioEnabled: (enabled: boolean) => void;
  loadingProgress: number;
  setLoadingProgress: (progress: number) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  bydCustomizerVisible: boolean; // BYD car customizer visibility
  setBydCustomizerVisible: (visible: boolean) => void;
  bydCustomizeCallback: ((params: { color?: string; trim?: string }) => { finalColor: string; finalTrim: string } | null) | null;
  setBydCustomizeCallback: (callback: ((params: { color?: string; trim?: string }) => { finalColor: string; finalTrim: string } | null) | null) => void;
  isInteriorView: boolean;
  setIsInteriorView: (isInterior: boolean) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
};

export const useUI = create<UIState>((set, get) => ({
  state: S.state_0,
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
  setNavigationMode: (mode) => set({ navigationMode: mode }),
  audioEnabled: true, // Audio on by default
  setAudioEnabled: (enabled) => set({ audioEnabled: enabled }),
  loadingProgress: 0,
  setLoadingProgress: (progress) => set({ loadingProgress: progress }),
  isLoading: true,
  setIsLoading: (loading) => set({ isLoading: loading }),
  bydCustomizerVisible: false, // BYD customizer hidden by default
  setBydCustomizerVisible: (visible) => set({ bydCustomizerVisible: visible }),
  bydCustomizeCallback: null,
  setBydCustomizeCallback: (callback) => set({ bydCustomizeCallback: callback }),
  isInteriorView: false,
  setIsInteriorView: (isInterior) => set({ isInteriorView: isInterior }),
  menuOpen: false,
  setMenuOpen: (open) => set({ menuOpen: open })
}));
