create extension if not exists pg_cron;

do $$
begin
  begin
    perform cron.unschedule('sakhi-daily-nudges');
  exception when undefined_table then null;
  end;

  begin
    perform cron.schedule(
      'sakhi-daily-nudges',
      '0 9 * * *',
      'select public.create_daily_nudges();'
    );
  exception when undefined_table then null;
  end;
end $$;
