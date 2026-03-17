export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface BlockUserInput {
  targetUserId: string;
}

export interface UnblockUserInput {
  targetUserId: string;
}

export interface BlockedUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  blocked_at: string;
}
