# Sakhi Project Status Audit

**Audit date:** 2026-11-21; security follow-up updated 2026-11-22
**Repository:** `C:\cherry\sakhi_campus_buddy-main\sakhi_campus_buddy-main`
**Branch at initial audit:** `main`
**Scope:** Read-only audit of the repository as it exists on the audit date. The only file created for this task is this report; no code was changed and no commit was made.

## Executive summary

This report began as a baseline audit. A subsequent security-hardening pass has fixed the consent defaults, SQL function permissions, export scope, account deletion cascades, root package advisories, and missing SQL RLS test coverage described below. The web frontend remains a **local demo**: `VITE_DATA_MODE` defaults to `local`, and every method in `src/data/adapters/supabase.ts` remains a stub.

All migrations now apply successfully to the local Supabase database, and all 68 pgTAP assertions pass there. A hosted/staging Supabase project and deployed Edge Functions have not been verified.

**Current launch verdict: NO — do not put real students or real sensitive data on this build.** Local database security tests pass, but the web adapter is still stubbed, hosted Supabase integration is unverified, and browser-local sensitive data is not encrypted.

## Security hardening follow-up (current state)

This addendum is the current evidence for security, dependency, export, deletion, and RLS-test status. Sections 1–9 below preserve the original audit snapshot; where those sections conflict with this addendum, this addendum supersedes them. The original UI and live-backend readiness findings remain applicable.

### Changes committed on `security-hardening`

| Commit | Change |
|---|---|
| `443ff39` | Sensitive consent and discovery default to false; signup creates opt-outs. |
| `f5b5fed` | Harden privileged SQL functions, grants and write policies; make event registration and AI rate limiting safer; restrict Sakhi AI context to consented memory/cycle data and omit wellness logs. |
| `c5767d4` | Complete owner-scoped export coverage and preserve private ownership for anonymous Circle content. |
| `cc4217f` | Cascade account deletion through user data and add a database deletion completeness test. |
| `0c74ee7` | Isolate the old Expo app under `legacy-expo/`, remove its dependencies from the maintained web package, and apply compatible dependency security updates. |
| `6ed158b` | Replace table-existence-only RLS checks with pgTAP integration scenarios. |
| `b9c839e`, `84cd7e7`, `0de62d0` | Make pg_cron scheduling idempotent, correct its guard syntax, and replace a psql-only seed include with valid SQL. |
| `5973949` | Correct pgTAP table assertion signatures and the DM fixture's expected count. |
| `7442b0b` | Fix `get_sakhi_today()` date arithmetic with a new migration. |
| `dd90f2a`, `9bd4719`, `8c27a3b`, `4a70e2f`, `df0231c`, `76570be`, `d798fe9` | Add live cross-user/anon tests; fix recursive club membership RLS, moderator policy scope, and anonymous profile discovery. |

No changes have been pushed. The working branch is `security-hardening`.

### Updated security and privacy status

| Area | Current status and evidence |
|---|---|
| Consent defaults | Implemented in `supabase/migrations/202611210008_privacy_consent_defaults.sql`; AI memory, cycle tracking and discoverability are opt-in for new and existing records. Static tests in `tests/phase2AuthPrivacy.test.js` pass. |
| Consent withdrawal | Database trigger deletes cycle entries and AI memories when their consent is withdrawn; local and live-local pgTAP tests pass. |
| Privileged SQL functions | Migration `202611210009_privileged_function_hardening.sql` applies explicit search paths, caller checks, and restricted execute grants, and prefers invoker rights where feasible. Live-local tests verify anon cannot execute security-definer functions and sensitive RPCs. |
| Export | Export scope now includes the user-owned data domains and is paginated. `Data export covers every SQL table with a user_id column` passes in `tests/phase2AuthPrivacy.test.js`. |
| Account deletion | `supabase/migrations/202611210011_account_deletion_cascades.sql` relies on cascades and nulls retained audit/role references. `supabase/tests/account_deletion.sql` passed all 3 live-local assertions, including the dynamic check across tables with `user_id`. |
| RLS integration tests | `supabase/tests/phase1_rls.sql` (29 assertions) and `supabase/tests/private_data_access.sql` (36 assertions) passed, along with the 3 account-deletion assertions: **68 passed, 0 failed** using `npx supabase test db` against the local database. Coverage includes cross-user SELECT/UPDATE/DELETE, sensitive RPC/view access, anon table/function access, and admin/moderator denial. |
| Migration fixes | Local reset exposed and fixed the pg_cron unschedule guard, psql-only seed include, `date - bigint` streak calculation, recursive club-membership policy, anon-invoked moderator policies, and anon access to discoverable profiles. Database policy/RPC fixes are separate migrations; the unapplied cron migration and seed script were corrected in place. |
| Dependencies | `npm audit --omit=dev` and full `npm audit` both report **0 vulnerabilities** for the root web package after `npm audit fix`. The old Expo app is separated in `legacy-expo/package.json`; it is unsupported and its dependencies are outside the root audit/install graph. Do not treat the archived app as production-safe. |

### Current validation evidence

| Command | Latest result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass |
| `npm test` | Pass: 65 Node tests and 2 component tests |
| `npm run build` | Pass |
| `npm run test:e2e` | Pass: 1 Playwright flow |
| `npm audit --omit=dev` | Pass: 0 findings |
| `npm audit` | Pass: 0 findings in the root package |
| `npx supabase start` | Pass after the migration and seed fixes. |
| `npx supabase db reset` | Pass; all migrations through `202611220004` and the SQL seed completed. |
| `npx supabase test db` | Pass: 68 assertions, 0 failures across 3 SQL test files. |

### Remaining launch blockers

