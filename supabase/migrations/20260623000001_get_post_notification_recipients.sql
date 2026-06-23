-- Recipients for a "new post" push, bounded by visibility:
--   visibility='friends'           -> author's accepted friends
--   visibility in ('mutuals','public') -> friends + mutuals (reuses
--     get_friends_and_mutuals_of; we intentionally cap public at mutuals)
-- Always excludes the author and any blocked relationship (symmetric is_blocked).
create or replace function public.get_post_notification_recipients(p_post_id uuid)
returns table(user_id uuid)
security definer
set search_path = public
language plpgsql
as $$
declare
  v_author     uuid;
  v_visibility public.post_visibility;
begin
  select author_id, visibility into v_author, v_visibility
  from public.posts where id = p_post_id;

  if v_author is null then
    return;
  end if;

  if v_visibility = 'friends' then
    return query
    select (case when f.user_a = v_author then f.user_b else f.user_a end) as user_id
    from public.friendships f
    where f.status = 'accepted'
      and (f.user_a = v_author or f.user_b = v_author)
      and not is_blocked(
        v_author,
        (case when f.user_a = v_author then f.user_b else f.user_a end)
      );
  else
    return query
    select gfm.user_id
    from public.get_friends_and_mutuals_of(v_author) gfm
    where not is_blocked(v_author, gfm.user_id);
  end if;
end;
$$;

grant execute on function public.get_post_notification_recipients(uuid) to authenticated, service_role;
