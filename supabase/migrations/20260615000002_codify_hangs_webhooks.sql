-- Codifies the two Hangs notification webhooks as a migration (same Vault pattern as
-- 20260615000001_add_new_message_push_webhook.sql). Both were created out-of-band in
-- the Supabase dashboard:
--   notify-hangs-create  AFTER INSERT ON public.hangs          -> notify-hangs
--   notify-hangs-rsvp    AFTER INSERT ON public.hang_attendees -> notify-hangs
--
-- The service_role JWT is read from Vault (secret name: 'service_role_key') instead of
-- hardcoded, so no secret lands in git. Seed once per environment (value NOT in git):
--   select vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role_key');
--
-- No-op where the Vault secret is absent (local dev / CI), so test inserts never POST to
-- the production endpoint.

do $$
declare
  v_key     text;
  v_base    text := 'https://bkarkzwzbvfiqbtpjkvh.supabase.co/functions/v1/';
  v_headers text;
  rec       record;
begin
  select decrypted_secret into v_key
  from vault.decrypted_secrets
  where name = 'service_role_key';

  if v_key is null then
    raise notice 'Vault secret "service_role_key" not set; skipping Hangs webhooks (expected in local/CI).';
    return;
  end if;

  v_headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || v_key
  )::text;

  for rec in
    select * from (values
      ('notify-hangs-create', 'public.hangs',          'notify-hangs'),
      ('notify-hangs-rsvp',   'public.hang_attendees', 'notify-hangs')
    ) as x(tg, tbl, fn)
  loop
    execute format('drop trigger if exists %I on %s', rec.tg, rec.tbl);
    execute format(
      'create trigger %I after insert on %s for each row '
      'execute function supabase_functions.http_request(%L, %L, %L, %L, %L)',
      rec.tg, rec.tbl, v_base || rec.fn, 'POST', v_headers, '{}', '5000'
    );
  end loop;
end $$;
