import { create } from "zustand";

export type MapFilter = "friends" | "hometown" | "lists";

interface MapState {
  showConnectionLines: boolean;
  setShowConnectionLines: (value: boolean) => void;
  mapFilter: MapFilter;
  setMapFilter: (value: MapFilter) => void;
}

export const useMapStore = create<MapState>()((set) => ({
  showConnectionLines: false,
  setShowConnectionLines: (value) => set({ showConnectionLines: value }),
  mapFilter: "friends",
  setMapFilter: (value) => set({ mapFilter: value }),
}));
