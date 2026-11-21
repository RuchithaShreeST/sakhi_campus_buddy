alter policy "reports creator read" on public.reports to authenticated;
alter policy "reports moderator update" on public.reports to authenticated;
alter policy "audit moderator read" on public.audit_log to authenticated;

alter policy "posts moderators reported read" on public.posts to authenticated;
alter policy "comments moderators reported read" on public.comments to authenticated;
alter policy "clubs moderators reported read" on public.clubs to authenticated;
alter policy "events moderators reported read" on public.events to authenticated;
alter policy "placements moderators reported read" on public.placements to authenticated;
alter policy "announcements moderators reported read" on public.announcements to authenticated;
