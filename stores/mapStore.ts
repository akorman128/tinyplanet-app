import { create } from "zustand";

export type MapFilter = "friends" | "travel_plans" | "hometown" | "lists";

interface MapState {
  showConnectionLines: boolean;
  setShowConnectionLines: (value: boolean) => void;
  mapFilter: MapFilter;
  setMapFilter: (value: MapFilter) => void;
  recenterRequestId: number;
  requestRecenter: () => void;
}

export const useMapStore = create<MapState>()((set) => ({
  showConnectionLines: false,
  setShowConnectionLines: (value) => set({ showConnectionLines: value }),
  mapFilter: "friends",
  setMapFilter: (value) => set({ mapFilter: value }),
  recenterRequestId: 0,
  requestRecenter: () =>
    set((s) => ({ recenterRequestId: s.recenterRequestId + 1 })),
}));