1. Keep the application local-demo-only until all web Supabase repository methods are implemented and tested against staging.
2. Apply the migrations and run the SQL suite against a staging Supabase project; current database evidence is local-only.
3. Verify the complete auth, consent, export, deletion, and chat flows against a hosted Supabase project; Edge Function deployment and live provider behavior remain unverified.
4. Sensitive browser-local data remains unencrypted; do not collect real wellness, cycle, chat, or identity data in local mode.
5. `legacy-expo/` is archived and unsupported. Its separate dependency tree is not included in the root npm audit result.

## 0. Required command and repository output summary

The following table records the **initial, pre-hardening audit baseline**, not the current results. See the follow-up section above for revalidation:

| Command/check | Result |
|---|---|
| `npm run typecheck` | Passed (`tsc -p tsconfig.web.json --noEmit`). |
| `npm run lint` | Passed. ESLint covers `src/web` and `src/data`, not the complete repository. |
| `npm test` | Passed: 55 Node tests and 2 Vitest component tests. Node emitted existing `MODULE_TYPELESS_PACKAGE_JSON` warnings for ESM-style test files. |
| `npm run build` | Passed: TypeScript web check and Vite production build completed. |
| `npm run test:e2e` | Passed: 1 Playwright flow, sign-up → onboarding → mood → chat → Circle post. |
| `npm audit --omit=dev` | **Failed:** 18 advisories: 9 moderate, 8 high, 1 critical. Critical: `shell-quote`. High affected packages: `@expo/cli` (via `glob`, `zod`), `brace-expansion`, `compression`, `decode-uri-component` (through `query-string` / `expo-router`), `expo-router`, `node-forge`, `query-string`, and `zod`. The suggested `expo-router` remediation is a major-version update (`58.0.32`), so do not apply `npm audit fix --force` blindly. |
| Git status | Clean at the start and before writing this report: `## main...origin/main`. |
| Current branch | `main`. |
| Last 5 commits | `6fcf56c Steps 2-12: complete web frontend`; `301ac62 Step 1: web foundation`; `54cdb5f feat: add Phases 3-6 Sakhi backend capabilities`; `ce9af43 $feat: add Phase 2 auth privacy and account edge functions`; `ba65d55 $feat: add Phase 1 database migrations and RLS policies`. |

### Secret and environment-file checks

- `.env` exists locally and is ignored by `.gitignore`; `git ls-files` contains `.env.example`, not `.env`. The report does not include any `.env` values.
- A name-only inspection of `.env` showed configuration names for the old Expo/server setup, including AI and database variables. This is not evidence that their values are safe; it only confirms the file was not printed or committed.
- High-confidence key/token/private-key searches reported no actual credential matches in the scanned working tree/history. A broader tracked-file pattern search matched only `safe-demo-password` in the E2E and local-adapter test fixtures (`tests/e2e/signup-flow.spec.ts`, `tests/web-foundation.test.ts`). These are synthetic test values, not production credentials.
- No `gitleaks`, `trufflehog`, or `detect-secrets` executable was available. The scans are not a substitute for a dedicated secret scanner. The ignored `.env` was intentionally not searched for or displayed; only its variable names were inspected.
- `Ruchitha` / `Ruchita` did not match in the repository search.

## 1. Frontend features, per screen and flow

`STUB` below means the feature is local-demo-only, even when the demo behavior is implemented and tested. Test evidence is identified per row; the E2E flow tests only the listed happy path.

