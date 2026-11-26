-- Secure queue allocation for the admin Edge Function.
create or replace function public.next_topup_queue_number()
returns bigint
language sql
security definer
set search_path = public
as $$
  select nextval('public.queue_number_seq');
$$;

revoke all on function public.next_topup_queue_number() from public, anon, authenticated;
grant execute on function public.next_topup_queue_number() to service_role;
