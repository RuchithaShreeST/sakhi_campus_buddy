create or replace function public.get_sakhi_today()
returns jsonb
language plpgsql
stable
security invoker
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare
  next_item jsonb;
  top_announcement jsonb;
  streak integer := 0;
  wellness jsonb;
begin
  if auth.uid() is null or auth.role() <> 'authenticated' then
    raise exception 'Authentication required';
  end if;

  select jsonb_build_object('id', id, 'title', title, 'date_key', date_key, 'start_time', start_time)
  into next_item
  from public.planner_items
  where user_id = auth.uid()
    and completed = false
    and deleted_at is null
    and (date_key is null or date_key >= current_date)
  order by date_key asc nulls last, start_time asc nulls last
  limit 1;

  select jsonb_build_object('id', id, 'title', title, 'trust_label', trust_label)
  into top_announcement
  from public.announcements
  where deleted_at is null and moderation_status = 'active'
  order by created_at desc
  limit 1;

  with ordered_dates as (
    select logged_on, row_number() over (order by logged_on desc) as rn
    from (
      select distinct logged_on
      from public.wellness_logs
      where user_id = auth.uid() and deleted_at is null
    ) d
  )
  select count(*)::integer into streak
  from ordered_dates
  where logged_on = current_date - (rn - 1)::integer;

  wellness := public.get_wellness_summary(7);

  return jsonb_build_object(
    'next_item', next_item,
    'wellness_nudge', 'A short pause for water or rest can help.',
    'growth_nudge', 'Choose one small study or placement task.',
    'top_announcement', top_announcement,
    'streak', greatest(streak, 0),
    'wellness', wellness
  );
end;
$$;
