-- "like" push: fires only on POST likes (WHEN post_id IS NOT NULL skips comment likes).
do $$
declare
  v_key text;
  v_url text := 'https://bkarkzwzbvfiqbtpjkvh.supabase.co/functions/v1/notify';
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'service_role_key';
  if v_key is null then
    raise notice 'Vault secret "service_role_key" not set; skipping notify_like webhook (expected in local/CI).';
    return;
  end if;

  drop trigger if exists notify_like on public.likes;
  execute format(
    'create trigger notify_like after insert on public.likes '
    'for each row when (new.post_id is not null) '
    'execute function supabase_functions.http_request(%L, %L, %L, %L, %L)',
    v_url, 'POST',
    jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key)::text,
    '{}', '5000'
  );
end $$;
