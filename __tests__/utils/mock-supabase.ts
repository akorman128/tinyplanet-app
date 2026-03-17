import { vi } from "vitest";

type MockResponse<T = unknown> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string } };

interface ChainableMock {
  [method: string]: ReturnType<typeof vi.fn>;
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
 *
 * To assert chain method args:
 *   const chain = mock.getLastChain("posts");
 *   expect(chain?.insert).toHaveBeenCalledWith({ ... });
 */
export function createMockSupabase() {
  const rpcResponses = new Map<string, MockResponse>();
  const fromResponses = new Map<string, MockResponse>();
  const lastChains = new Map<string, ChainableMock>();

  const createChain = (resolvedValue: MockResponse): ChainableMock => {
    const chain: ChainableMock = {} as ChainableMock;
    const methods = [
      "select",
      "insert",
      "update",
      "delete",
      "upsert",
      "eq",
      "or",
      "in",
      "is",
      "gte",
      "lte",
      "order",
      "limit",
    ];
    for (const m of methods) {
      chain[m] = vi.fn().mockReturnValue(chain);
    }
    chain.single = vi.fn().mockResolvedValue(resolvedValue);
    chain.maybeSingle = vi.fn().mockResolvedValue(resolvedValue);

    // Make the chain itself thenable (for queries without .single())
    chain.then = vi.fn(
      (
        onFulfilled?: (value: MockResponse) => unknown,
        onRejected?: (reason: unknown) => unknown
      ) => Promise.resolve(resolvedValue).then(onFulfilled, onRejected)
    );
    return chain;
  };

  const client = {
    from: vi.fn((table: string) => {
      const response = fromResponses.get(table) ?? { data: [], error: null };
      const chain = createChain(response);
      lastChains.set(table, chain);
      return chain;
    }),
    /** Get the last chain created for a table, to assert on chain method args. */
    getLastChain(table: string) {
      return lastChains.get(table);
    },
    rpc: vi.fn((fnName: string, _params?: Record<string, unknown>) => {
      const response = rpcResponses.get(fnName) ?? { data: null, error: null };
      return Promise.resolve(response);
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithOtp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      verifyOtp: vi
        .fn()
        .mockResolvedValue({ data: { session: {} }, error: null }),
      signInWithPassword: vi
        .fn()
        .mockResolvedValue({ data: { session: {} }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
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
