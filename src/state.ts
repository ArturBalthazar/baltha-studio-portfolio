import { create } from "zustand";

export enum S {
  state_0 = 0,
  state_3 = 1,  // Mode selection (skipping removed states 1 & 2)
  state_4 = 2,  // Meetkai
  state_5 = 3,  // More Than Real
  state_6 = 4,  // Baltha Maker
  state_7 = 5,  // UFSC (Product Design)
  state_8 = 6,  // Personal Projects
  state_final = 7 // Contact/Connect state - always the last destination
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
  audioVolume: number; // Volume level 0-1
  setAudioVolume: (volume: number) => void;
  loadingProgress: number;
  setLoadingProgress: (progress: number) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  sideTrigger: 'left' | 'right' | null; // Which side trigger is active for visual effect
  setSideTrigger: (side: 'left' | 'right' | null) => void;
  workplacePanelVisible: boolean; // Unified workplace panel visibility (for states 4-8)
  setWorkplacePanelVisible: (visible: boolean) => void;
  selectedProjectIndex: number; // Which project is selected within current workplace state
  setSelectedProjectIndex: (index: number) => void;
  activeWorkplaceState: S | null; // Which workplace anchor the ship is currently near (based on proximity)
  setActiveWorkplaceState: (state: S | null) => void;
  videoPlaying: boolean; // Whether a YouTube video is currently playing
  setVideoPlaying: (playing: boolean) => void;
  clickSoundActivated: boolean; // Whether click sounds have been activated (from state_3 onwards, persists)
  setClickSoundActivated: (activated: boolean) => void;
  pendingProjectNavigation: { targetState: S; projectIndex: number } | null; // Deferred project switch
  setPendingProjectNavigation: (pending: { targetState: S; projectIndex: number } | null) => void;
  applyPendingProjectIfNeeded: () => void; // Called when state changes to check if pending should apply
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
  audioVolume: 0.5, // Default 50% volume
  setAudioVolume: (volume) => set({ audioVolume: volume }),
  loadingProgress: 0,
  setLoadingProgress: (progress) => set({ loadingProgress: progress }),
  isLoading: true,
  setIsLoading: (loading) => set({ isLoading: loading }),
  menuOpen: false,
  setMenuOpen: (open) => set({ menuOpen: open }),
  sideTrigger: null,
  setSideTrigger: (side) => set({ sideTrigger: side }),
  workplacePanelVisible: false, // Workplace panel hidden by default
  setWorkplacePanelVisible: (visible) => set({ workplacePanelVisible: visible }),
  selectedProjectIndex: 0, // Default to first project
  setSelectedProjectIndex: (index) => set({ selectedProjectIndex: index }),
  activeWorkplaceState: null, // No active workplace by default
  setActiveWorkplaceState: (state) => set({ activeWorkplaceState: state }),
  videoPlaying: false, // No video playing by default
  setVideoPlaying: (playing) => set({ videoPlaying: playing }),
  clickSoundActivated: false, // Click sounds not activated until reaching state_3
  setClickSoundActivated: (activated) => set({ clickSoundActivated: activated }),
  pendingProjectNavigation: null, // No pending navigation by default
  setPendingProjectNavigation: (pending) => set({ pendingProjectNavigation: pending }),
  applyPendingProjectIfNeeded: () => {
    const { state, pendingProjectNavigation } = get();
    if (pendingProjectNavigation && state === pendingProjectNavigation.targetState) {
      set({
        selectedProjectIndex: pendingProjectNavigation.projectIndex,
        pendingProjectNavigation: null
      });
    }
  }
}));
