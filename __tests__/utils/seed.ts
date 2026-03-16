import { adminClient } from "./supabase-test-client";

export interface TestUser {
  id: string;
  email: string;
  full_name: string;
}

/** Create a test user in auth.users + public.profiles. Returns user id. */
export async function createTestUser(
  overrides: Partial<{
    full_name: string;
    avatar_url: string;
    location_lng: number;
    location_lat: number;
    hometown: string;
  }> = {}
): Promise<TestUser> {
  const id = crypto.randomUUID();
  const email = `test-${id}@test.local`;
  const full_name = overrides.full_name ?? `Test User ${id.slice(0, 6)}`;

  // Create auth user via admin API
  const { data: authUser, error: authError } =
    await adminClient.auth.admin.createUser({
      email,
      password: "test-password-123",
      email_confirm: true,
      user_metadata: { full_name },
    });
  if (authError) throw authError;

  const userId = authUser.user.id;

  // Create profile
  const profileData: Record<string, unknown> = {
    id: userId,
    full_name,
    avatar_url: overrides.avatar_url ?? null,
    hometown: overrides.hometown ?? null,
  };
  if (overrides.location_lng != null && overrides.location_lat != null) {
    profileData.location = `POINT(${overrides.location_lng} ${overrides.location_lat})`;
  }

  const { error: profileError } = await adminClient
    .from("profiles")
    .upsert(profileData);
  if (profileError) throw profileError;

  return { id: userId, email, full_name };
}

/** Create an accepted friendship between two users. */
export async function createFriendship(userA: string, userB: string) {
  const [user_a, user_b] = userA < userB ? [userA, userB] : [userB, userA];
  const { error } = await adminClient.from("friendships").insert({
    user_a,
    user_b,
    requested_by: userA,
    status: "accepted",
    accepted_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/** Create a post for a user. Returns post id. */
export async function createTestPost(
  authorId: string,
  overrides: Partial<{
    text: string;
    visibility: string;
    media_urls: string[];
  }> = {}
) {
  const { data, error } = await adminClient
    .from("posts")
    .insert({
      author_id: authorId,
      text: overrides.text ?? "Test post",
      visibility: overrides.visibility ?? "friends",
      media_urls: overrides.media_urls ?? [],
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

/** Create a like on a post. */
export async function createTestLike(userId: string, postId: string) {
  const { error } = await adminClient.from("likes").insert({
    user_id: userId,
    post_id: postId,
    comment_id: null,
  });
  if (error) throw error;
}

/** Create a comment on a post. Returns comment id. */
export async function createTestComment(
  userId: string,
  postId: string,
  text = "Test comment"
) {
  const { data, error } = await adminClient
    .from("comments")
    .insert({ user_id: userId, post_id: postId, text })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

/** Create a message between two users. Returns message id. */
export async function createTestMessage(
  senderId: string,
  receiverId: string,
  text = "Hello"
) {
  const [user_id_a, user_id_b] =
    senderId < receiverId ? [senderId, receiverId] : [receiverId, senderId];
  const { data, error } = await adminClient
    .from("messages")
    .insert({ user_id_a, user_id_b, sender_id: senderId, text })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

/** Create a vibe (emoji reaction). */
export async function createTestVibe(
  giverId: string,
  receiverId: string,
  emojis: string[]
) {
  const { error } = await adminClient.from("vibes").insert({
    giver_id: giverId,
    receiver_id: receiverId,
    emojis,
  });
  if (error) throw error;
}

/** Create a list. Returns list id. */
export async function createTestList(
  userId: string,
  overrides: Partial<{
    title: string;
    location_name: string;
    location_lng: number;
    location_lat: number;
  }> = {}
) {
  const listData: Record<string, unknown> = {
    user_id: userId,
    title: overrides.title ?? "Test List",
    location_name: overrides.location_name ?? null,
  };
  if (overrides.location_lng != null && overrides.location_lat != null) {
    listData.location = `POINT(${overrides.location_lng} ${overrides.location_lat})`;
  }
  const { data, error } = await adminClient
    .from("lists")
    .insert(listData)
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

/** Create a saved_posts entry. */
export async function createTestSavedPost(userId: string, postId: string) {
  const { error } = await adminClient.from("saved_posts").insert({
    user_id: userId,
    post_id: postId,
  });
  if (error) throw error;
}

/** Create a contact for a user. Returns contact id. */
export async function createTestContact(
  userId: string,
  overrides: Partial<{
    name: string;
    phone: string;
    location_lng: number;
    location_lat: number;
    location_name: string;
  }> = {}
) {
  const contactData: Record<string, unknown> = {
    user_id: userId,
    name: overrides.name ?? "Test Contact",
    phone: overrides.phone ?? null,
  };
  if (overrides.location_lng != null && overrides.location_lat != null) {
    contactData.location = `POINT(${overrides.location_lng} ${overrides.location_lat})`;
    contactData.location_name = overrides.location_name ?? "Test Location";
  }
  const { data, error } = await adminClient
    .from("contacts")
    .insert(contactData)
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

/** Delete all test data for given user IDs. Call in afterAll. */
export async function cleanupTestData(userIds: string[]) {
  // Delete in reverse dependency order
  for (const userId of userIds) {
    await adminClient.from("saved_posts").delete().eq("user_id", userId);
    await adminClient
      .from("vibes")
      .delete()
      .or(`giver_id.eq.${userId},receiver_id.eq.${userId}`);
    await adminClient.from("likes").delete().eq("user_id", userId);
    await adminClient.from("comments").delete().eq("user_id", userId);
    await adminClient.from("travel_plans").delete().eq("user_id", userId);
    await adminClient
      .from("messages")
      .delete()
      .or(`user_id_a.eq.${userId},user_id_b.eq.${userId}`);
    await adminClient
      .from("list_places")
      .delete()
      .in(
        "list_id",
        (
          await adminClient.from("lists").select("id").eq("user_id", userId)
        ).data?.map((l) => l.id) ?? []
      );
    await adminClient.from("lists").delete().eq("user_id", userId);
    await adminClient.from("contacts").delete().eq("user_id", userId);
    await adminClient
      .from("invite_codes")
      .delete()
      .or(`created_by.eq.${userId},redeemed_by.eq.${userId}`);
    await adminClient.from("posts").delete().eq("author_id", userId);
    await adminClient
      .from("conversation_reads")
      .delete()
      .eq("user_id", userId);
  }

  // Delete friendships involving any test user
  for (const userId of userIds) {
    await adminClient
      .from("friendships")
      .delete()
      .or(`user_a.eq.${userId},user_b.eq.${userId}`);
  }

  // Delete profiles, then auth users
  for (const userId of userIds) {
    await adminClient.from("profiles").delete().eq("id", userId);
    await adminClient.auth.admin.deleteUser(userId);
  }
}
