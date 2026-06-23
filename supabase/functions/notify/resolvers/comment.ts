import { profileName, type Db, type ResolvedNotification } from "../../_shared/expo-push.ts";

interface CommentRecord {
  id: string;
  post_id: string;
  author_id: string;
}

export async function comment(
  client: Db,
  record: CommentRecord
): Promise<ResolvedNotification | null> {
  const { data: post } = await client.from("posts").select("author_id").eq("id", record.post_id).single();
  if (!post) return null;
  const ownerId = post.author_id as string;
  if (ownerId === record.author_id) return null; // skip self-comment
  const actor = await profileName(client, record.author_id);
  return {
    recipients: [ownerId],
    title: actor.full_name,
    body: `${actor.full_name} commented on your post`,
    data: { type: "comment", postId: record.post_id, commentId: record.id },
    avatarUrl: actor.avatar_url,
  };
}
