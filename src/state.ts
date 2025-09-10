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
};

export const useUI = create<UIState>((set, get) => ({
  state: S.state_1,
  setState: (s) => set({ state: s }),
  next: () => set({ state: (get().state + 1) as S }),
  prev: () => set({ state: (get().state - 1) as S }),
  chatOpen: false,
  setChatOpen: (open) => set({ chatOpen: open })
}));
