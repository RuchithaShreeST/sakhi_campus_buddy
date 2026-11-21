# Sakhi Backend API

## Tables

The `supabase/migrations/` folder is the source of truth. Public/shared content tables
include clubs, events, placements, announcements, posts, and comments. Private owner
tables include wellness logs, cycle entries, Sakhi memories, conversations, planner
items, DSA progress, aptitude progress, resume data, and mock interviews.

Every public content item uses `trust_label`:
`official`, `verified`, `community`, or `ai_assisted`.

## Authentication

Use Supabase Auth. The browser may use only `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_ANON_KEY`. The anonymous key is not a secret.

## Edge Functions

- `POST /functions/v1/delete-account` — JWT required; permanently deletes the current account.
- `POST /functions/v1/export-my-data` — JWT required; exports data owned by the current user.
- `POST /functions/v1/consent` — JWT required; updates consent booleans.
- `POST /functions/v1/sakhi-chat` — JWT required; accepts `{ "message": "...", "stream": false }`.

## RPC Functions

- `join_club(club_id)`
- `leave_club(club_id)`
- `register_event(event_id)` — returns `registered` or `waitlisted`
- `register_placement(placement_id)`
- `request_connection(recipient_id, reason)`
- `block_user(user_id)`
- `report_content(target_type, target_id, reason, details)`
- `verify_campus_email(campus_id)`
- `get_wellness_summary(days)`
- `get_sakhi_today()`
- `delete_current_user()`

## Realtime

`direct_messages` and `notifications` are available through Supabase Realtime. RLS
remains authoritative for subscriptions and reads.
