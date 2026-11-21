# Sakhi Privacy and Retention Policy

## Ownership and access

Sakhi wellness logs, cycle entries, memories, planner state, conversations, notifications,
and direct messages are restricted to their owner or authenticated participants where
applicable. Administrators and moderators do not receive access to private wellbeing,
cycle, memory, or Sakhi chat rows through RLS.

## Consent

- AI memory is opt-in. Withdrawing consent deletes Sakhi memory rows for the user.
- Cycle tracking is opt-in. Withdrawing consent deletes cycle entries for the user.
- Buddy discovery is opt-in and can be disabled at any time.

## Account deletion

The account deletion function and auth RPC remove user-owned data and the Supabase Auth
identity. Public posts and comments authored by a deleted user are anonymized or removed
as required by the data model. Direct messages are deleted when both participants are
deleted or when a participant requests account removal.

## Export

Export is available only to the authenticated account owner and returns JSON for
the user's profile, consents, wellness, cycle, memory, chat, planner, membership,
connection, direct-message, and notification records.

## Retention

- Private wellbeing, cycle, memory, and chat records remain until deleted by the owner,
  removed after consent withdrawal, or removed through account deletion.
- Report records and audit records required for safety review are retained according to
  a moderation review schedule. Moderators must not receive private wellness, cycle,
  memory, or conversation access.
- Deleted or soft-deleted public content is excluded by RLS.
- Backups are retained only for the Supabase project backup window and are encrypted
  according to the provider's production controls.

## Environment and security

Browser configuration may contain the Supabase URL and anonymous key only. AI keys,
the Supabase service-role key, and provider credentials must remain Edge Function or
server secrets and must never be prefixed with `EXPO_PUBLIC_`.
