-- Fix get_friends_and_mutuals_of: the previous mutual-detection JOIN used
-- f1.user_a != f2.user_a AND f1.user_b != f2.user_b which incorrectly excludes
-- cases where both friendship rows have the shared intermediate friend stored as
-- the same column (user_a or user_b) due to min/max ordering of UUIDs.
-- Replaced with a cleaner subquery that explicitly finds friends-of-friends.
create or replace function public.get_friends_and_mutuals_of(p_user_id uuid)
returns table(user_id uuid)
security definer
set search_path = public
language plpgsql
as $$
begin
  return query
  select distinct u.id
  from public.profiles u
  where u.id != p_user_id
    and (
      -- Direct friend
      exists (
        select 1 from public.friendships f
        where f.status = 'accepted'
          and ((f.user_a = p_user_id and f.user_b = u.id)
            or (f.user_b = p_user_id and f.user_a = u.id))
      )
      or
      -- Friend of a friend (mutual)
      exists (
        select 1
        from (
          select case when f.user_a = p_user_id then f.user_b else f.user_a end as intermediary
          from public.friendships f
          where f.status = 'accepted'
            and (f.user_a = p_user_id or f.user_b = p_user_id)
        ) af
        join public.friendships f2 on (
          f2.status = 'accepted'
          and ((f2.user_a = af.intermediary and f2.user_b = u.id)
            or (f2.user_b = af.intermediary and f2.user_a = u.id))
        )
      )
    );
end;
$$;
