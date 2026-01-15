import { create } from "zustand";

interface MapState {
  showConnectionLines: boolean;
  setShowConnectionLines: (value: boolean) => void;
}

export const useMapStore = create<MapState>()((set) => ({
  showConnectionLines: false,
  setShowConnectionLines: (value) => set({ showConnectionLines: value }),
}));
