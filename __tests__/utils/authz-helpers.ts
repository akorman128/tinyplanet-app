import { expect } from "vitest";

/**
 * Assert that an RPC call the caller is not authorized to make is rejected.
 * The contract (from issue #1's IDOR fix) allows either of two equivalent
 * outcomes: a raised authorization exception (ERRCODE 42501), or no rows leaked.
 */
export function expectAuthzRejected(result: { data: unknown; error: unknown }) {
  const { data, error } = result as {
    data: unknown;
    error: { code?: string; message?: string } | null;
  };

  if (error) {
    // RAISE EXCEPTION ... ERRCODE = 42501 (insufficient_privilege)
    const matchesContract =
      error.code === "42501" ||
      /42501|not authorized|unauthor|insufficient|access denied|permission/i.test(
        error.message ?? ""
      );
    expect(matchesContract).toBe(true);
  } else {
    // If it didn't raise, it must at least not have leaked another user's rows.
    expect(Array.isArray(data) ? data.length : (data ?? 0)).toBeFalsy();
  }
}
