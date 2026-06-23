import { profileName, type Db, type ResolvedNotification } from "../../_shared/expo-push.ts";

interface PostRecord {
  id: string;
  author_id: string;
}

export async function newPost(
  client: Db,
  record: PostRecord
): Promise<ResolvedNotification | null> {
  // Skip Hang-carrier posts — Hangs emit their own push. On a lookup error, skip
  // rather than risk a duplicate push alongside the Hang notification.
  const { data: hang, error: hangError } = await client
    .from("hangs")
    .select("id")
    .eq("post_id", record.id)
    .maybeSingle();
  if (hangError) {
    console.error("newPost hang-check error:", hangError.message ?? hangError);
    return null;
  }
  if (hang) return null;

  const [recipientsRes, author] = await Promise.all([
    client.rpc("get_post_notification_recipients", { p_post_id: record.id }),
    profileName(client, record.author_id),
  ]);
  if (recipientsRes.error) {
    console.error("newPost recipients error:", recipientsRes.error.message ?? recipientsRes.error);
  }
  const recipients = (recipientsRes.data ?? []).map((r: { user_id: string }) => r.user_id);
  if (recipients.length === 0) return null;

  return {
    recipients,
    title: author.full_name,
    body: `${author.full_name} posted`,
    data: { type: "post", postId: record.id },
    avatarUrl: author.avatar_url,
  };
}
