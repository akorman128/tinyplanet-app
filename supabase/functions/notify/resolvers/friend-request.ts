import { profileName, type Db, type ResolvedNotification } from "../../_shared/expo-push.ts";
import { friendRequestRecipient } from "../../_shared/recipients.ts";

interface FriendshipRecord {
  user_a: string;
  user_b: string;
  requested_by: string;
  status: string;
}

export async function friendRequest(
  client: Db,
  record: FriendshipRecord
): Promise<ResolvedNotification | null> {
  if (record.status !== "pending") return null;
  const recipientId = friendRequestRecipient(record);
  const actor = await profileName(client, record.requested_by);
  return {
    recipients: [recipientId],
    title: actor.full_name,
    body: `${actor.full_name} requested to be friends`,
    data: { type: "friend_request", requesterId: record.requested_by },
    avatarUrl: actor.avatar_url,
  };
}
