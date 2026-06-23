-- Monthly "invites refreshed" reminder. Requires pg_cron + pg_net (Supabase).
-- The scheduled command reads the service-role JWT from Vault AT RUNTIME, so the
-- secret is not stored in cron.job.command. No-op where pg_cron is absent (local/CI).
do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'pg_cron not installed; skipping invites-refreshed cron (expected in local/CI).';
    return;
  end if;

  perform cron.unschedule('invites-refreshed-monthly')
  where exists (select 1 from cron.job where jobname = 'invites-refreshed-monthly');

  perform cron.schedule(
    'invites-refreshed-monthly',
    '0 12 1 * *',
    $cron$
    select net.http_post(
      url := 'https://bkarkzwzbvfiqbtpjkvh.supabase.co/functions/v1/notify',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
      ),
      body := jsonb_build_object('type', 'invites_refreshed')
    );
    $cron$
  );
end $$;
