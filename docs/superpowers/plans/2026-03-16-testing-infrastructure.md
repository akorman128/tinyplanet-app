# Testing Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up Vitest testing infrastructure with RPC integration tests against local Supabase and hook unit tests with mocked Supabase client.

**Architecture:** Two test suites — RPC integration tests hit the real local Supabase DB (seeded per-test), hook unit tests mock the Supabase client and test TanStack Query behavior. Shared test utilities provide factories, mock builders, and auth helpers.

**Tech Stack:** Vitest, @testing-library/react, TanStack Query v5, @supabase/supabase-js, local Supabase dev stack

---

## File Structure

```
__tests__/
├── setup.ts                          # Global Vitest setup (env, polyfills)
├── utils/
│   ├── supabase-test-client.ts       # Real Supabase client for RPC tests
│   ├── mock-supabase.ts              # Mock Supabase client builder for hook tests
│   ├── test-wrapper.tsx              # React wrapper with QueryClient + SupabaseContext
│   ├── seed.ts                       # Seed/cleanup helpers for integration tests
│   └── auth-helpers.ts               # Auth context simulators
├── rpc/
│   ├── feed.test.ts                  # get_feed_posts, get_user_posts
│   ├── profile.test.ts              # get_profile
│   ├── travel-plans.test.ts         # create/update/cancel_travel_plan_with_post
│   ├── friends.test.ts              # friend location RPCs, search, mutuals
│   ├── messages.test.ts             # get_message_channels, has_unread_messages
│   ├── lists.test.ts               # get_lists_with_places, get_list_places_with_coordinates
│   ├── saved-posts.test.ts         # get_saved_posts
│   ├── vibes.test.ts               # get_top_vibes
│   └── contacts.test.ts            # get_contacts_ordered
├── hooks/
│   ├── useFeed.test.ts
│   ├── usePosts.test.ts
│   ├── useComments.test.ts
│   ├── useLikes.test.ts
│   ├── useSavedPosts.test.ts
│   ├── useProfile.test.ts
│   ├── useFriends.test.ts
│   ├── useChat.test.ts
│   ├── useMessageChannels.test.ts
│   ├── useTravelPlan.test.ts
│   ├── useLists.test.ts
│   ├── useVibe.test.ts
│   ├── useContacts.test.ts
│   └── useInviteCodes.test.ts
vitest.config.ts                      # Vitest config with path aliases
.env.test                             # Local Supabase credentials
```

---

## Chunk 1: Environment Setup (Tasks 1-3)

### Task 1: Install dependencies and configure Vitest

**Files:**
- Modify: `package.json` (add devDependencies + scripts)
- Create: `vitest.config.ts`
- Create: `.env.test`
- Modify: `.gitignore` (add .env.test)

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D vitest @testing-library/react @testing-library/react-native jsdom dotenv
```

- [ ] **Step 2: Create vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./__tests__/setup.ts"],
    include: ["__tests__/**/*.test.ts", "__tests__/**/*.test.tsx"],
    env: {
      DOTENV_CONFIG_PATH: ".env.test",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 3: Create .env.test with local Supabase credentials**

```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WO_o0BQJlmVfE1-Uc2mA38k5HJaB3GJLqMbs
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

Note: These are the default local Supabase dev keys — safe to use.

- [ ] **Step 4: Add .env.test to .gitignore**

Append `.env.test` to the end of `.gitignore`.

- [ ] **Step 5: Add npm scripts to package.json**

Add these scripts:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:rpc": "vitest run __tests__/rpc/",
"test:hooks": "vitest run __tests__/hooks/"
```

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts .gitignore package.json package-lock.json
git commit -m "chore: add Vitest testing infrastructure"
```

---

### Task 2: Create global test setup and Supabase test client

**Files:**
- Create: `__tests__/setup.ts`
- Create: `__tests__/utils/supabase-test-client.ts`

- [ ] **Step 1: Create __tests__/setup.ts**

```ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

// Polyfill for React Native modules that don't exist in jsdom
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock("expo-haptics", () => ({
  impactAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
}));

vi.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: vi.fn(),
  getCurrentPositionAsync: vi.fn(),
}));
```

- [ ] **Step 2: Create __tests__/utils/supabase-test-client.ts**

```ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

/** Service-role client — bypasses RLS. Use for seeding and cleanup. */
export const adminClient: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

/** Anon client — subject to RLS. Use for testing permission behavior. */
export const anonClient: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/** Create a client authenticated as a specific user via service role JWT override. */
export const createAuthenticatedClient = (accessToken: string): SupabaseClient =>
  createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
```

- [ ] **Step 3: Run Vitest to verify setup**

Run: `npx vitest run --passWithNoTests`
Expected: PASS (no tests found, exits clean)

- [ ] **Step 4: Commit**

```bash
git add __tests__/
git commit -m "chore: add test setup and Supabase test clients"
```

---

### Task 3: Create seed/cleanup helpers and mock Supabase builder

**Files:**
- Create: `__tests__/utils/seed.ts`
- Create: `__tests__/utils/mock-supabase.ts`
- Create: `__tests__/utils/test-wrapper.tsx`
- Create: `__tests__/utils/auth-helpers.ts`

- [ ] **Step 1: Create __tests__/utils/seed.ts**

```ts
import { adminClient } from "./supabase-test-client";

export interface TestUser {
  id: string;
  email: string;
  full_name: string;
}

/** Create a test user in auth.users + public.profiles. Returns user id. */
export async function createTestUser(overrides: Partial<{ full_name: string; avatar_url: string; location_lng: number; location_lat: number; hometown: string }> = {}): Promise<TestUser> {
  const id = crypto.randomUUID();
  const email = `test-${id}@test.local`;
  const full_name = overrides.full_name ?? `Test User ${id.slice(0, 6)}`;

  // Create auth user via admin API
  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
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
export async function createTestPost(authorId: string, overrides: Partial<{ text: string; visibility: string; media_urls: string[] }> = {}) {
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
export async function createTestComment(userId: string, postId: string, text = "Test comment") {
  const { data, error } = await adminClient
    .from("comments")
    .insert({ user_id: userId, post_id: postId, text })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

/** Create a message between two users. Returns message id. */
export async function createTestMessage(senderId: string, receiverId: string, text = "Hello") {
  const [user_id_a, user_id_b] = senderId < receiverId ? [senderId, receiverId] : [receiverId, senderId];
  const { data, error } = await adminClient
    .from("messages")
    .insert({ user_id_a, user_id_b, sender_id: senderId, text })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

/** Create a vibe (emoji reaction). */
export async function createTestVibe(senderId: string, recipientId: string, emojis: string[]) {
  const { error } = await adminClient.from("vibes").insert({
    sender_id: senderId,
    recipient_id: recipientId,
    emojis,
  });
  if (error) throw error;
}

/** Create a list with optional places. Returns list id. */
export async function createTestList(userId: string, overrides: Partial<{ title: string; location_name: string; location_lng: number; location_lat: number }> = {}) {
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
export async function createTestContact(userId: string, overrides: Partial<{ name: string; phone: string; location_lng: number; location_lat: number; location_name: string }> = {}) {
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

// --- Cleanup ---

/** Track created resources for cleanup. */
const createdIds: { table: string; id: string }[] = [];

export function trackForCleanup(table: string, id: string) {
  createdIds.push({ table, id });
}

/** Delete all test data. Call in afterEach/afterAll. */
export async function cleanupTestData(userIds: string[]) {
  // Delete in reverse dependency order
  for (const userId of userIds) {
    await adminClient.from("saved_posts").delete().eq("user_id", userId);
    await adminClient.from("vibes").delete().or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
    await adminClient.from("likes").delete().eq("user_id", userId);
    await adminClient.from("comments").delete().eq("user_id", userId);
    await adminClient.from("travel_plans").delete().eq("user_id", userId);
    await adminClient.from("messages").delete().or(`user_id_a.eq.${userId},user_id_b.eq.${userId}`);
    await adminClient.from("list_places").delete().in("list_id",
      (await adminClient.from("lists").select("id").eq("user_id", userId)).data?.map(l => l.id) ?? []
    );
    await adminClient.from("lists").delete().eq("user_id", userId);
    await adminClient.from("contacts").delete().eq("user_id", userId);
    await adminClient.from("invite_codes").delete().or(`created_by.eq.${userId},redeemed_by.eq.${userId}`);
    await adminClient.from("posts").delete().eq("author_id", userId);
    await adminClient.from("conversation_reads").delete().eq("user_id", userId);
  }

  // Delete friendships involving any test user
  for (const userId of userIds) {
    await adminClient.from("friendships").delete().or(`user_a.eq.${userId},user_b.eq.${userId}`);
  }

  // Delete profiles, then auth users
  for (const userId of userIds) {
    await adminClient.from("profiles").delete().eq("id", userId);
    await adminClient.auth.admin.deleteUser(userId);
  }
}
```

- [ ] **Step 2: Create __tests__/utils/mock-supabase.ts**