| Feature | Status | What works | Demo-only / missing | Test evidence |
|---|---|---|---|---|
| Sign up and sign in | STUB | Local email/password sign-up and sign-in; passwords are PBKDF2-hashed in browser storage; sign-in checks the local credential. | No Supabase Auth session, server-side authentication, or protection of local browser data. | Source: `src/web/pages/auth.tsx`, `src/data/adapters/local.ts`; `local auth verifies email, preserves the user id, and updates the password` in `tests/web-foundation.test.ts`; E2E signup flow. |
| Email verification | STUB | Local code is generated and displayed in the verification screen; unverified local users cannot sign in. | No email is sent. The code is exposed in the UI and is not an email-verification security flow. | Source: `src/web/pages/auth.tsx`, `src/web/auth/auth-provider.tsx`; same local auth test; E2E signup flow. |
| Password reset | STUB | Local password can be replaced when the account email is known. | No reset email, proof of mailbox ownership, expiration, or server-side reset token. | Source: `src/web/pages/auth.tsx`, `src/data/adapters/local.ts`; local auth test in `tests/web-foundation.test.ts`. |
| Sign out and route guards | STUB | Session/profile guards redirect between auth, onboarding, and the app; sign-out clears the local session and query data. | All guards use the local adapter; no backend session persistence or refresh handling. | Source: `src/web/auth/route-guards.tsx`, `src/web/auth/auth-provider.tsx`; `authPhase1.test.js` route-guard tests; E2E covers successful sign-up/onboarding. |
| Onboarding and profile | STUB | Collects name, optional pronouns, campus, course, year, interests, and goals; no hardcoded real user name was found. | Only synthetic demo campus options exist. No live campus verification is wired into the UI. | Source: `src/web/pages/onboarding.tsx`; E2E fills the onboarding form; no dedicated full onboarding component test. |
| Consent choices | STUB | Onboarding and settings expose AI memory, cycle tracking, and discovery choices; local adapter gates cycle/memory and deletes their local rows when consent is withdrawn. | Local-only enforcement. Database discovery defaults conflict with the UI’s opt-in promise (see Security). | Source: `src/web/pages/onboarding.tsx`, `src/web/pages/settings.tsx`, `src/data/adapters/local.ts`; `cycle and AI memory data require consent and are cleared when consent is withdrawn` in `tests/web-foundation.test.ts`; static `phase2AuthPrivacy.test.js` checks SQL/function text. |
| Home / “Today for you” | STUB | Local mood, water, sleep, plan items, score, streak, nudges, demo opportunity and demo announcement. | Not the backend `get_sakhi_today` RPC; no real classes, deadlines, opportunities, or campus facts. Loading/error behavior is uneven; no Home-specific component test. | Source: `src/web/pages/home.tsx`; E2E checks the mood interaction; local summary test covers score bounds. |
| Talk to Sakhi: scripted response | STUB | Local intent templates; replies appear word-by-word; crisis path provides Tele-MANAS `14416` and a trusted-person prompt. | No live AI from the web app. “Streaming” is simulated locally. Backend function has separate limitations in section 4. | Source: `src/web/pages/chat.tsx`, `src/data/adapters/local.ts`; `local chat streams crisis support with a trusted-person prompt`; E2E sends one scripted study prompt. |
| Talk to Sakhi: stop / retry | PARTIAL | Stop aborts the local generator. Conversation-load errors have a “Retry loading conversation” button. | There is no retry-last-response control. `lastMessage` is assigned but never used. Retry only reloads history, not a failed answer. | Source: `src/web/pages/chat.tsx`; no focused stop/retry component test; only scripted chat E2E. |
| Crisis support | STUB | Local distress phrase path displays a support card and call link for Tele-MANAS. | Keyword detection is not comprehensive or clinically validated; no configured campus counsellor or trusted-contact workflow. | Source: `src/web/pages/chat.tsx`, `src/data/adapters/local.ts`; `local chat streams crisis support with a trusted-person prompt`; static `phase345.test.js` checks source text only. |
| AI memory manager | STUB | With consent, can list, add, edit and delete local memory entries. | Local-only and unencrypted; no AI-generated memory/summarization. No web retry/error boundary for each query path. | Source: `src/web/pages/chat.tsx`, `src/data/adapters/local.ts`; local consent test covers create/withdraw behavior, not all manager interactions. |
| Wellbeing logging and score | STUB | Local mood, sleep, water, steps, activity; score breakdown, 7/30-day trend and disclaimers. | Local calculations only. SQL score is also simplistic (activity/rest/social components are zero; mood is a coarse fixed component). Not validated for health use. | Source: `src/web/pages/wellbeing.tsx`, `src/data/adapters/local.ts`; `local wellness summary excludes empty seed logs and bounds the score`; E2E records a mood. |
| Cycle tracking | STUB | Explicit local consent, start-date/note entry, delete, and withdrawal deletion. | No calendar visualization, predictions, clinical review, or encrypted storage. | Source: `src/web/pages/wellbeing.tsx`, `src/data/adapters/local.ts`; local consent test; static SQL-text tests only for backend. |
| Planner | STUB | Local day/week views, classes/tasks/exams/breaks, daily top-three and focus timer. | No server persistence, scheduled reminders, or notification delivery. | Source: `src/web/pages/planner.tsx`, `src/data/adapters/local.ts`; `daily top-three priorities allow up to three valid items per date`; no planner screen E2E. |
| Campus announcements | STUB | Synthetic local campus notices with trust badges and loading/error/empty UI. | No verified campus source or live backend data. | Source: `src/web/pages/campus.tsx`, `src/data/adapters/local.ts`; local demo content test. |
| Campus Q&A | MISSING | No web Q&A screen or Q&A repository contract was found. | The requested Campus Q&A feature is not started in this web frontend. | Absence confirmed in `src/web/pages/campus.tsx` tabs and `src/data/contracts.ts`; no test. |
| Clubs | STUB | Local demo join/leave controls and trust labels. | No live memberships, club lead moderation, or verified campus listings. | Source: `src/web/pages/campus.tsx`, `src/data/adapters/local.ts`; no focused UI test. |
| Events | STUB | Local save/register UI; local adapter can mark registrations `registered` or `waitlisted`. | No backend transaction guarantee or cancellation UI. SQL waitlist logic has concurrency risk. | Source: `src/web/pages/campus.tsx`, `src/data/adapters/local.ts`; static `phase345.test.js` checks for capacity strings; no live capacity test. |
| Placements and prep tracker | STUB | Synthetic opportunities, local registration, DSA/aptitude progress, resume editor, mock-interview practice. | No real companies or verified placement facts. Interview uses the scripted local chat adapter, not an assessment. | Source: `src/web/pages/placements.tsx`, `src/data/adapters/local.ts`; no focused placement UI test. |
| Resume PDF | PARTIAL | Resume preview uses the browser print dialog (`window.print`) so the user can choose “Save as PDF.” | Not a generated/downloaded PDF with layout guarantees. | Source: `src/web/pages/placements.tsx`; no focused PDF test. |
| Circle posts/comments/reactions | STUB | Local post creation, anonymous display, comments, heart reactions, trust badges. | Browser-local only; no real moderation or multi-user feed. No edit/delete post or comment controls. | Source: `src/web/pages/circle.tsx`, `src/data/adapters/local.ts`; E2E publishes one post; no focused comments/reactions tests. |
| Circle reports and blocks | STUB | Local report record and block list; blocked demo peers are hidden and local sends are rejected. | No functioning moderator queue or live enforcement. Browser `confirm` is used for block confirmation. | Source: `src/web/pages/circle.tsx`, `src/data/adapters/local.ts`; static SQL regex tests; no end-to-end report/block test. |
| Buddy discovery / connections | STUB | Consent-gated synthetic demo profiles and local connection requests. | Not matching real users; no safety review or genuine acceptance workflow. | Source: `src/web/pages/circle.tsx`, `src/data/adapters/local.ts`; no focused UI test. |
| Direct messages | STUB | Local send/read state, unread count, block check and read button. | No realtime transport, server persistence, participant login, or multi-device inbox. | Source: `src/web/pages/circle.tsx`, `src/data/adapters/local.ts`; static SQL regex test only; no live realtime test. |
| Notifications and preferences | STUB | Local inbox, mark-read, mark-all-read and category preferences. | No push delivery; preferences do not schedule or suppress actual notifications. | Source: `src/web/pages/notifications.tsx`, `src/web/pages/settings.tsx`, `src/data/adapters/local.ts`; no focused UI test. |
| Settings | STUB | Local profile editing, consent, notification preference, export, sign-out and deletion controls. | Not backed by Supabase. Uses native browser confirmations rather than accessible app dialogs. | Source: `src/web/pages/settings.tsx`; local adapter tests cover export/deletion and consent mechanics; not the settings screen end-to-end. |
| Export my data | STUB | Local adapter downloads user-scoped JSON. | Supabase adapter is a stub. Backend `export-my-data` omits several user data domains (section 4). | Source: `src/web/pages/settings.tsx`, `src/data/adapters/local.ts`, `supabase/functions/export-my-data/index.ts`; `local account export is scoped to the signed-in user and deletion clears browser data`; static export source test. |
| Delete account | STUB | Local deletion removes Sakhi local-state keys, theme, and in-memory state. | No frontend invocation of the Edge Function; backend deletion can fail in some FK cases (section 4). | Source: `src/web/pages/settings.tsx`, `src/data/adapters/local.ts`, `supabase/functions/delete-account/index.ts`; same local account test; static function-text test only. |
| Privacy page | PARTIAL | Explains local storage, opt-ins, health disclaimers and unconnected Supabase adapter. | It is product copy, not a reviewed/published privacy policy or terms of service. | Source: `src/web/pages/privacy.tsx`, `docs/PRIVACY.md`; no focused test. |
| PWA | PARTIAL | Manifest, production service-worker registration, app-shell/navigation caching and offline fallback exist. | No automated installability/offline-browser test, Web Push, VAPID flow or release hosting verification. | Source: `index.html`, `public/manifest.webmanifest`, `public/sw.js`, `src/web/main.tsx`; build passes; no PWA-specific test. |

