-- "friend request" push: fires on a NEW pending friendship. WHEN clause skips
-- auto-accepted invite friendships (status='accepted'). Vault-gated; no-op locally.
do $$
declare
  v_key text;
  v_url text := 'https://bkarkzwzbvfiqbtpjkvh.supabase.co/functions/v1/notify';
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'service_role_key';
  if v_key is null then
    raise notice 'Vault secret "service_role_key" not set; skipping notify_friend_request webhook (expected in local/CI).';
    return;
  end if;

  drop trigger if exists notify_friend_request on public.friendships;
  execute format(
    'create trigger notify_friend_request after insert on public.friendships '
    'for each row when (new.status = ''pending'') '
    'execute function supabase_functions.http_request(%L, %L, %L, %L, %L)',
    v_url, 'POST',
    jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key)::text,
    '{}', '5000'
  );
end $$;
