import { profileName, type Db, type ResolvedNotification } from "../../_shared/expo-push.ts";

interface LikeRecord {
  user_id: string;
  post_id: string | null;
  comment_id: string | null;
}

export async function like(
  client: Db,
  record: LikeRecord
): Promise<ResolvedNotification | null> {
  if (!record.post_id) return null; // post likes only
  const { data: post } = await client.from("posts").select("author_id").eq("id", record.post_id).single();
  if (!post) return null;
  const ownerId = post.author_id as string;
  if (ownerId === record.user_id) return null; // skip self-like
  const actor = await profileName(client, record.user_id);
  return {
    recipients: [ownerId],
    title: actor.full_name,
    body: `${actor.full_name} liked your post`,
    data: { type: "like", postId: record.post_id },
    avatarUrl: actor.avatar_url,
  };
}
