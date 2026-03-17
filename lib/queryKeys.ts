/**
 * Centralized query key factory.
 * Convention: [domain, scope, ...params]
 * Use these keys in every useQuery/useMutation invalidation.
 */
export const queryKeys = {
  // Posts
  posts: {
    all: ["posts"] as const,
    detail: (postId: string) => ["posts", "detail", postId] as const,
    feed: () => ["posts", "feed"] as const,
    userPosts: (userId: string) => ["posts", "user", userId] as const,
    saved: () => ["posts", "saved"] as const,
  },

  // Comments
  comments: {
    all: ["comments"] as const,
    byPost: (postId: string) => ["comments", "post", postId] as const,
  },

  // Likes — used for invalidation after like/unlike mutations
  likes: {
    all: ["likes"] as const,
  },

  // Friends
  friends: {
    all: ["friends"] as const,
    list: (userId?: string) => ["friends", "list", userId] as const,
    friendsOfFriends: ["friends", "fof"] as const,
    locations: ["friends", "locations"] as const,
    hometownLocations: ["friends", "hometowns"] as const,
    search: (query: string) => ["friends", "search", query] as const,
    status: (targetUserId: string) =>
      ["friends", "status", targetUserId] as const,
    pending: ["friends", "pending"] as const,
    mutuals: (targetUserId: string) =>
      ["friends", "mutuals", targetUserId] as const,
    platformStats: ["friends", "platformStats"] as const,
  },

  // Chat & Messages
  messages: {
    all: ["messages"] as const,
    conversation: (friendId: string) =>
      ["messages", "conversation", friendId] as const,
    channels: ["messages", "channels"] as const,
    unread: ["messages", "unread"] as const,
  },

  // Lists
  lists: {
    all: ["lists"] as const,
    detail: (listId: string) => ["lists", "detail", listId] as const,
    byUser: (userId?: string) => ["lists", "user", userId] as const,
    viewable: (userId?: string) => ["lists", "viewable", userId] as const,
    locations: ["lists", "locations"] as const,
  },

  // Travel Plans
  travelPlans: {
    all: ["travelPlans"] as const,
    active: (userId: string) => ["travelPlans", "active", userId] as const,
    byUser: (userId: string) => ["travelPlans", "user", userId] as const,
    byPostId: (postId: string) => ["travelPlans", "byPostId", postId] as const,
    locations: ["travelPlans", "locations"] as const,
  },

  // Vibes
  vibes: {
    all: ["vibes"] as const,
    byRecipient: (recipientId: string) =>
      ["vibes", "recipient", recipientId] as const,
    withSenderInfo: (recipientId: string) =>
      ["vibes", "withSender", recipientId] as const,
    top: (userId: string) => ["vibes", "top", userId] as const,
    hasGiven: (senderId: string, recipientId: string) =>
      ["vibes", "hasGiven", senderId, recipientId] as const,
  },

  // Contacts
  contacts: {
    all: ["contacts"] as const,
    list: (userId?: string) => ["contacts", "list", userId] as const,
    detail: (contactId: string) => ["contacts", "detail", contactId] as const,
  },

  // Invite Codes
  inviteCodes: {
    all: ["inviteCodes"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["inviteCodes", "list", filters] as const,
    monthlyCount: ["inviteCodes", "monthlyCount"] as const,
  },

  // Profile
  profile: {
    all: ["profile"] as const,
    detail: (userId: string) => ["profile", "detail", userId] as const,
  },

  // Intros
  intros: {
    all: ["intros"] as const,
    byFriend: (friendId: string) => ["intros", "byFriend", friendId] as const,
  },

  // Blocks
  blocks: {
    all: ["blocks"] as const,
    list: ["blocks", "list"] as const,
    status: (targetUserId: string) =>
      ["blocks", "status", targetUserId] as const,
  },

  // Auth / Session
  auth: {
    session: ["auth", "session"] as const,
  },
} as const;