## 2. Quality and accessibility

| Area | Status | Evidence and limitations |
|---|---|---|
| Loading, empty, error states | PARTIAL | Shared skeleton/empty/error components exist in `src/web/components/ui.tsx` and are used by page files. Coverage is inconsistent: some errors only show a message, some queries are omitted from a page’s loading/error aggregate, and there is no systematic test for every state on every screen. |
| Offline behavior | PARTIAL | `src/web/components/offline-banner.tsx` observes browser online/offline and `?demoOffline`; `src/data/adapters/preferences.ts` supplies the simulated status. Local reads/writes still operate from `localStorage`. This is not an offline write queue or sync/conflict strategy. `?demoError` simulates failures in `src/data/adapters/local.ts`. |
| Dark mode | PARTIAL | `src/web/components/app-shell.tsx` toggles a persisted light/dark theme and `src/web/styles.css`/components use theme tokens. No automated contrast/high-contrast audit was found. |
| Responsive layouts | PARTIAL | Desktop sidebar and mobile bottom navigation are implemented in `src/web/components/app-shell.tsx`; `tests/e2e/signup-flow.spec.ts` exercises a 390px viewport for Circle only. Tablet and full-page responsive testing are absent. |
| Keyboard/screen readers | PARTIAL | Shared controls in `src/web/components/ui.tsx` have focus styles and 44px minimum buttons; many icon-only buttons are labelled and scores/charts use accessible text. `tests/components/ui.test.tsx` verifies one label and keyboard-triggered button action. No broad screen-reader or keyboard-navigation audit exists. |
| Touch targets | PARTIAL | Shared buttons in `src/web/components/ui.tsx` and several navigation controls meet a 44px minimum; not every bespoke link/control has been measured. |
| Reduced motion | PARTIAL | Skeleton animation in `src/web/components/ui.tsx` respects `motion-reduce`; no repository-wide reduced-motion audit or test was found. |
| Destructive confirmations | PARTIAL | `window.confirm` is used in `src/web/pages/settings.tsx`, `wellbeing.tsx`, `planner.tsx`, `chat.tsx` and `circle.tsx`. This is browser-native and not an accessible, styled confirmation/undo flow. No `window.alert` was found in the web source. Legacy Expo code uses React Native `Alert.alert` in `app/profile.tsx`. |
| Error boundary / telemetry | PARTIAL | `src/web/components/error-boundary.tsx` catches rendering errors and logs error plus component stack to `console.error`; there is no crash-reporting service or analytics hook. Whether unexpected error objects could contain user data is UNVERIFIED. |

## 3. Data layer

The contract is in `src/data/contracts.ts`. The local adapter implements the interfaces using a single JSON record in `localStorage`, demo fixtures, 180ms simulated latency, and optional `?demoError` / `?demoOffline` behavior (`src/data/adapters/local.ts`, `src/data/adapters/preferences.ts`). It is useful for a local prototype, not a secure or multi-user production store. Sensitive records and password hashes are in browser storage without encryption. Offline writes are not queued for later synchronization.

**Supabase adapter status is `STUB` for every repository method below.** Each method calls `unavailable()` and throws; only theme/runtime preferences are browser-local, not Supabase-backed. Until these are implemented, do not set `VITE_DATA_MODE=supabase`.