```ts
import { vi } from "vitest";

type MockResponse<T = unknown> = { data: T; error: null } | { data: null; error: { message: string; code?: string } };

interface ChainableMock {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
}

/**
 * Build a mock Supabase client for hook unit tests.
 *
 * Usage:
 *   const mock = createMockSupabase();
 *   mock.configureFrom("posts", { data: [...], error: null });
 *   mock.configureRpc("get_feed_posts", { data: [...], error: null });
 */
export function createMockSupabase() {
  const rpcResponses = new Map<string, MockResponse>();
  const fromResponses = new Map<string, MockResponse>();

  const createChain = (resolvedValue: MockResponse): ChainableMock => {
    const chain: ChainableMock = {} as ChainableMock;
    const methods = ["select", "insert", "update", "delete", "upsert", "eq", "or", "in", "is", "gte", "lte", "order", "limit"];
    for (const m of methods) {
      (chain as any)[m] = vi.fn().mockReturnValue(chain);
    }
    chain.single = vi.fn().mockResolvedValue(resolvedValue);
    chain.maybeSingle = vi.fn().mockResolvedValue(resolvedValue);

    // Make the chain itself thenable (for queries without .single())
    (chain as any).then = (onFulfilled?: any, onRejected?: any) =>
      Promise.resolve(resolvedValue).then(onFulfilled, onRejected);
    return chain;
  };

  // Track the last chain created per table for argument assertions
  const lastChains = new Map<string, ChainableMock>();

  const client = {
    from: vi.fn((table: string) => {
      const response = fromResponses.get(table) ?? { data: [], error: null };
      const chain = createChain(response);
      lastChains.set(table, chain);
      return chain;
    }),
    /** Get the last chain created for a table, to assert on chain method args. */
    getLastChain(table: string) { return lastChains.get(table); },
    rpc: vi.fn((fnName: string, _params?: Record<string, unknown>) => {
      const response = rpcResponses.get(fnName) ?? { data: null, error: null };
      return Promise.resolve(response);
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithOtp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      verifyOtp: vi.fn().mockResolvedValue({ data: { session: {} }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { session: {} }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
      send: vi.fn().mockResolvedValue("ok"),
    }),
    removeChannel: vi.fn(),

    // Configuration helpers (not part of real client)
    configureRpc(fnName: string, response: MockResponse) {
      rpcResponses.set(fnName, response);
    },
    configureFrom(table: string, response: MockResponse) {
      fromResponses.set(table, response);
    },
  };

  return client;
}

export type MockSupabaseClient = ReturnType<typeof createMockSupabase>;
```

- [ ] **Step 3: Create __tests__/utils/test-wrapper.tsx**

```tsx
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SupabaseContext } from "@/context/supabase-context";
import type { MockSupabaseClient } from "./mock-supabase";

interface WrapperProps {
  children: React.ReactNode;
}

/**
 * Creates a test wrapper with QueryClient + SupabaseContext.
 * Each test gets a fresh QueryClient to avoid cache leaks.
 */
export function createTestWrapper(mockSupabase: MockSupabaseClient) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={queryClient}>
        <SupabaseContext.Provider value={mockSupabase as any}>
          {children}
        </SupabaseContext.Provider>
      </QueryClientProvider>
    );
  }

  return { Wrapper, queryClient };
}
```

- [ ] **Step 4: Create __tests__/utils/auth-helpers.ts**

```ts
import { createClient } from "@supabase/supabase-js";
import { adminClient } from "./supabase-test-client";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

/**
 * Create an authenticated Supabase client for a test user.
 * Useful for testing RLS policies — the returned client has the user's JWT.
 */
export async function createAuthenticatedClientForUser(email: string, password = "test-password-123") {
  // Sign in via the anon client to get a real JWT
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await anonClient.auth.signInWithPassword({ email, password });
  if (error) throw error;

  // Return a client with the user's access token
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
  });
}
```

- [ ] **Step 5: Verify all utils compile**

Run: `npx vitest run --passWithNoTests`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add __tests__/
git commit -m "chore: add test utilities — seed helpers, mock builder, wrapper"
```

---

## Chunk 2: RPC Integration Tests — Travel Plans & Feed (Tasks 4-5)

### Task 4: RPC integration tests — Travel Plans

**Files:**
- Create: `__tests__/rpc/travel-plans.test.ts`

- [ ] **Step 1: Write travel plan RPC tests**

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { adminClient } from "../utils/supabase-test-client";
import { createTestUser, createFriendship, cleanupTestData, TestUser } from "../utils/seed";

describe("Travel Plan RPCs", () => {
  let userA: TestUser;
  let userB: TestUser;

  beforeAll(async () => {
    userA = await createTestUser({ full_name: "Travel User A", location_lng: -73.9857, location_lat: 40.7484 });
    userB = await createTestUser({ full_name: "Travel User B", location_lng: -0.1276, location_lat: 51.5074 });
    await createFriendship(userA.id, userB.id);
  });

  afterAll(async () => {
    await cleanupTestData([userA.id, userB.id]);
  });

  describe("create_travel_plan_with_post", () => {
    it("creates a travel plan and associated post", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startDate = tomorrow.toISOString().split("T")[0];

      const { data, error } = await adminClient.rpc("create_travel_plan_with_post", {
        p_user_id: userA.id,
        p_destination_location_lng: 2.3522,
        p_destination_location_lat: 48.8566,
        p_destination_name: "Paris",
        p_start_date: startDate,
        p_duration_days: 7,
        p_post_visibility: "friends",
        p_text: null,
      });

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0]).toMatchObject({
        destination_name: "Paris",
        start_date: startDate,
      });
      expect(data![0].travel_plan_id).toBeTruthy();
      expect(data![0].post_id).toBeTruthy();

      // Verify post was actually created
      const { data: post } = await adminClient
        .from("posts")
        .select("*")
        .eq("id", data![0].post_id)
        .single();
      expect(post).toBeTruthy();
      expect(post!.author_id).toBe(userA.id);
      expect(post!.visibility).toBe("friends");

      // Cleanup
      await adminClient.rpc("cancel_travel_plan_with_post", { p_travel_plan_id: data![0].travel_plan_id });
    });

    it("rejects duration outside 1-31 range", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { error } = await adminClient.rpc("create_travel_plan_with_post", {
        p_user_id: userA.id,
        p_destination_location_lng: 2.3522,
        p_destination_location_lat: 48.8566,
        p_destination_name: "Paris",
        p_start_date: tomorrow.toISOString().split("T")[0],
        p_duration_days: 50,
        p_post_visibility: "friends",
        p_text: null,
      });

      expect(error).not.toBeNull();
    });

    it("prevents overlapping travel plans", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startDate = tomorrow.toISOString().split("T")[0];

      // Create first plan
      const { data: first } = await adminClient.rpc("create_travel_plan_with_post", {
        p_user_id: userA.id,
        p_destination_location_lng: 2.3522,
        p_destination_location_lat: 48.8566,
        p_destination_name: "Paris",
        p_start_date: startDate,
        p_duration_days: 7,
        p_post_visibility: "friends",
        p_text: null,
      });

      // Try to create overlapping plan
      const { error } = await adminClient.rpc("create_travel_plan_with_post", {
        p_user_id: userA.id,
        p_destination_location_lng: 139.6917,
        p_destination_location_lat: 35.6895,
        p_destination_name: "Tokyo",
        p_start_date: startDate,
        p_duration_days: 5,
        p_post_visibility: "friends",
        p_text: null,
      });

      expect(error).not.toBeNull();

      // Cleanup
      await adminClient.rpc("cancel_travel_plan_with_post", { p_travel_plan_id: first![0].travel_plan_id });
    });

    it("creates plan with custom post text", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startDate = tomorrow.toISOString().split("T")[0];

      const { data } = await adminClient.rpc("create_travel_plan_with_post", {
        p_user_id: userA.id,
        p_destination_location_lng: 2.3522,
        p_destination_location_lat: 48.8566,
        p_destination_name: "Paris",
        p_start_date: startDate,
        p_duration_days: 3,
        p_post_visibility: "friends",
        p_text: "So excited for this trip!",
      });

      const { data: post } = await adminClient
        .from("posts")
        .select("text")
        .eq("id", data![0].post_id)
        .single();
      expect(post!.text).toContain("So excited for this trip!");

      await adminClient.rpc("cancel_travel_plan_with_post", { p_travel_plan_id: data![0].travel_plan_id });
    });
  });

  describe("update_travel_plan_with_post", () => {
    it("updates destination and syncs post", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startDate = tomorrow.toISOString().split("T")[0];

      const { data: created } = await adminClient.rpc("create_travel_plan_with_post", {
        p_user_id: userA.id,
        p_destination_location_lng: 2.3522,
        p_destination_location_lat: 48.8566,
        p_destination_name: "Paris",
        p_start_date: startDate,
        p_duration_days: 5,
        p_post_visibility: "friends",
        p_text: null,
      });

      const { data: updated, error } = await adminClient.rpc("update_travel_plan_with_post", {
        p_travel_plan_id: created![0].travel_plan_id,
        p_destination_location_lng: 139.6917,
        p_destination_location_lat: 35.6895,
        p_destination_name: "Tokyo",
        p_start_date: startDate,
        p_duration_days: 10,
        p_post_visibility: null,
        p_text: null,
      });

      expect(error).toBeNull();
      expect(updated![0].destination_name).toBe("Tokyo");

      await adminClient.rpc("cancel_travel_plan_with_post", { p_travel_plan_id: created![0].travel_plan_id });
    });
  });

  describe("cancel_travel_plan_with_post", () => {
    it("deletes plan and associated post", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: created } = await adminClient.rpc("create_travel_plan_with_post", {
        p_user_id: userA.id,
        p_destination_location_lng: 2.3522,
        p_destination_location_lat: 48.8566,
        p_destination_name: "Paris",
        p_start_date: tomorrow.toISOString().split("T")[0],
        p_duration_days: 3,
        p_post_visibility: "friends",
        p_text: null,
      });

      const planId = created![0].travel_plan_id;
      const postId = created![0].post_id;

      const { error } = await adminClient.rpc("cancel_travel_plan_with_post", { p_travel_plan_id: planId });
      expect(error).toBeNull();

      // Verify both are deleted
      const { data: plan } = await adminClient.from("travel_plans").select("id").eq("id", planId).maybeSingle();
      expect(plan).toBeNull();

      const { data: post } = await adminClient.from("posts").select("id").eq("id", postId).maybeSingle();
      expect(post).toBeNull();
    });
  });

  describe("get_travel_plan_by_post_id", () => {
    it("returns travel plan by its associated post", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: created } = await adminClient.rpc("create_travel_plan_with_post", {
        p_user_id: userA.id,
        p_destination_location_lng: 2.3522,
        p_destination_location_lat: 48.8566,
        p_destination_name: "Paris",
        p_start_date: tomorrow.toISOString().split("T")[0],
        p_duration_days: 5,
        p_post_visibility: "friends",
        p_text: null,
      });

      const { data, error } = await adminClient.rpc("get_travel_plan_by_post_id", {
        p_post_id: created![0].post_id,
      });

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].destination_name).toBe("Paris");
      expect(data![0].longitude).toBeCloseTo(2.3522, 2);
      expect(data![0].latitude).toBeCloseTo(48.8566, 2);

      await adminClient.rpc("cancel_travel_plan_with_post", { p_travel_plan_id: created![0].travel_plan_id });
    });

    it("returns empty for non-existent post", async () => {
      const { data, error } = await adminClient.rpc("get_travel_plan_by_post_id", {
        p_post_id: "00000000-0000-0000-0000-000000000000",
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });
  });

  describe("get_active_travel_plan_locations", () => {
    it("returns friend travel plan locations", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: created } = await adminClient.rpc("create_travel_plan_with_post", {
        p_user_id: userB.id,
        p_destination_location_lng: 2.3522,
        p_destination_location_lat: 48.8566,
        p_destination_name: "Paris",
        p_start_date: tomorrow.toISOString().split("T")[0],
        p_duration_days: 7,
        p_post_visibility: "friends",
        p_text: null,
      });

      const { data, error } = await adminClient.rpc("get_active_travel_plan_locations", {
        p_user_id: userA.id,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      // userB's plan should be visible to userA (they're friends)
      const friendPlan = data?.find((d: any) => d.user_id === userB.id);
      expect(friendPlan).toBeTruthy();
      expect(friendPlan.destination_name).toBe("Paris");

      await adminClient.rpc("cancel_travel_plan_with_post", { p_travel_plan_id: created![0].travel_plan_id });
    });
  });
});
```

