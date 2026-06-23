import { type Db, type ResolvedNotification } from "../../_shared/expo-push.ts";

export async function invitesRefreshed(client: Db): Promise<ResolvedNotification | null> {
  const { data } = await client.rpc("get_invite_refresh_recipients", {});
  const recipients = (data ?? []).map((r: { user_id: string }) => r.user_id);
  if (recipients.length === 0) return null;
  return {
    recipients,
    title: "Tiny Planet",
    body: "Your invites have refreshed",
    data: { type: "invites_refreshed" },
  };
}
