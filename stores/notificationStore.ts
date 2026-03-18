import { create } from "zustand";

interface NotificationState {
  /** The friendId of the currently open chat, or null if no chat is open */
  activeChatFriendId: string | null;
  setActiveChatFriendId: (friendId: string | null) => void;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  activeChatFriendId: null,
  setActiveChatFriendId: (friendId) => set({ activeChatFriendId: friendId }),
}));
