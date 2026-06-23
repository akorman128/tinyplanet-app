// Pure recipient helpers. NO Deno.* / npm: imports (Vitest-importable).

export function friendRequestRecipient(r: {
  user_a: string;
  user_b: string;
  requested_by: string;
}): string {
  return r.requested_by === r.user_a ? r.user_b : r.user_a;
}