| Domain | Local adapter | Supabase methods still to implement |
|---|---|---|
| Auth | Demo-only | `signUp`, `signIn`, `verifyEmail`, `resetPassword`, `signOut`, `currentUser` |
| Profile | Demo-only | `get`, `save`, `listCampuses`, `listInterests`, `listInterestOptions` |
| Wellness / cycle | Demo-only | `listLogs`, `saveLog`, `getSummary`, `listCycleEntries`, `saveCycleEntry`, `deleteCycleEntry` |
| Planner | Demo-only | `list`, `create`, `update`, `remove`, `getDailyTopThree`, `setDailyTopThree` |
| Placement preparation | Demo-only | `listDsaProgress`, `saveDsaProgress`, `listAptitudeProgress`, `saveAptitudeProgress`, `getResumeData`, `saveResumeData`, `listMockInterviews`, `saveMockInterview` |
| Chat / memory | Demo-only scripted chat | `list`, `streamReply`, `listMemories`, `saveMemory`, `updateMemory`, `deleteMemory` |
| Campus | Demo-only | `listAnnouncements`, `listClubs`, `listClubMemberships`, `joinClub`, `leaveClub`, `listEvents`, `listEventRegistrations`, `listSavedEvents`, `saveEvent`, `registerEvent`, `listPlacements`, `listPlacementRegistrations`, `registerPlacement` |
| Circle / safety | Demo-only | `listPosts`, `createPost`, `listComments`, `createComment`, `listReactions`, `toggleReaction`, `listConnections`, `listDiscoverableProfiles`, `listBlockedUsers`, `requestConnection`, `listMessages`, `markMessagesRead`, `sendMessage`, `report`, `block` |
| Notifications | Demo-only | `list`, `markRead`, `markAllRead`, `getPreferences`, `updatePreferences` |
| Consents | Demo-only | `get`, `update` |
| Account | Demo-only | `exportData`, `deleteAccount` |

There are **74 throwing Supabase repository methods** across these domains. The frontend also has contracts for saved events, daily top-three priorities and notification preferences, which do not have corresponding persisted tables in the migrations. `src/types/database.ts` includes many table row types, but its `Functions` map is `never`, all listed `Relationships` are empty, and it omits the migrated `push_subscriptions` table. The repository has no evidence that these types were regenerated from the final schema.

## 4. Backend (Supabase)

**No live database or deployed Edge Function verification was established.** `supabase` CLI was not installed/on `PATH`; `supabase status` therefore could not be run. `supabase/tests/phase1_rls.sql` contains eight `has_table` assertions only. `tests/phase1Rls.test.js`, `tests/phase2AuthPrivacy.test.js`, and `tests/phase345.test.js` mainly match source strings/regular expressions; they do not execute SQL policies or Edge Functions against PostgreSQL.

| Area | Status | Evidence |
|---|---|---|
| Migrations / schema | PARTIAL | Seven versioned files exist in `supabase/migrations/`: delete RPC, core schema, RLS, demo seed, auth/privacy, phase 3–5 functions/tables, and cron job. They have not been applied/validated against Supabase in this audit. `server/supabase/schema.sql` remains a legacy schema and is not the migration source of truth. |
| RLS policies | PARTIAL | Policies exist for all core tables and later tables have RLS enabled. Static policies restrict wellness and conversations by `auth.uid()`, and cycle/memory by owner plus consent. Real cross-user/admin/blocked-user behavior has not been tested; see concrete policy defects below. |
| Auth signup trigger | PARTIAL | `handle_new_user` creates profile, consent and student role. No live signup/trigger test. Auth uses email confirmation in `supabase/config.toml`; production redirect is still `https://YOUR_PRODUCTION_DOMAIN/**`. Google OAuth is disabled. |
| Campus verification | PARTIAL | SQL functions compare a campus email domain and create a membership. No live test or frontend adapter. `campus_memberships` owner policies do not constrain the submitted role or `verified_at`. |
| Consent withdrawal | PARTIAL | SQL trigger deletes cycle entries/memories on withdrawal; the `consent` Edge Function validates allowed fields and booleans. Static tests only; no deployed consent/delete test. |
| Account deletion | PARTIAL | `delete-account` verifies a user JWT then uses server-side `SUPABASE_SERVICE_ROLE_KEY` to delete the Auth user; SQL RPC also deletes many dependent rows. No live test; audit-log/moderator foreign keys can prevent profile deletion, and some records are not explicitly handled. |
| Data export | PARTIAL | `export-my-data` uses the caller’s JWT/RLS and filters listed rows to that user. Its table list is incomplete: no club memberships, event/placement registrations, authored posts/comments, reactions, reports, blocks, DSA/aptitude progress, resume, mock interviews or push subscriptions. No live scope test. |
| Sakhi AI Edge Function | PARTIAL | `sakhi-chat` verifies JWT, limits request body to 16KB, caps message text at 4,000 chars, has provider retries/fallback, a 700-token provider limit, simple moderation and a crisis response. It has no live test, sends wellness rows to the AI provider without a separate wellness-context consent, uses a mutable/racy rate-limit table, and its “stream” is one complete SSE chunk. Stream requests skip conversation inserts. Provider conversation insert errors are ignored. |
| Social/safety RPCs | PARTIAL | Join/leave club, event/placement registration, request connection, block, report throttle and audit inserts exist. Direct table RLS can bypass some RPC safeguards; event capacity is not concurrency-safe. No moderation staffing/queue UI or live test. |
| Wellness/mentor RPCs | PARTIAL | `get_wellness_summary`, `detect_burnout`, and `get_sakhi_today` exist. Score components are mostly coarse/fixed, no clinical/product validation, and no live behavior test. |
| Scheduled jobs | PARTIAL | `pg_cron` migration schedules daily nudges. There are no evidenced deadline reminders or expired-data cleanup jobs. The cron migration and execution have not been verified. |
| Realtime | PARTIAL | Migration adds `direct_messages` and `notifications` to `supabase_realtime`; no frontend subscription exists because the Supabase adapter is a stub. No live RLS/realtime test. |
| TypeScript database types | PARTIAL | `src/types/database.ts` has row types, but lacks RPC signatures and `push_subscriptions`, and relationships are empty. No type generation command or live-schema comparison was run. |
| CI | PARTIAL | `.github/workflows/ci.yml` runs Node 20, `npm ci`, TypeScript, lint and `npm test`. It omits production build, Playwright E2E, migration validation, live/local Supabase tests, and `npm audit`. |

