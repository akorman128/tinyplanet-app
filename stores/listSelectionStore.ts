import { create } from "zustand";
import { AttachedList } from "@/types/post";

interface ListSelectionState {
  selectedList: AttachedList | null;
  setSelectedList: (list: AttachedList | null) => void;
  clear: () => void;
}

export const useListSelectionStore = create<ListSelectionState>((set) => ({
  selectedList: null,
  setSelectedList: (selectedList) => set({ selectedList }),
  clear: () => set({ selectedList: null }),
}));
