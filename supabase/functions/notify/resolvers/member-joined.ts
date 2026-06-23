import { profileName, type Db, type ResolvedNotification } from "../../_shared/expo-push.ts";

interface ProfileRecord {
  id: string;
  invited_by: string | null;
}

export async function memberJoined(
  client: Db,
  record: ProfileRecord
): Promise<ResolvedNotification | null> {
  if (!record.invited_by) return null;
  const member = await profileName(client, record.id);
  return {
    recipients: [record.invited_by],
    title: member.full_name,
    body: `${member.full_name} joined your planet`,
    data: { type: "member_joined", memberId: record.id },
    avatarUrl: member.avatar_url,
  };
}
