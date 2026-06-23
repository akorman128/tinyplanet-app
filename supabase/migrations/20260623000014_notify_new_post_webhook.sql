-- "new post" push: fires on every post insert; the resolver excludes Hang-carrier
-- posts and resolves the visibility-bounded audience.
do $$
declare
  v_key text;
  v_url text := 'https://bkarkzwzbvfiqbtpjkvh.supabase.co/functions/v1/notify';
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'service_role_key';
  if v_key is null then
    raise notice 'Vault secret "service_role_key" not set; skipping notify_new_post webhook (expected in local/CI).';
    return;
  end if;

  drop trigger if exists notify_new_post on public.posts;
  execute format(
    'create trigger notify_new_post after insert on public.posts '
    'for each row execute function supabase_functions.http_request(%L, %L, %L, %L, %L)',
    v_url, 'POST',
    jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key)::text,
    '{}', '5000'
  );
end $$;
