-- Inviters who spent ≥1 invite in the PREVIOUS calendar month (the users for whom
-- a monthly "invites refreshed" reminder is meaningful).
create or replace function public.get_invite_refresh_recipients()
returns table(user_id uuid)
security definer
set search_path = public
language sql
stable
as $$
  select distinct inviter_id
  from public.invite_codes
  where created_at >= date_trunc('month', now()) - interval '1 month'
    and created_at <  date_trunc('month', now());
$$;

grant execute on function public.get_invite_refresh_recipients() to service_role;
