-- "member joined" push: fires when an INVITED user's profile is inserted.
-- Vault pattern (cf. 20260615000001): reads service_role JWT from Vault; no-op
-- where the secret is absent (local/CI). WHEN clause keeps non-invited signups
-- from waking the function.
do $$
declare
  v_key text;
  v_url text := 'https://bkarkzwzbvfiqbtpjkvh.supabase.co/functions/v1/notify';
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'service_role_key';
  if v_key is null then
    raise notice 'Vault secret "service_role_key" not set; skipping notify_member_joined webhook (expected in local/CI).';
    return;
  end if;

  drop trigger if exists notify_member_joined on public.profiles;
  execute format(
    'create trigger notify_member_joined after insert on public.profiles '
    'for each row when (new.invited_by is not null) '
    'execute function supabase_functions.http_request(%L, %L, %L, %L, %L)',
    v_url, 'POST',
    jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key)::text,
    '{}', '5000'
  );
end $$;
