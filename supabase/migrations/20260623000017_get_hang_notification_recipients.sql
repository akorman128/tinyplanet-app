-- Recipients for a hang-created push: the host's friends + mutuals, minus any
-- blocked relationship. Mirrors get_post_notification_recipients' block-aware
-- wrapping; notify-hangs previously called get_friends_and_mutuals_of directly
-- with no block filter.
create or replace function public.get_hang_notification_recipients(p_host_id uuid)
returns table(user_id uuid)
security definer
set search_path = public
language sql
stable
as $$
  select gfm.user_id
  from public.get_friends_and_mutuals_of(p_host_id) gfm
  where not is_blocked(p_host_id, gfm.user_id);
$$;

grant execute on function public.get_hang_notification_recipients(uuid) to service_role;
