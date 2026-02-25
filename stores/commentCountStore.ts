import { create } from "zustand";

interface CommentCountState {
  updates: Record<string, number>;
  set: (postId: string, count: number) => void;
  consume: (postId: string) => number | undefined;
}

export const useCommentCountStore = create<CommentCountState>((set, get) => ({
  updates: {},
  set: (postId, count) =>
    set((state) => ({ updates: { ...state.updates, [postId]: count } })),
  consume: (postId) => {
    const count = get().updates[postId];
    if (count !== undefined) {
      set((state) => {
        const { [postId]: _, ...rest } = state.updates;
        return { updates: rest };
      });
    }
    return count;
  },
}));
