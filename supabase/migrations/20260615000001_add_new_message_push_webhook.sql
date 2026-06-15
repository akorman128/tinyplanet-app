-- Codifies the "new direct message" push-notification webhook as a migration.
--
-- Background: this webhook was originally created via the Supabase Dashboard and was
-- mistakenly attached to realtime.messages -> send-invite-sms. It now lives on
-- public.messages -> send-push-notification (Expo push for new DMs). The intended
-- architecture is documented in 20260317100001_add_push_tokens_and_notification_support.sql.
--
-- Supabase webhooks (supabase_functions.http_request) embed the service_role JWT in the
-- trigger's headers. To keep that secret OUT of version control, this migration reads it
-- from Vault (secret name: 'service_role_key') instead of hardcoding it.
--
-- Seed the secret once per environment (value is NOT stored in git):
--   select vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role_key');
--
-- Where the Vault secret is absent (local dev / CI), this migration is a no-op, so test
-- inserts into public.messages never fire a webhook at the production endpoint.

do $$
declare
  v_key text;
  v_url text := 'https://bkarkzwzbvfiqbtpjkvh.supabase.co/functions/v1/send-push-notification';
begin
  select decrypted_secret into v_key
  from vault.decrypted_secrets
  where name = 'service_role_key';

  if v_key is null then
    raise notice 'Vault secret "service_role_key" not set; skipping notify_new_message webhook (expected in local/CI).';
    return;
  end if;

  drop trigger if exists notify_new_message on public.messages;

  execute format(
    'create trigger notify_new_message after insert on public.messages '
    'for each row execute function supabase_functions.http_request(%L, %L, %L, %L, %L)',
    v_url,
    'POST',
    jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    )::text,
    '{}',
    '5000'
  );
end $$;
