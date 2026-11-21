create extension if not exists pg_cron with schema pg_catalog;

do $$
begin
  if exists (
    select 1
    from cron.job
    where jobname = 'sakhi-daily-nudges'
  ) then
    perform cron.unschedule('sakhi-daily-nudges');
  end;

  perform cron.schedule(
    'sakhi-daily-nudges',
    '0 9 * * *',
    'select public.create_daily_nudges();'
  );
end $$;
