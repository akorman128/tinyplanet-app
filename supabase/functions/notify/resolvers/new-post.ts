import { profileName, type Db, type ResolvedNotification } from "../../_shared/expo-push.ts";

interface PostRecord {
  id: string;
  author_id: string;
}

export async function newPost(
  client: Db,
  record: PostRecord
): Promise<ResolvedNotification | null> {
  // Exclude Hang-carrier posts — Hangs already emit their own push. Post + hang
  // are created in one transaction (create_hang_with_post), so by the time this
  // post-commit webhook runs, the hangs row is visible.
  const { data: hang } = await client.from("hangs").select("id").eq("post_id", record.id).maybeSingle();
  if (hang) return null;

  const { data: rows } = await client.rpc("get_post_notification_recipients", { p_post_id: record.id });
  const recipients = (rows ?? []).map((r: { user_id: string }) => r.user_id);
  if (recipients.length === 0) return null;

  const author = await profileName(client, record.author_id);
  return {
    recipients,
    title: author.full_name,
    body: `${author.full_name} posted`,
    data: { type: "post", postId: record.id },
    avatarUrl: author.avatar_url,
  };
}
