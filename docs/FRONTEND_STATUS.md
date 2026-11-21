# Web Frontend Status

The web experience is a functional local-first demo. It is not a production-connected
client. `VITE_DATA_MODE` defaults to `local`; setting it to `supabase` selects typed
stubs that fail explicitly.

## Implemented in local mode

- Sign-up, local email-code verification, sign-in, password reset, sign-out, route guards,
  profile onboarding, and consent settings.
- Home check-ins; wellbeing logs, score/trends and optional cycle entries; planner and
  priorities; scripted chat, cancellation, memory controls, and crisis support.
- Campus demo content, club/event interactions, placement preparation, resume export,
  Circle posts and moderation reports, buddy requests, blocking, local messages, and
  notification center/preferences.
- Account JSON export and local deletion, responsive navigation, theme toggle, loading,
  empty, error and offline states, PWA shell, and accessibility affordances.

All seeded content is demo-labelled, synthetic, and date-relative. Local registration
does not send email; the verification code is shown in the UI. Local chat is scripted
and does not call an AI provider.

## Supabase work still required

`src/data/adapters/supabase.ts` currently throws a clear not-configured error for every
domain. Implement and verify the Supabase adapters for:

- Auth and profile, including email verification/reset, persistent sessions, and campus
  membership/domain verification.
- Wellness and consent-gated cycle data; planner items and daily top-three persistence.
- Chat, consented memory, and streamed `sakhi-chat` Edge Function responses.
- Campus announcements, clubs, events, saved events, registrations, and placements.
- Circle posts, comments, reactions, connections, direct messages/read receipts, reports,
  and blocks.
- Placement progress, aptitude records, resume data, and mock-interview records.
- Notifications, category preferences, push delivery, data export, and account deletion.

The web adapter does not currently consume `VITE_SUPABASE_URL` or
`VITE_SUPABASE_ANON_KEY`. No service-role key or AI key belongs in the browser. Confirm
that each repository method maps to the migrations and `docs/API.md`; local-only
preferences (daily top three, notification categories, and saved events) need explicit
backend contract alignment.

## Release blockers and risks

- Local data is stored in browser localStorage and is not encrypted. Use synthetic data
  only until the live backend is connected and sensitive-data access is validated.
- Supabase project setup, auth redirect/email templates, Edge Function secrets/CORS and
  rate limits, realtime policies, RLS integration tests, backups, and moderator staffing
  still require deployment-time verification.
- Browser push notifications are not wired; preferences are stored locally only.
- Validate the wellness score and burnout rules with product/clinical safety review.
  The UI describes them as supportive, not diagnostic or medical advice.
- Production hosting must provide SPA route fallback and HTTPS; the browser test does
  not verify deployment-specific PWA installation behavior.

## Checks

- `npm test` — TypeScript, Node tests, and Vitest component tests.
- `npm run lint` — ESLint for web and data-layer source.
- `npm run build` — production web bundle.
- `npm run test:e2e` — sign-up, onboarding, mood check-in, chat, and Circle post flow
  (requires `npx playwright install chromium` once).