- [ ] **Step 2: Run travel plan RPC tests**

Run: `npx vitest run __tests__/rpc/travel-plans.test.ts`
Expected: All tests PASS (requires `supabase start` running)

- [ ] **Step 3: Commit**

```bash
git add __tests__/rpc/travel-plans.test.ts
git commit -m "test: add travel plan RPC integration tests"
```

---

### Task 5: RPC integration tests — Feed

**Files:**
- Create: `__tests__/rpc/feed.test.ts`

- [ ] **Step 1: Write feed RPC tests**

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { adminClient } from "../utils/supabase-test-client";
import {
  createTestUser, createFriendship, createTestPost, createTestLike,
  createTestComment, createTestSavedPost, cleanupTestData, TestUser,
} from "../utils/seed";

describe("Feed RPCs", () => {
  let userA: TestUser;
  let userB: TestUser;
  let userC: TestUser; // not a friend of A
  let postByB: string;
  let postByA: string;
  let postByC: string;

  beforeAll(async () => {
    userA = await createTestUser({ full_name: "Feed User A" });
    userB = await createTestUser({ full_name: "Feed User B" });
    userC = await createTestUser({ full_name: "Feed User C" });

    await createFriendship(userA.id, userB.id);
    // userC is NOT friends with userA

    postByB = await createTestPost(userB.id, { text: "Post by B", visibility: "friends" });
    postByA = await createTestPost(userA.id, { text: "Post by A", visibility: "friends" });
    postByC = await createTestPost(userC.id, { text: "Post by C", visibility: "friends" });

    await createTestLike(userA.id, postByB);
    await createTestComment(userA.id, postByB, "Nice post!");
    await createTestSavedPost(userA.id, postByB);
  });

  afterAll(async () => {
    await cleanupTestData([userA.id, userB.id, userC.id]);
  });

  describe("get_feed_posts", () => {
    it("returns posts with correct shape", async () => {
      const { data, error } = await adminClient.rpc("get_feed_posts", {
        user_id_param: userA.id,
        limit_param: 10,
        offset_param: 0,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);

      const post = data!.find((p: any) => p.id === postByB);
      expect(post).toBeTruthy();
      expect(post.author).toMatchObject({
        id: userB.id,
        full_name: "Feed User B",
      });
      expect(post.like_count).toBeGreaterThanOrEqual(1);
      expect(post.comment_count).toBeGreaterThanOrEqual(1);
      expect(post.liked_by_user).toBe(true);
      expect(post.saved_by_user).toBe(true);
    });

    it("respects pagination", async () => {
      // Create enough posts to test pagination
      const extraPosts: string[] = [];
      for (let i = 0; i < 5; i++) {
        extraPosts.push(await createTestPost(userB.id, { text: `Paginated ${i}` }));
      }

      const { data: page1 } = await adminClient.rpc("get_feed_posts", {
        user_id_param: userA.id,
        limit_param: 3,
        offset_param: 0,
      });

      const { data: page2 } = await adminClient.rpc("get_feed_posts", {
        user_id_param: userA.id,
        limit_param: 3,
        offset_param: 3,
      });

      expect(page1).toHaveLength(3);
      expect(page2!.length).toBeGreaterThan(0);

      // No overlap between pages
      const page1Ids = new Set(page1!.map((p: any) => p.id));
      for (const p of page2!) {
        expect(page1Ids.has((p as any).id)).toBe(false);
      }

      // Cleanup extra posts
      for (const id of extraPosts) {
        await adminClient.from("posts").delete().eq("id", id);
      }
    });

    it("excludes posts from non-friends", async () => {
      const { data } = await adminClient.rpc("get_feed_posts", {
        user_id_param: userA.id,
        limit_param: 50,
        offset_param: 0,
      });

      // userC is NOT friends with userA, so their friends-only post should be excluded
      const postFromC = data!.find((p: any) => p.id === postByC);
      expect(postFromC).toBeUndefined();
    });

    it("marks unliked posts correctly", async () => {
      const { data } = await adminClient.rpc("get_feed_posts", {
        user_id_param: userA.id,
        limit_param: 50,
        offset_param: 0,
      });

      const ownPost = data!.find((p: any) => p.id === postByA);
      if (ownPost) {
        expect(ownPost.liked_by_user).toBe(false);
        expect(ownPost.saved_by_user).toBe(false);
      }
    });
  });

  describe("get_user_posts", () => {
    it("returns only posts by the target user", async () => {
      const { data, error } = await adminClient.rpc("get_user_posts", {
        user_id_param: userA.id,
        target_user_id: userB.id,
        limit_param: 10,
        offset_param: 0,
      });

      expect(error).toBeNull();
      expect(data!.every((p: any) => p.author_id === userB.id)).toBe(true);
    });

    it("returns engagement metrics for target user posts", async () => {
      const { data } = await adminClient.rpc("get_user_posts", {
        user_id_param: userA.id,
        target_user_id: userB.id,
        limit_param: 10,
        offset_param: 0,
      });

      const post = data!.find((p: any) => p.id === postByB);
      expect(post).toBeTruthy();
      expect(typeof post.like_count).toBe("number");
      expect(typeof post.comment_count).toBe("number");
      expect(typeof post.liked_by_user).toBe("boolean");
    });
  });
});
```

- [ ] **Step 2: Run feed RPC tests**

Run: `npx vitest run __tests__/rpc/feed.test.ts`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add __tests__/rpc/feed.test.ts
git commit -m "test: add feed RPC integration tests"
```

---

## Chunk 3: RPC Integration Tests — Profile, Friends, Messages (Tasks 6-8)

### Task 6: RPC integration tests — Profile

**Files:**
- Create: `__tests__/rpc/profile.test.ts`

- [ ] **Step 1: Write profile RPC tests**

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { adminClient } from "../utils/supabase-test-client";
import { createTestUser, createFriendship, createTestPost, cleanupTestData, TestUser } from "../utils/seed";

describe("get_profile RPC", () => {
  let userA: TestUser;
  let userB: TestUser;
  let userC: TestUser;

  beforeAll(async () => {
    userA = await createTestUser({ full_name: "Profile User A", location_lng: -73.9857, location_lat: 40.7484 });
    userB = await createTestUser({ full_name: "Profile User B" });
    userC = await createTestUser({ full_name: "Profile User C" });

    await createFriendship(userA.id, userB.id);
    await createFriendship(userA.id, userC.id);
    await createFriendship(userB.id, userC.id); // mutual friend for A↔C via B

    await createTestPost(userA.id, { text: "Post 1" });
    await createTestPost(userA.id, { text: "Post 2" });
  });

  afterAll(async () => {
    await cleanupTestData([userA.id, userB.id, userC.id]);
  });

  it("returns profile with correct fields", async () => {
    const { data, error } = await adminClient.rpc("get_profile", {
      p_user_id: userA.id,
    });

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    const profile = data![0];
    expect(profile.full_name).toBe("Profile User A");
    expect(profile.id).toBe(userA.id);
    expect(profile.latitude).toBeCloseTo(40.7484, 2);
    expect(profile.longitude).toBeCloseTo(-73.9857, 2);
  });

  it("counts friends correctly", async () => {
    const { data } = await adminClient.rpc("get_profile", {
      p_user_id: userA.id,
    });
    // userA is friends with B and C
    expect(data![0].friend_count).toBe(2);
  });

  it("counts posts correctly", async () => {
    const { data } = await adminClient.rpc("get_profile", {
      p_user_id: userA.id,
    });
    expect(data![0].post_count).toBe(2);
  });

  it("computes mutual friends when p_current_user_id provided", async () => {
    // userB and userC are both friends with userA
    // userB↔userC friendship exists, so mutual between B viewing C's profile = [A]
    const { data } = await adminClient.rpc("get_profile", {
      p_user_id: userC.id,
      p_current_user_id: userB.id,
    });
    expect(data![0].mutual_friend_count).toBeGreaterThanOrEqual(1);
  });

  it("returns 0 mutual friends when p_current_user_id omitted", async () => {
    const { data } = await adminClient.rpc("get_profile", {
      p_user_id: userA.id,
    });
    expect(data![0].mutual_friend_count).toBe(0);
  });

  it("handles user with no location", async () => {
    const { data } = await adminClient.rpc("get_profile", {
      p_user_id: userB.id,
    });
    expect(data![0].latitude).toBeNull();
    expect(data![0].longitude).toBeNull();
  });
});
```

- [ ] **Step 2: Run and commit**

Run: `npx vitest run __tests__/rpc/profile.test.ts`

```bash
git add __tests__/rpc/profile.test.ts
git commit -m "test: add profile RPC integration tests"
```

---

### Task 7: RPC integration tests — Friends

**Files:**
- Create: `__tests__/rpc/friends.test.ts`

- [ ] **Step 1: Write friends RPC tests**

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { adminClient } from "../utils/supabase-test-client";
import { createTestUser, createFriendship, cleanupTestData, TestUser } from "../utils/seed";

describe("Friend RPCs", () => {
  let userA: TestUser;
  let userB: TestUser;
  let userC: TestUser;
  let userD: TestUser;

  beforeAll(async () => {
    userA = await createTestUser({ full_name: "Friend A", location_lng: -73.9857, location_lat: 40.7484 });
    userB = await createTestUser({ full_name: "Friend B", location_lng: -0.1276, location_lat: 51.5074 });
    userC = await createTestUser({ full_name: "Friend C", location_lng: 2.3522, location_lat: 48.8566 });
    userD = await createTestUser({ full_name: "Unconnected D" });

    // A↔B friends, B↔C friends (C is mutual of A through B)
    await createFriendship(userA.id, userB.id);
    await createFriendship(userB.id, userC.id);
  });

  afterAll(async () => {
    await cleanupTestData([userA.id, userB.id, userC.id, userD.id]);
  });

  describe("get_friend_locations", () => {
    it("returns direct friend locations", async () => {
      const { data, error } = await adminClient.rpc("get_friend_locations", { p_user_id: userA.id });
      expect(error).toBeNull();
      const friendB = data?.find((d: any) => d.id === userB.id);
      expect(friendB).toBeTruthy();
      expect(friendB.type).toBe("friend");
      expect(friendB.longitude).toBeCloseTo(-0.1276, 2);
    });

    it("excludes non-friends", async () => {
      const { data } = await adminClient.rpc("get_friend_locations", { p_user_id: userA.id });
      const unconnected = data?.find((d: any) => d.id === userD.id);
      expect(unconnected).toBeUndefined();
    });
  });

  describe("get_mutual_locations_with_connections", () => {
    it("returns friend-of-friend locations with connecting friend", async () => {
      const { data, error } = await adminClient.rpc("get_mutual_locations_with_connections", { p_user_id: userA.id });
      expect(error).toBeNull();
      const mutualC = data?.find((d: any) => d.id === userC.id);
      expect(mutualC).toBeTruthy();
      expect(mutualC.type).toBe("mutual");
      expect(mutualC.connecting_friend_id).toBe(userB.id);
    });
  });

  describe("search_friends", () => {
    it("finds friends by name (case-insensitive)", async () => {
      const { data, error } = await adminClient.rpc("search_friends", {
        p_user_id: userA.id,
        p_query: "friend b",
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].id).toBe(userB.id);
    });

    it("returns empty for non-matching query", async () => {
      const { data } = await adminClient.rpc("search_friends", {
        p_user_id: userA.id,
        p_query: "zzz_no_match",
      });
      expect(data).toHaveLength(0);
    });

    it("does not return non-friends", async () => {
      const { data } = await adminClient.rpc("search_friends", {
        p_user_id: userA.id,
        p_query: "Unconnected",
      });
      expect(data).toHaveLength(0);
    });
  });

  describe("get_mutual_friends_between_users", () => {
    it("returns shared friends", async () => {
      // A and C share B as a mutual friend
      const { data, error } = await adminClient.rpc("get_mutual_friends_between_users", {
        p_user_id: userA.id,
        p_target_user_id: userC.id,
      });
      expect(error).toBeNull();
      const shared = data?.find((d: any) => d.id === userB.id);
      expect(shared).toBeTruthy();
    });
  });

  describe("count_mutual_friends", () => {
    it("counts correctly", async () => {
      const { data, error } = await adminClient.rpc("count_mutual_friends", {
        p_user_id: userA.id,
        p_target_user_id: userC.id,
      });
      expect(error).toBeNull();
      expect(data).toBeGreaterThanOrEqual(1);
    });
  });

  describe("get_friend_hometown_locations", () => {
    it("returns friends and mutuals with hometowns", async () => {
      // Update userB with a hometown location
      await adminClient.from("profiles").update({
        hometown: "London",
        hometown_location: "POINT(-0.1276 51.5074)",
      }).eq("id", userB.id);

      const { data, error } = await adminClient.rpc("get_friend_hometown_locations", { p_user_id: userA.id });
      expect(error).toBeNull();
      const bHometown = data?.find((d: any) => d.id === userB.id);
      expect(bHometown).toBeTruthy();
      expect(bHometown.hometown_name).toBe("London");
    });

    it("excludes users without hometown_location", async () => {
      const { data } = await adminClient.rpc("get_friend_hometown_locations", { p_user_id: userA.id });
      // userD has no hometown set
      const dHometown = data?.find((d: any) => d.id === userD.id);
      expect(dHometown).toBeUndefined();
    });
  });

  describe("get_platform_statistics", () => {
    it("returns total users and connections", async () => {
      const { data, error } = await adminClient.rpc("get_platform_statistics", { p_user_id: userA.id });
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].total_users).toBeGreaterThanOrEqual(4);
      expect(data![0].connections_count).toBeGreaterThanOrEqual(1);
    });
  });
});
```

- [ ] **Step 2: Run and commit**

Run: `npx vitest run __tests__/rpc/friends.test.ts`

```bash
git add __tests__/rpc/friends.test.ts
git commit -m "test: add friends RPC integration tests"
```

---

### Task 8: RPC integration tests — Messages

**Files:**
- Create: `__tests__/rpc/messages.test.ts`

- [ ] **Step 1: Write message RPC tests**

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { adminClient } from "../utils/supabase-test-client";
import { createTestUser, createFriendship, createTestMessage, cleanupTestData, TestUser } from "../utils/seed";

describe("Message RPCs", () => {
  let userA: TestUser;
  let userB: TestUser;

  beforeAll(async () => {
    userA = await createTestUser({ full_name: "Msg User A" });
    userB = await createTestUser({ full_name: "Msg User B" });
    await createFriendship(userA.id, userB.id);

    // Create messages in both directions
    await createTestMessage(userA.id, userB.id, "Hello from A");
    await createTestMessage(userB.id, userA.id, "Reply from B");
    await createTestMessage(userB.id, userA.id, "Another from B");
  });

  afterAll(async () => {
    await cleanupTestData([userA.id, userB.id]);
  });

  describe("get_message_channels", () => {
    it("returns channels with last message", async () => {
      const { data, error } = await adminClient.rpc("get_message_channels", { p_user_id: userA.id });
      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThanOrEqual(1);

      const channel = data!.find((c: any) => c.friend_id === userB.id);
      expect(channel).toBeTruthy();
      expect(channel.full_name).toBe("Msg User B");
      expect(channel.last_message_text).toBeTruthy();
    });

    it("calculates unread count", async () => {
      const { data } = await adminClient.rpc("get_message_channels", { p_user_id: userA.id });
      const channel = data!.find((c: any) => c.friend_id === userB.id);
      // userB sent 2 messages, userA hasn't read them
      expect(channel.unread_count).toBeGreaterThanOrEqual(2);
    });

    it("returns empty for user with no friends", async () => {
      const loner = await createTestUser({ full_name: "Loner" });
      const { data, error } = await adminClient.rpc("get_message_channels", { p_user_id: loner.id });
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
      await cleanupTestData([loner.id]);
    });
  });

  describe("has_unread_messages", () => {
    it("returns true when there are unread messages", async () => {
      const { data, error } = await adminClient.rpc("has_unread_messages", { p_user_id: userA.id });
      expect(error).toBeNull();
      expect(data).toBe(true);
    });

    it("returns false after marking as read", async () => {
      // Mark conversation as read
      const [uid_a, uid_b] = userA.id < userB.id ? [userA.id, userB.id] : [userB.id, userA.id];
      await adminClient.from("conversation_reads").upsert({
        user_id: userA.id,
        user_id_a: uid_a,
        user_id_b: uid_b,
        last_read_at: new Date().toISOString(),
      });

      const { data } = await adminClient.rpc("has_unread_messages", { p_user_id: userA.id });
      expect(data).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run and commit**

Run: `npx vitest run __tests__/rpc/messages.test.ts`

```bash
git add __tests__/rpc/messages.test.ts
git commit -m "test: add message RPC integration tests"
```

---

## Chunk 4: RPC Integration Tests — Lists, Saved Posts, Vibes, Contacts (Tasks 9-12)

### Task 9: RPC integration tests — Lists

**Files:**
- Create: `__tests__/rpc/lists.test.ts`

- [ ] **Step 1: Write list RPC tests**

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { adminClient } from "../utils/supabase-test-client";
import { createTestUser, createFriendship, createTestList, cleanupTestData, TestUser } from "../utils/seed";

describe("List RPCs", () => {
  let userA: TestUser;
  let userB: TestUser;
  let listId: string;

  beforeAll(async () => {
    userA = await createTestUser({ full_name: "List User A" });
    userB = await createTestUser({ full_name: "List User B" });
    await createFriendship(userA.id, userB.id);

    listId = await createTestList(userA.id, {
      title: "NYC Eats",
      location_name: "New York",
      location_lng: -73.9857,
      location_lat: 40.7484,
    });

    // Add places to the list
    await adminClient.from("list_places").insert([
      { list_id: listId, original_text: "Joe's Pizza", resolved_name: "Joe's Pizza", position: 0, location: "POINT(-73.9969 40.7306)", confidence: 0.95, status: "resolved" },
      { list_id: listId, original_text: "Katz's Deli", resolved_name: "Katz's Delicatessen", position: 1, location: "POINT(-73.9874 40.7223)", confidence: 0.9, status: "resolved" },
    ]);

    // Another list with no places
    await createTestList(userA.id, { title: "Empty List" });
  });

  afterAll(async () => {
    await cleanupTestData([userA.id, userB.id]);
  });

  describe("get_lists_with_places", () => {
    it("returns lists with aggregated places", async () => {
      const { data, error } = await adminClient.rpc("get_lists_with_places", {
        p_user_id: userA.id,
      });

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThanOrEqual(2);

      const nycList = data!.find((l: any) => l.title === "NYC Eats");
      expect(nycList).toBeTruthy();
      expect(nycList.places).toHaveLength(2);
      expect(nycList.places[0].resolved_name).toBe("Joe's Pizza");
    });

    it("returns empty places array for list with no places", async () => {
      const { data } = await adminClient.rpc("get_lists_with_places", { p_user_id: userA.id });
      const emptyList = data!.find((l: any) => l.title === "Empty List");
      expect(emptyList).toBeTruthy();
      expect(emptyList.places).toHaveLength(0);
    });

    it("supports pagination", async () => {
      const { data: page1 } = await adminClient.rpc("get_lists_with_places", {
        p_user_id: userA.id,
        p_limit: 1,
        p_offset: 0,
      });
      expect(page1).toHaveLength(1);
      expect(page1![0].total_count).toBeGreaterThanOrEqual(2);
    });
  });

  describe("get_list_places_with_coordinates", () => {
    it("returns places with extracted coordinates", async () => {
      const { data, error } = await adminClient.rpc("get_list_places_with_coordinates", { p_list_id: listId });
      expect(error).toBeNull();
      expect(data).toHaveLength(2);
      expect(data![0].longitude).toBeCloseTo(-73.9969, 2);
      expect(data![0].latitude).toBeCloseTo(40.7306, 2);
    });
  });

  describe("get_viewable_list_locations", () => {
    it("returns own and friend lists", async () => {
      const friendList = await createTestList(userB.id, {
        title: "London Pubs",
        location_name: "London",
        location_lng: -0.1276,
        location_lat: 51.5074,
      });

      const { data, error } = await adminClient.rpc("get_viewable_list_locations", { p_user_id: userA.id });
      expect(error).toBeNull();
      // Should include both own lists and friend's lists
      const ownList = data?.find((l: any) => l.title === "NYC Eats");
      const friendsList = data?.find((l: any) => l.title === "London Pubs");
      expect(ownList).toBeTruthy();
      expect(friendsList).toBeTruthy();

      await adminClient.from("lists").delete().eq("id", friendList);
    });
  });
});
```

- [ ] **Step 2: Run and commit**

Run: `npx vitest run __tests__/rpc/lists.test.ts`

```bash
git add __tests__/rpc/lists.test.ts
git commit -m "test: add list RPC integration tests"
```

---

### Task 10: RPC integration tests — Saved Posts

**Files:**
- Create: `__tests__/rpc/saved-posts.test.ts`

- [ ] **Step 1: Write saved posts RPC tests**

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { adminClient } from "../utils/supabase-test-client";
import { createTestUser, createFriendship, createTestPost, createTestSavedPost, cleanupTestData, TestUser } from "../utils/seed";

describe("get_saved_posts RPC", () => {
  let userA: TestUser;
  let userB: TestUser;
  let savedPostId: string;

  beforeAll(async () => {
    userA = await createTestUser({ full_name: "Saved User A" });
    userB = await createTestUser({ full_name: "Saved User B" });
    await createFriendship(userA.id, userB.id);

    savedPostId = await createTestPost(userB.id, { text: "Save-worthy post" });
    await createTestSavedPost(userA.id, savedPostId);
  });

  afterAll(async () => {
    await cleanupTestData([userA.id, userB.id]);
  });

  it("returns saved posts with author data", async () => {
    const { data, error } = await adminClient.rpc("get_saved_posts", {
      user_id_param: userA.id,
      limit_param: 10,
      offset_param: 0,
    });

    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThanOrEqual(1);
    const post = data!.find((p: any) => p.id === savedPostId);
    expect(post).toBeTruthy();
    expect(post.saved_by_user).toBe(true);
    expect(post.author.full_name).toBe("Saved User B");
  });

  it("returns empty when user has no saved posts", async () => {
    const { data } = await adminClient.rpc("get_saved_posts", {
      user_id_param: userB.id,
      limit_param: 10,
      offset_param: 0,
    });
    expect(data).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run and commit**

Run: `npx vitest run __tests__/rpc/saved-posts.test.ts`

```bash
git add __tests__/rpc/saved-posts.test.ts
git commit -m "test: add saved posts RPC integration tests"
```

---

### Task 11: RPC integration tests — Vibes

**Files:**
- Create: `__tests__/rpc/vibes.test.ts`

- [ ] **Step 1: Write vibes RPC tests**

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { adminClient } from "../utils/supabase-test-client";
import { createTestUser, createTestVibe, cleanupTestData, TestUser } from "../utils/seed";

describe("get_top_vibes RPC", () => {
  let userA: TestUser;
  let userB: TestUser;
  let userC: TestUser;

  beforeAll(async () => {
    userA = await createTestUser({ full_name: "Vibe Receiver" });
    userB = await createTestUser({ full_name: "Vibe Sender B" });
    userC = await createTestUser({ full_name: "Vibe Sender C" });

    await createTestVibe(userB.id, userA.id, ["🔥", "💯", "🎉"]);
    await createTestVibe(userC.id, userA.id, ["🔥", "❤️", "🌟"]);
  });

  afterAll(async () => {
    await cleanupTestData([userA.id, userB.id, userC.id]);
  });

  it("returns top emojis ordered by frequency", async () => {
    const { data, error } = await adminClient.rpc("get_top_vibes", {
      p_user_id: userA.id,
      p_limit: 5,
    });

    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThan(0);
    // 🔥 appears twice, should be first
    expect(data![0].emoji).toBe("🔥");
    expect(Number(data![0].count)).toBe(2);
  });

  it("respects limit parameter", async () => {
    const { data } = await adminClient.rpc("get_top_vibes", {
      p_user_id: userA.id,
      p_limit: 1,
    });
    expect(data).toHaveLength(1);
  });

  it("returns empty for user with no vibes", async () => {
    const { data } = await adminClient.rpc("get_top_vibes", {
      p_user_id: userB.id,
      p_limit: 5,
    });
    expect(data).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run and commit**

Run: `npx vitest run __tests__/rpc/vibes.test.ts`

```bash
git add __tests__/rpc/vibes.test.ts
git commit -m "test: add vibes RPC integration tests"
```

---

### Task 12: RPC integration tests — Contacts

**Files:**
- Create: `__tests__/rpc/contacts.test.ts`

- [ ] **Step 1: Write contacts RPC tests**

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { adminClient } from "../utils/supabase-test-client";
import { createTestUser, createTestContact, cleanupTestData, TestUser } from "../utils/seed";

describe("get_contacts_ordered RPC", () => {
  let userA: TestUser;

  beforeAll(async () => {
    userA = await createTestUser({ full_name: "Contacts User" });

    // Create contacts with different latitudes (for ordering test)
    await createTestContact(userA.id, { name: "Northern Contact", location_lng: -73.9, location_lat: 60.0, location_name: "Alaska" });
    await createTestContact(userA.id, { name: "Southern Contact", location_lng: -73.9, location_lat: 25.0, location_name: "Miami" });
    await createTestContact(userA.id, { name: "Middle Contact", location_lng: -73.9, location_lat: 40.0, location_name: "NYC" });
    await createTestContact(userA.id, { name: "No Location Contact" });
  });

  afterAll(async () => {
    await cleanupTestData([userA.id]);
  });

  it("returns contacts ordered by latitude (north to south)", async () => {
    const { data, error } = await adminClient.rpc("get_contacts_ordered", { p_user_id: userA.id });
    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThanOrEqual(4);

    // Filter to only contacts with latitude
    const withLat = data!.filter((c: any) => c.latitude != null);
    for (let i = 1; i < withLat.length; i++) {
      expect(withLat[i - 1].latitude).toBeGreaterThanOrEqual(withLat[i].latitude);
    }
  });

  it("includes contacts without locations", async () => {
    const { data } = await adminClient.rpc("get_contacts_ordered", { p_user_id: userA.id });
    const noLoc = data!.find((c: any) => c.name === "No Location Contact");
    expect(noLoc).toBeTruthy();
    expect(noLoc.latitude).toBeNull();
  });

  it("returns empty for user with no contacts", async () => {
    const loner = await createTestUser({ full_name: "No Contacts" });
    const { data } = await adminClient.rpc("get_contacts_ordered", { p_user_id: loner.id });
    expect(data).toHaveLength(0);
    await cleanupTestData([loner.id]);
  });
});
```

- [ ] **Step 2: Run and commit**

Run: `npx vitest run __tests__/rpc/contacts.test.ts`

```bash
git add __tests__/rpc/contacts.test.ts
git commit -m "test: add contacts RPC integration tests"
```

---

## Chunk 5: Hook Unit Tests — Feed, Posts, Likes (Tasks 13-15)

### Task 13: Hook unit tests — useFeed

**Files:**
- Create: `__tests__/hooks/useFeed.test.ts`

- [ ] **Step 1: Write useFeed hook tests**

```tsx
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createMockSupabase, MockSupabaseClient } from "../utils/mock-supabase";
import { createTestWrapper } from "../utils/test-wrapper";
import { PostWithAuthor } from "@/types/post";

// Mock the hooks that useFeed depends on
let mockSupabase: MockSupabaseClient;
let mockProfileId: string;

vi.mock("@/hooks/useSupabase", () => ({
  useSupabase: () => ({ supabase: mockSupabase, isLoaded: true, session: {} }),
}));

vi.mock("@/stores/profileStore", () => ({
  useProfileStore: () => ({ profileState: { id: mockProfileId } }),
}));

// Import AFTER mocks are set up
const { useGetFeed, useGetUserPosts } = await import("@/hooks/useFeed");

describe("useFeed", () => {
  const mockPosts: PostWithAuthor[] = [
    {
      id: "post-1", text: "Hello", media_urls: [], created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z", edited_at: null, author_id: "user-b",
      visibility: "friends", list_id: null,
      author: { id: "user-b", full_name: "User B", avatar_url: "" },
      like_count: 5, comment_count: 2, liked_by_user: true, saved_by_user: false, attached_list: null,
    },
  ];

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    mockProfileId = "user-a";
  });

  describe("useGetFeed", () => {
    it("fetches feed posts via RPC", async () => {
      mockSupabase.configureRpc("get_feed_posts", { data: mockPosts, error: null });
      const { Wrapper } = createTestWrapper(mockSupabase);

      const { result } = renderHook(() => useGetFeed(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_feed_posts", {
        user_id_param: "user-a",
        limit_param: 10,
        offset_param: 0,
      });
      expect(result.current.data?.pages[0]).toEqual(mockPosts);
    });

    it("handles error from RPC", async () => {
      mockSupabase.configureRpc("get_feed_posts", { data: null, error: { message: "DB error" } });
      const { Wrapper } = createTestWrapper(mockSupabase);

      const { result } = renderHook(() => useGetFeed(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe("DB error");
    });

    it("is disabled when no profile", async () => {
      mockProfileId = "";
      mockSupabase.configureRpc("get_feed_posts", { data: mockPosts, error: null });
      const { Wrapper } = createTestWrapper(mockSupabase);

      const { result } = renderHook(() => useGetFeed(), { wrapper: Wrapper });

      // Should not fetch
      expect(result.current.isFetching).toBe(false);
    });

    it("calculates next page param correctly", async () => {
      // Return full page (10 items) to trigger next page
      const fullPage = Array.from({ length: 10 }, (_, i) => ({
        ...mockPosts[0], id: `post-${i}`,
      }));
      mockSupabase.configureRpc("get_feed_posts", { data: fullPage, error: null });
      const { Wrapper } = createTestWrapper(mockSupabase);

      const { result } = renderHook(() => useGetFeed(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.hasNextPage).toBe(true);
    });

    it("stops pagination when page is less than PAGE_SIZE", async () => {
      const partialPage = mockPosts.slice(0, 1); // Only 1 item
      mockSupabase.configureRpc("get_feed_posts", { data: partialPage, error: null });
      const { Wrapper } = createTestWrapper(mockSupabase);

      const { result } = renderHook(() => useGetFeed(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.hasNextPage).toBe(false);
    });
  });

  describe("useGetUserPosts", () => {
    it("fetches posts for a specific user", async () => {
      mockSupabase.configureRpc("get_user_posts", { data: mockPosts, error: null });
      const { Wrapper } = createTestWrapper(mockSupabase);

      const { result } = renderHook(() => useGetUserPosts("user-b"), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_user_posts", {
        user_id_param: "user-a",
        target_user_id: "user-b",
        limit_param: 10,
        offset_param: 0,
      });
    });

    it("is disabled when userId is undefined", async () => {
      const { Wrapper } = createTestWrapper(mockSupabase);
      const { result } = renderHook(() => useGetUserPosts(undefined), { wrapper: Wrapper });
      expect(result.current.isFetching).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run and commit**

Run: `npx vitest run __tests__/hooks/useFeed.test.ts`

```bash
git add __tests__/hooks/useFeed.test.ts
git commit -m "test: add useFeed hook unit tests"
```

---

### Task 14: Hook unit tests — usePosts

**Files:**
- Create: `__tests__/hooks/usePosts.test.ts`

- [ ] **Step 1: Write usePosts hook tests**

```tsx
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { createMockSupabase, MockSupabaseClient } from "../utils/mock-supabase";
import { createTestWrapper } from "../utils/test-wrapper";

let mockSupabase: MockSupabaseClient;
const mockProfile = { id: "user-a", full_name: "User A", avatar_url: "" };

vi.mock("@/hooks/useSupabase", () => ({
  useSupabase: () => ({ supabase: mockSupabase, isLoaded: true, session: {} }),
}));

vi.mock("@/hooks/useRequireProfile", () => ({
  useRequireProfile: () => mockProfile,
}));

const { useCreatePost, useUpdatePost, useDeletePost, useGetPost } = await import("@/hooks/usePosts");

describe("usePosts", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  describe("useCreatePost", () => {
    it("inserts a post and invalidates cache", async () => {
      const createdPost = { id: "new-post", author_id: "user-a", text: "New post", visibility: "friends", media_urls: [], list_id: null, edited_at: null, created_at: "2026-01-01", updated_at: "2026-01-01" };
      mockSupabase.configureFrom("posts", { data: createdPost, error: null });
      const { Wrapper, queryClient } = createTestWrapper(mockSupabase);
      const spy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useCreatePost(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync({ text: "New post", visibility: "friends" });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("posts");
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("useDeletePost", () => {
    it("deletes post and invalidates cache", async () => {
      mockSupabase.configureFrom("posts", { data: null, error: null });
      const { Wrapper, queryClient } = createTestWrapper(mockSupabase);
      const spy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useDeletePost(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync("post-to-delete");
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("posts");
      expect(spy).toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run and commit**

Run: `npx vitest run __tests__/hooks/usePosts.test.ts`

```bash
git add __tests__/hooks/usePosts.test.ts
git commit -m "test: add usePosts hook unit tests"
```

---

### Task 15: Hook unit tests — useLikes

**Files:**
- Create: `__tests__/hooks/useLikes.test.ts`

- [ ] **Step 1: Write useLikes hook tests**

```tsx
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createMockSupabase, MockSupabaseClient } from "../utils/mock-supabase";
import { createTestWrapper } from "../utils/test-wrapper";

let mockSupabase: MockSupabaseClient;
const mockProfile = { id: "user-a", full_name: "User A", avatar_url: "" };

vi.mock("@/hooks/useSupabase", () => ({
  useSupabase: () => ({ supabase: mockSupabase, isLoaded: true, session: {} }),
}));

vi.mock("@/hooks/useRequireProfile", () => ({
  useRequireProfile: () => mockProfile,
}));

const { useLikePost, useUnlikePost, useLikeComment, useUnlikeComment } = await import("@/hooks/useLikes");

describe("useLikes", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
    mockSupabase.configureFrom("likes", { data: null, error: null });
  });

  describe("useLikePost", () => {
    it("inserts like with post_id and null comment_id", async () => {
      const { Wrapper } = createTestWrapper(mockSupabase);
      const { result } = renderHook(() => useLikePost(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync("post-123");
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("likes");
      const chain = mockSupabase.getLastChain("likes");
      expect(chain?.insert).toHaveBeenCalledWith(expect.objectContaining({
        user_id: "user-a",
        post_id: "post-123",
        comment_id: null,
      }));
    });
  });

  describe("useUnlikePost", () => {
    it("deletes like by user and post", async () => {
      const { Wrapper } = createTestWrapper(mockSupabase);
      const { result } = renderHook(() => useUnlikePost(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync("post-123");
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("likes");
      const chain = mockSupabase.getLastChain("likes");
      expect(chain?.eq).toHaveBeenCalledWith("user_id", "user-a");
      expect(chain?.eq).toHaveBeenCalledWith("post_id", "post-123");
    });
  });

  describe("useLikeComment", () => {
    it("inserts like with comment_id and null post_id", async () => {
      const { Wrapper } = createTestWrapper(mockSupabase);
      const { result } = renderHook(() => useLikeComment(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync("comment-123");
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("likes");
      const chain = mockSupabase.getLastChain("likes");
      expect(chain?.insert).toHaveBeenCalledWith(expect.objectContaining({
        user_id: "user-a",
        comment_id: "comment-123",
        post_id: null,
      }));
    });
  });
});
```

- [ ] **Step 2: Run and commit**

Run: `npx vitest run __tests__/hooks/useLikes.test.ts`

```bash
git add __tests__/hooks/useLikes.test.ts
git commit -m "test: add useLikes hook unit tests"
```

---

## Chunk 6: Hook Unit Tests — Friends, Travel Plans, Messages (Tasks 16-18)

### Task 16: Hook unit tests — useFriends

**Files:**
- Create: `__tests__/hooks/useFriends.test.ts`

- [ ] **Step 1: Write useFriends hook tests**

```tsx
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { createMockSupabase, MockSupabaseClient } from "../utils/mock-supabase";
import { createTestWrapper } from "../utils/test-wrapper";

let mockSupabase: MockSupabaseClient;
const mockProfile = { id: "user-a", full_name: "User A", avatar_url: "" };

vi.mock("@/hooks/useSupabase", () => ({
  useSupabase: () => ({ supabase: mockSupabase, isLoaded: true, session: {} }),
}));

vi.mock("@/hooks/useRequireProfile", () => ({
  useRequireProfile: () => mockProfile,
}));

const {
  useSendFriendRequest, useAcceptFriendRequest, useGetFriends,
  useSearchFriends, useGetFriendshipStatus, useGetPlatformStatistics,
} = await import("@/hooks/useFriends");

describe("useFriends", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  describe("useSendFriendRequest", () => {
    it("inserts friendship with ordered user IDs", async () => {
      mockSupabase.configureFrom("friendships", {
        data: { id: "f-1", user_a: "user-a", user_b: "user-b", status: "pending" },
        error: null,
      });
      const { Wrapper } = createTestWrapper(mockSupabase);
      const { result } = renderHook(() => useSendFriendRequest(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync({ targetUserId: "user-b" });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("friendships");
    });

    it("rejects self-friend request", async () => {
      const { Wrapper } = createTestWrapper(mockSupabase);
      const { result } = renderHook(() => useSendFriendRequest(), { wrapper: Wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({ targetUserId: "user-a" });
        } catch (e: any) {
          expect(e.message).toContain("yourself");
        }
      });
    });
  });

  describe("useGetFriends", () => {
    it("fetches and transforms friendship records", async () => {
      mockSupabase.configureFrom("friendships", {
        data: [
          { id: "f-1", user_a: "user-a", user_b: "user-b", status: "accepted",
            a: { id: "user-a", full_name: "User A", avatar_url: "" },
            b: { id: "user-b", full_name: "User B", avatar_url: "" } },
        ],
        error: null,
      });
      const { Wrapper } = createTestWrapper(mockSupabase);
      const { result } = renderHook(() => useGetFriends(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe("useSearchFriends", () => {
    it("calls search RPC with query", async () => {
      mockSupabase.configureRpc("search_friends", {
        data: [{ id: "user-b", full_name: "User B" }],
        error: null,
      });
      const { Wrapper } = createTestWrapper(mockSupabase);
      const { result } = renderHook(() => useSearchFriends("User B"), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockSupabase.rpc).toHaveBeenCalledWith("search_friends", {
        p_user_id: "user-a",
        p_query: "User B",
      });
    });

    it("is disabled with empty query", async () => {
      const { Wrapper } = createTestWrapper(mockSupabase);
      const { result } = renderHook(() => useSearchFriends(""), { wrapper: Wrapper });
      expect(result.current.isFetching).toBe(false);
    });
  });

  describe("useGetPlatformStatistics", () => {
    it("returns stats from RPC", async () => {
      mockSupabase.configureRpc("get_platform_statistics", {
        data: [{ total_users: 100, connections_count: 250 }],
        error: null,
      });
      const { Wrapper } = createTestWrapper(mockSupabase);
      const { result } = renderHook(() => useGetPlatformStatistics(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });
});
```

- [ ] **Step 2: Run and commit**

Run: `npx vitest run __tests__/hooks/useFriends.test.ts`

```bash
git add __tests__/hooks/useFriends.test.ts
git commit -m "test: add useFriends hook unit tests"
```

---

### Task 17: Hook unit tests — useTravelPlan

**Files:**
- Create: `__tests__/hooks/useTravelPlan.test.ts`

- [ ] **Step 1: Write useTravelPlan hook tests**

```tsx
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { createMockSupabase, MockSupabaseClient } from "../utils/mock-supabase";
import { createTestWrapper } from "../utils/test-wrapper";

let mockSupabase: MockSupabaseClient;
const mockProfile = { id: "user-a", full_name: "User A", avatar_url: "" };

vi.mock("@/hooks/useSupabase", () => ({
  useSupabase: () => ({ supabase: mockSupabase, isLoaded: true, session: {} }),
}));

vi.mock("@/hooks/useRequireProfile", () => ({
  useRequireProfile: () => mockProfile,
}));

const {
  useCreateTravelPlan, useUpdateTravelPlan, useCancelTravelPlan,
  useGetTravelPlanByPostId,
} = await import("@/hooks/useTravelPlan");

describe("useTravelPlan", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  describe("useCreateTravelPlan", () => {
    it("calls RPC with correct params", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startDate = tomorrow.toISOString().split("T")[0];

      mockSupabase.configureRpc("create_travel_plan_with_post", {
        data: [{ travel_plan_id: "tp-1", post_id: "p-1", destination_name: "Paris", start_date: startDate, end_date: startDate }],
        error: null,
      });
      const { Wrapper } = createTestWrapper(mockSupabase);
      const { result } = renderHook(() => useCreateTravelPlan(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          destination: { name: "Paris", longitude: 2.35, latitude: 48.85 },
          start_date: startDate,
          duration_days: 5,
          post_visibility: "friends",
        });
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith("create_travel_plan_with_post", expect.objectContaining({
        p_user_id: "user-a",
        p_destination_name: "Paris",
        p_duration_days: 5,
      }));
    });

    it("rejects invalid duration", async () => {
      const { Wrapper } = createTestWrapper(mockSupabase);
      const { result } = renderHook(() => useCreateTravelPlan(), { wrapper: Wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            destination: { name: "Paris", longitude: 2.35, latitude: 48.85 },
            start_date: "2026-06-01",
            duration_days: 50,
          });
        } catch (e: any) {
          expect(e.message).toContain("Duration");
        }
      });
    });

    it("rejects past start date", async () => {
      const { Wrapper } = createTestWrapper(mockSupabase);
      const { result } = renderHook(() => useCreateTravelPlan(), { wrapper: Wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            destination: { name: "Paris", longitude: 2.35, latitude: 48.85 },
            start_date: "2020-01-01",
            duration_days: 5,
          });
        } catch (e: any) {
          expect(e.message).toContain("past");
        }
      });
    });
  });

  describe("useCancelTravelPlan", () => {
    it("calls cancel RPC", async () => {
      mockSupabase.configureRpc("cancel_travel_plan_with_post", { data: null, error: null });
      const { Wrapper } = createTestWrapper(mockSupabase);
      const { result } = renderHook(() => useCancelTravelPlan(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync("tp-1");
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith("cancel_travel_plan_with_post", { p_travel_plan_id: "tp-1" });
    });
  });

  describe("useGetTravelPlanByPostId", () => {
    it("fetches travel plan by post ID", async () => {
      mockSupabase.configureRpc("get_travel_plan_by_post_id", {
        data: [{ id: "tp-1", destination_name: "Paris" }],
        error: null,
      });
      const { Wrapper } = createTestWrapper(mockSupabase);
      const { result } = renderHook(() => useGetTravelPlanByPostId("post-1"), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_travel_plan_by_post_id", { p_post_id: "post-1" });
    });

    it("is disabled when postId is undefined", async () => {
      const { Wrapper } = createTestWrapper(mockSupabase);
      const { result } = renderHook(() => useGetTravelPlanByPostId(undefined), { wrapper: Wrapper });
      expect(result.current.isFetching).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run and commit**

Run: `npx vitest run __tests__/hooks/useTravelPlan.test.ts`

```bash
git add __tests__/hooks/useTravelPlan.test.ts
git commit -m "test: add useTravelPlan hook unit tests"
```

---

### Task 18: Hook unit tests — useChat and useMessageChannels

**Files:**
- Create: `__tests__/hooks/useChat.test.ts`
- Create: `__tests__/hooks/useMessageChannels.test.ts`

- [ ] **Step 1: Write useChat tests**

```tsx
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createMockSupabase, MockSupabaseClient } from "../utils/mock-supabase";
import { createTestWrapper } from "../utils/test-wrapper";

let mockSupabase: MockSupabaseClient;
const mockProfile = { id: "user-a", full_name: "User A", avatar_url: "" };

vi.mock("@/hooks/useSupabase", () => ({
  useSupabase: () => ({ supabase: mockSupabase, isLoaded: true, session: {} }),
}));

vi.mock("@/hooks/useRequireProfile", () => ({
  useRequireProfile: () => mockProfile,
}));

const { useSendMessage, useDeleteMessage } = await import("@/hooks/useChat");

describe("useChat", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  describe("useSendMessage", () => {
    it("inserts message with ordered user IDs", async () => {
      mockSupabase.configureFrom("messages", {
        data: { id: "msg-1", text: "Hello", sender_id: "user-a" },
        error: null,
      });
      const { Wrapper } = createTestWrapper(mockSupabase);
      const { result } = renderHook(() => useSendMessage(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync({ friendId: "user-b", text: "Hello" });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("messages");
    });
  });

  describe("useDeleteMessage", () => {
    it("soft-deletes by setting deleted_at", async () => {
      mockSupabase.configureFrom("messages", { data: null, error: null });
      const { Wrapper } = createTestWrapper(mockSupabase);
      const { result } = renderHook(() => useDeleteMessage(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync({ messageId: "msg-1" });
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("messages");
      const chain = mockSupabase.getLastChain("messages");
      expect(chain?.update).toHaveBeenCalledWith(expect.objectContaining({ deleted_at: expect.any(String) }));
      expect(chain?.eq).toHaveBeenCalledWith("id", "msg-1");
    });
  });
});
```

- [ ] **Step 2: Write useMessageChannels tests**

```tsx
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createMockSupabase, MockSupabaseClient } from "../utils/mock-supabase";
import { createTestWrapper } from "../utils/test-wrapper";

let mockSupabase: MockSupabaseClient;
const mockProfile = { id: "user-a", full_name: "User A", avatar_url: "" };

vi.mock("@/hooks/useSupabase", () => ({
  useSupabase: () => ({ supabase: mockSupabase, isLoaded: true, session: {} }),
}));

vi.mock("@/hooks/useRequireProfile", () => ({
  useRequireProfile: () => mockProfile,
}));

const { useGetMessageChannels, useHasUnreadMessages } = await import("@/hooks/useMessageChannels");

describe("useMessageChannels", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  describe("useGetMessageChannels", () => {
    it("calls RPC and returns channels", async () => {
      mockSupabase.configureRpc("get_message_channels", {
        data: [{ friend_id: "user-b", full_name: "User B", unread_count: 3 }],
        error: null,
      });
      const { Wrapper } = createTestWrapper(mockSupabase);
      const { result } = renderHook(() => useGetMessageChannels(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_message_channels", { p_user_id: "user-a" });
    });
  });

  describe("useHasUnreadMessages", () => {
    it("returns boolean from RPC", async () => {
      mockSupabase.configureRpc("has_unread_messages", { data: true, error: null });
      const { Wrapper } = createTestWrapper(mockSupabase);
      const { result } = renderHook(() => useHasUnreadMessages(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });
});
```

- [ ] **Step 3: Run and commit**

Run: `npx vitest run __tests__/hooks/useChat.test.ts __tests__/hooks/useMessageChannels.test.ts`

```bash
git add __tests__/hooks/useChat.test.ts __tests__/hooks/useMessageChannels.test.ts
git commit -m "test: add useChat and useMessageChannels hook unit tests"
```

---

## Chunk 7: Hook Unit Tests — Remaining Hooks (Tasks 19-23)

### Task 19: Hook unit tests — useSavedPosts

**Files:**
- Create: `__tests__/hooks/useSavedPosts.test.ts`

- [ ] **Step 1: Write and commit**

Follow the same pattern as useFeed tests. Test:
- `useSavePost` calls `from("saved_posts").insert()`
- `useUnsavePost` calls `from("saved_posts").delete()`
- `useGetSavedPosts` calls `rpc("get_saved_posts")` with correct params
- Pagination behavior (same as useFeed infinite query)
- Cache invalidation on save/unsave

---

### Task 20: Hook unit tests — useProfile

**Files:**
- Create: `__tests__/hooks/useProfile.test.ts`

- [ ] **Step 1: Write and commit**

Test:
- `useGetProfile` calls `rpc("get_profile")` with user ID
- `useCreateProfile` calls `from("profiles").insert()` with PostGIS POINT format
- `useUpdateProfile` calls `from("profiles").update()` and converts lat/lon to POINT
- Cache invalidation on mutations

---

### Task 21: Hook unit tests — useVibe

**Files:**
- Create: `__tests__/hooks/useVibe.test.ts`

- [ ] **Step 1: Write and commit**

Test:
- `useCreateVibe` validates exactly 3 emojis before inserting
- `useGetTopVibes` calls `rpc("get_top_vibes")` with correct params
- `useHasGivenVibe` returns boolean check
- Error on invalid emoji count

---

### Task 22: Hook unit tests — useLists

**Files:**
- Create: `__tests__/hooks/useLists.test.ts`

- [ ] **Step 1: Write and commit**

Test:
- `useCreateList` converts coordinates to PostGIS POINT
- `useGetLists` calls `rpc("get_lists_with_places")`
- `useGetListLocations` calls `rpc("get_viewable_list_locations")`
- `useDeleteList` calls `from("lists").delete()`
- Cache invalidation on mutations

---

### Task 23: Hook unit tests — useContacts and useInviteCodes

**Files:**
- Create: `__tests__/hooks/useContacts.test.ts`
- Create: `__tests__/hooks/useInviteCodes.test.ts`

- [ ] **Step 1: Write and commit**

useContacts tests:
- `useCreateContact` converts location to PostGIS POINT
- `useGetContacts` calls `rpc("get_contacts_ordered")`
- `useDeleteContact` calls `from("contacts").delete()`

useInviteCodes tests:
- `useCreateInviteCode` generates random codes
- `useSendInviteCode` calls edge function `send-invite-sms`
- Error handling for duplicate code collision (error code 23505)

---

## Chunk 8: Final Verification (Task 24)

### Task 24: Run full test suite and verify

- [ ] **Step 1: Ensure local Supabase is running**

```bash
supabase start
```

- [ ] **Step 2: Run all RPC integration tests**

```bash
npm run test:rpc
```

Expected: All tests PASS

- [ ] **Step 3: Run all hook unit tests**

```bash
npm run test:hooks
```

Expected: All tests PASS

- [ ] **Step 4: Run full suite**

```bash
npm test
```

Expected: All tests PASS

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "test: complete test suite — RPC integration + hook unit tests"
```