## 5. Security and privacy

### RLS: what the policies currently say

- `wellness_logs` and `sakhi_conversations` have owner-only row policies. `cycle_entries` and `sakhi_memories` require both owner identity and the corresponding consent row. There is no moderator/admin read policy on those tables. This is positive source-code evidence, **not proof from a running database**.
- Direct-message select is participant-only; inserts check the block predicate. There is no live test. The recipient update policy is row-scoped but not column-scoped, so a recipient with update permission may alter fields beyond `read_at`.
- RLS does not protect against a Supabase project owner/service-role key; such credentials bypass ordinary RLS. The browser does not need or contain a service-role key.

### Ranked risks

**Critical — do not launch**

1. **The web app is not connected to the backend.** Every Supabase adapter call throws. A real user would be using a browser-local demo with no server account boundary.
2. **Discovery is not opt-in in the database defaults.** `profiles.discovery_visible` and `consents.discovery_visible` both default to `true` in `supabase/migrations/202611210002_phase1_core_schema.sql`, while onboarding/UI say discovery starts off. The signup trigger creates the default consent row. The profile select policy in `supabase/migrations/202611210003_phase1_rls.sql` exposes discoverable profiles. A newly created backend account can therefore be discoverable without a recorded opt-in.
3. **A `SECURITY DEFINER` routine can write notifications for all users without an auth check.** `create_daily_nudges()` in `supabase/migrations/202611210006_phase345_backend.sql` loops over every profile and inserts rows; it has no `auth.uid()` check and no explicit `REVOKE`/restricted `GRANT` in the migration. PostgreSQL functions normally grant execute to `PUBLIC` unless changed. Verify actual grants in the target project and revoke/restrict this routine before launch.
4. **No live RLS/security test evidence.** `supabase/tests/phase1_rls.sql` only asserts table existence and `tests/phase1Rls.test.js`, `tests/phase2AuthPrivacy.test.js` and `tests/phase345.test.js` inspect migration/function text. Claims about admin isolation, blocks, and consent enforcement have not been proven against PostgreSQL.

**High**

5. **Client-mutable security/trust fields.** Policies in `supabase/migrations/202611210003_phase1_rls.sql` constrain profile updates only by `id`, not columns such as `verified`, `campus_id`, or campus verification state. Membership insert/update checks only `user_id`, not `role` or `verified_at`. Post/comment owner insert/update checks only author identity, allowing clients with table privileges to submit/change `trust_label` and `moderation_status`. This undermines campus verification, trust badges and moderation state.
6. **AI rate limit is not authoritative.** The owner `FOR ALL` policy for `sakhi_ai_rate_limits` is in `supabase/migrations/202611210006_phase345_backend.sql`; `supabase/functions/sakhi-chat/index.ts` uses a user-scoped read-then-upsert and ignores errors. There is no IP-based rate limit. Requests may bypass or race the intended 20/minute limit.
7. **Sensitive wellness context is sent to the configured AI provider without separate consent.** `supabase/functions/sakhi-chat/index.ts` always fetches recent wellness logs into provider context. Consent checks gate memory/cycle rows only. A student chatting with Sakhi can therefore have mood/sleep/hydration/activity sent to a third-party provider without a specific context-sharing choice.
8. **Export is incomplete.** `supabase/functions/export-my-data/index.ts` omits multiple user-owned/social/placement records listed in section 4, so it is not a complete export of the product’s stored data.
9. **Deletion may fail for users referenced by audit/moderation rows.** `audit_log.actor_id` and `reports.moderator_id` in `supabase/migrations/202611210002_phase1_core_schema.sql` reference profiles without `ON DELETE SET NULL`; `delete_current_user()` in `supabase/migrations/202611210005_phase2_auth_privacy.sql` does not clear those references. Deleting the profile/auth user can be blocked by those foreign keys. No live deletion test exists.
10. **Demo listings can carry a “Verified” badge.** The demo event and placement in `supabase/migrations/202611210004_phase1_seed.sql` use `trust_label = 'verified'` while their content is explicitly synthetic. A trust badge can imply real verification despite demo labels.
11. **Content moderation visibility is weak.** Public post/comment read policies in `supabase/migrations/202611210003_phase1_rls.sql` exclude `deleted` but do not exclude `reported` or `under_review`. There is no moderator-only policy that restricts moderators to reported content; reported content is generally public already. Owner policies also allow content status/trust edits unless column permissions or RPCs constrain them.
12. **Event-capacity enforcement is bypassable/racy.** Registration table RLS in `supabase/migrations/202611210003_phase1_rls.sql` allows users to insert/update their own registration directly; it does not force the capacity RPC. `register_event()` in `supabase/migrations/202611210006_phase345_backend.sql` counts then inserts without locking the event row, so concurrent registrations may exceed capacity.
13. **Browser local data is unencrypted.** Wellness, cycle, chat, memories, profile and local auth data are serialized into `sakhi.web.local.v2` in `src/data/adapters/local.ts`. The local password hash uses PBKDF2, but that does not encrypt the rest of the record or protect against device/browser access.
14. **Critical/high dependency advisories.** `npm audit --omit=dev` reports 1 critical and 8 high findings; some remediation paths require a major Expo Router update. Audit and upgrade the dependency graph before release.

**Moderate / operational**

15. AI moderation is a few keyword/regex checks, not robust input/output moderation. Crisis detection can miss paraphrases; it is not a clinical detection system.
16. The Edge Function does not provide true token-by-token streaming, does not persist stream conversations, does not write consented memories or summarize history, and does not port the structured response parser. The local UI and backend implementation are not equivalent.
17. The Node `server/` chat endpoint is a legacy reference, not the web backend. It has no JWT auth, body-size limit, rate limiter, or CORS/security-header setup; `readJson` accumulates the whole request. Do not deploy it publicly as an alternative to the Edge Function.
18. `supabase/config.toml` contains a production URL placeholder and Google OAuth is disabled. There is no approved/published terms document or configured counsellor contact. Web Push is not implemented despite a `push_subscriptions` table and deployment notes mentioning VAPID.

