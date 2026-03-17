import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SupabaseContext } from "@/context/supabase-context";
import type { MockSupabaseClient } from "./mock-supabase";

// Test-only helper: useSupabase() is vi.mock'd in every test file, so the
// context value is never actually read — it just has to be non-null to avoid
// the "must be used within SupabaseProvider" guard. We cast through the
// context's expected type so TypeScript doesn't complain.
type ContextValue = React.ComponentProps<typeof SupabaseContext.Provider>["value"];

interface WrapperProps {
  children: React.ReactNode;
}

/**
 * Creates a test wrapper with QueryClient + SupabaseContext.
 * Each test gets a fresh QueryClient to avoid cache leaks.
 *
 * Note: Hook tests mock useSupabase() and useRequireProfile() directly via vi.mock,
 * so the SupabaseContext.Provider here just prevents the "must be used within SupabaseProvider" error.
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
        <SupabaseContext.Provider value={mockSupabase as unknown as ContextValue}>
          {children}
        </SupabaseContext.Provider>
      </QueryClientProvider>
    );
  }

  return { Wrapper, queryClient };
}
