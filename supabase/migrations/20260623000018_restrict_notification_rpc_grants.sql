-- The notification-recipient RPCs are SECURITY DEFINER and return users' social
-- graphs / invite activity. They are only called by the notify edge function
-- (service_role). Revoke the default PUBLIC execute grant (and the stray
-- `authenticated` grant on get_post_notification_recipients) so clients cannot
-- enumerate a post author's friends+mutuals or invite history.
revoke execute on function public.get_post_notification_recipients(uuid) from public, anon, authenticated;
revoke execute on function public.get_invite_refresh_recipients() from public, anon, authenticated;
revoke execute on function public.get_hang_notification_recipients(uuid) from public, anon, authenticated;

grant execute on function public.get_post_notification_recipients(uuid) to service_role;
grant execute on function public.get_invite_refresh_recipients() to service_role;
grant execute on function public.get_hang_notification_recipients(uuid) to service_role;