## 6. MANUAL tasks I must do (in order)

These steps require a real Supabase account/project and external hosting/provider decisions. Do **not** switch the app to Supabase mode until the adapters are implemented.

1. **Create separate Supabase projects** for development, staging and production. Keep production credentials separate. The repository has no verified project link.
2. **Install/use the Supabase CLI, authenticate and link a project.** The CLI is absent on this machine. Once installed, run:
   ```bash
   supabase login
   supabase link --project-ref <PROJECT_REF>
   ```
3. **Review and fix migrations/RLS before applying them.** In particular discovery defaults, role/verification columns, content trust/status fields, `create_daily_nudges` execution grants, rate-limit authority, capacity registration and deletion foreign keys. Do not apply the current set to production as-is.
4. **Apply the reviewed migrations and verify schema state:**
   ```bash
   supabase db push
   ```
   The labelled demo data is migration `202611210004_phase1_seed.sql` and is applied as part of the migration history. Confirm that the target dataset is intentionally demo-only before enabling it.
5. **Run real database tests** against a local Supabase stack and then staging. Expand `supabase/tests/phase1_rls.sql` to assert real two-user/admin/moderator/DM/block/consent behavior. Current file has only `has_table` checks. Capture passing `supabase test db` output before launch.
6. **Set Edge Function secrets** in the project (never in Vite/Expo/browser variables). The code consumes Supabase URL/anon key, `SUPABASE_SERVICE_ROLE_KEY`, `SAKHI_CORS_ALLOWLIST`, `AI_ENDPOINT`, `AI_API_KEY`, `AI_MODEL`, and optional fallback endpoint/key. Example shape; replace placeholders through a safe secret-entry process:
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<server-secret> SAKHI_CORS_ALLOWLIST=https://<production-origin> AI_ENDPOINT=<provider-endpoint> AI_API_KEY=<provider-secret> AI_MODEL=<model>
   ```
   `AI_PROVIDER` is documented but not read by `supabase/functions/sakhi-chat/index.ts`. Do not assume it selects a provider.
7. **Deploy Edge Functions only after tests pass:**
   ```bash
   supabase functions deploy consent
   supabase functions deploy delete-account
   supabase functions deploy export-my-data
   supabase functions deploy sakhi-chat
   ```
   Then verify JWT rejection, CORS allow/deny, deletion, full export scope, request limits, rate limits and provider failure behavior in staging.
8. **Configure Auth in Supabase Dashboard.** Set the real Site URL and exact local/staging/production redirect URLs; replace `YOUR_PRODUCTION_DOMAIN` in config. Configure/verify email confirmation and password recovery templates/provider. Google OAuth is currently disabled; configure provider credentials and redirect URLs only if it is required.
9. **Implement and test the web Supabase adapter before setting environment variables.** Only then provide `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_DATA_MODE=supabase`. The current adapter will throw on all operations even when those variables exist.
10. **Configure database scheduling and backups.** Confirm `pg_cron` is available and the daily job actually ran; the current migration schedules only daily nudges. Configure PITR/backups in Dashboard and perform a restore test in staging. Deadline reminders and data cleanup still need implementation.
11. **Decide on push and safety operations.** VAPID keys, subscription registration, delivery functions and preference enforcement do not exist. Configure real campus counsellor/trusted-contact behavior and moderator staffing/escalation procedures; the current app has only generic copy and Tele-MANAS.
12. **Publish legal/support information.** `docs/PRIVACY.md` is an engineering draft, not proof of legal review or publication. There is no terms-of-service document in `docs/`. Approve and publish privacy policy, terms, support contact, retention/deletion exception policy, and crisis escalation details.
13. **Deploy hosting/domain.** Configure HTTPS, SPA route fallback for React Router, production origin allowlists, and verify install/offline behavior on the deployed PWA. No production hosting/domain was verified.

## 7. Remaining development work

### BLOCKERS for launch

| Work | Size | Why |
|---|---|---|
| Implement all 74 Supabase adapter methods and real web auth/session persistence | Large | The current web app is entirely local-demo-only. |
| Fix and execute RLS/SQL authorization tests against Supabase | Large | Existing SQL test does not test access outcomes; there are concrete authorization gaps. |
| Change discovery defaults to explicit opt-in and test signup privacy defaults | Small | Current database defaults contradict consent UI. |
| Restrict privileged SQL function execution; protect verification/trust/moderation columns; make rate limiting server-authoritative | Large | Prevents unauthorized global writes, self-verification/trust manipulation, and rate-limit bypass. |
| Define AI data-sharing consent and avoid sending health context absent consent; complete true streaming, persistence, moderation and output contract | Large | Sensitive context currently reaches provider without separate consent; current streaming is incomplete. |
| Complete export and make account deletion reliable, including audit/moderation FK behavior | Medium | Required privacy rights are incomplete/unverified. |
| Resolve 1 critical and 8 high production dependency advisories without breaking Expo | Medium | Dependency supply-chain risk; Expo Router remediation may be a major update. |
| Remove local-only storage for real sensitive records or provide suitable encryption and a reviewed retention plan | Large | Current browser storage is plaintext and device-accessible. |
| Configure real project, auth, secrets, CORS, hosting, backups and moderation operations | Medium | External manual release requirements are unmet. |

### IMPORTANT

| Work | Size | Why |
|---|---|---|
| Add real report queue/workflow, moderation status transitions, audit behavior and spam controls | Large | Current reports are records without a tested moderation operation. |
| Make event capacity/waitlist atomic and force registration through a safe RPC | Medium | Prevents capacity bypass/oversubscription. |
| Implement deadline reminders, notification scheduling/preferences and Web Push end-to-end | Large | Current notification preferences are local-only. |
| Add frontend Q&A or explicitly remove it from the promised scope | Medium | Requested campus Q&A is absent. |
| Add focused UI/component tests for wellbeing, planner, Circle, privacy, settings, dialogs, failures and mobile/tablet states | Medium | Current UI coverage is one shared-component test suite and one happy-path E2E flow. |
| Expand CI to include build, E2E, migration validation and dependency audit; use a supported Node version consistently | Medium | Current workflow misses release-critical checks. |
| Validate wellbeing score, burnout threshold, crisis support copy and accessibility with qualified reviewers | Medium | Current logic is coarse and not clinically validated. |
| Replace `window.confirm` with accessible dialogs and add undo/confirmation flows consistently | Small | Browser-native prompts are inconsistent with the stated UX/accessibility requirements. |

### NICE-TO-HAVE

| Work | Size | Why |
|---|---|---|
| Add real campus fact sourcing and source citations for campus content | Large | Needed before displaying anything that could be mistaken for official information. |
| Add tablet-specific layouts, broad screen-reader testing and automated visual/a11y checks | Medium | Current responsiveness/accessibility checks are limited. |
| Add crash reporting with PII/health-data filtering | Medium | Current error handling only logs to browser console. |
| Improve local demo resilience, browser-storage quota handling and explicit data-clear tooling | Small | Helps demo users but does not replace production storage. |

## 8. Mismatches and risks

1. **Web and backend are not connected:** UI and hooks use repositories, but `supabase.ts` contains throwing placeholders. Setting `VITE_SUPABASE_*` does not connect the app.
2. **Environment contract mismatch:** `docs/API.md` describes `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`; the web client is Vite and its future variables are `VITE_*`. `README.md` and `docs/FRONTEND_STATUS.md` acknowledge the Vite vars are unused.
3. **Consent defaults disagree:** local UI/state starts discovery off, while SQL consent/profile defaults set `discovery_visible=true`.
4. **Verified badge on synthetic data:** SQL demo event and placement are synthetic but marked `verified`.
5. **Frontend contract has no Campus Q&A or some backend-supported/moderation workflows.** Conversely, daily top-three, saved events and notification preferences have no matching persisted backend table/API in the migration set.
6. **Type/schema drift:** `push_subscriptions` exists in SQL but not `src/types/database.ts`; the types have no RPC signatures and empty relationship lists.
7. **Demo-only social semantics:** anonymous posts, reports, buddy requests, blocks, read receipts and registration status are all in one browser’s local state, not interactions among real students.
8. **Legacy Expo/server code remains in the same repository:** `app/`, `components/`, `src/services/`, `src/config/`, Expo dependencies and `server/` coexist with the new Vite web app. `server/` is unauthenticated and should not be deployed publicly. This increases maintenance and audit surface.
9. **No real campus/company facts were found in the web seed;** content is labelled demo and relative dates are tested. However, the SQL “verified” demo trust labels are misleading. No `Ruchitha` hardcoded name was found.
10. **No literal TODO/FIXME placeholders were found in the web/data source search.** The Supabase adapter is an explicit throwing stub, not an accidental TODO.
11. **The privacy statement overstates deletion/export completeness** until the backend export omissions and deletion FK behavior are fixed and tested.
12. **Potential optimistic-update edge case:** Home and some other mutations restore cached data only when a previous cached value exists. If no cache existed before an optimistic write, rollback may not restore the empty state. This is not covered by tests.

## 9. Launch readiness verdict

| Area | Status | Blocking launch? | Next action |
|---|---|---:|---|
| Frontend user flows | STUB | Yes | Keep explicitly demo-only until web repositories use a real backend. |
| Supabase frontend adapter | STUB | Yes | Implement and integration-test all repository methods. |
| Database migrations | PARTIAL | Yes | Review/fix and apply only to staging first. |
| Sensitive-data RLS | PARTIAL | Yes | Fix defaults and authorization gaps; run real two-user/admin tests. |
| Auth and campus verification | PARTIAL | Yes | Configure production redirects/email, implement web client, constrain verification fields. |
| Consent/privacy enforcement | PARTIAL | Yes | Correct discovery defaults and add explicit AI-context sharing rules. |
| AI safety and rate limiting | PARTIAL | Yes | Make limits authoritative, minimize context, improve moderation, test the deployed function. |
| Export and deletion | PARTIAL | Yes | Complete export, repair FK/deletion handling, and run live completeness tests. |
| Social moderation and event capacity | PARTIAL | Yes | Implement a real moderation queue and atomic registration path. |
| Dependency audit | PARTIAL | Yes | Resolve 1 critical and 8 high findings and rerun audit/build/tests. |
| PWA, accessibility and UX | PARTIAL | Yes for release quality | Test deployed PWA and complete accessibility/error-state review. |
| CI and release operations | PARTIAL | Yes | Add migrations/E2E/build/audit checks; configure backups and staffing. |

### Can this go to real students today?

**No.** It is a local-only demo with unencrypted browser storage, no functioning web-to-Supabase adapter, unverified database policies, unresolved critical/high dependency advisories, and backend privacy/authorization gaps. Do not collect real wellness, cycle, chat or identity data.

### Five most important next actions

1. Keep production use disabled; create a staging Supabase project and do not point the web app at production.
2. Fix database consent defaults, privileged function grants, role/trust column authorization, AI rate-limit authority and event registration enforcement.
3. Build real RLS/Edge Function integration tests and run them against staging; test deletion/export completeness.
4. Implement the web Supabase adapters and explicitly consent-gate any sensitive context sent to AI.
5. Resolve the critical/high npm advisories, expand CI, and finish operational/legal setup before any student pilot.
