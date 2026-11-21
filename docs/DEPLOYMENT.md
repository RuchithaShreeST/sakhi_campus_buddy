# Supabase and Server Deployment

## Projects

Create separate Supabase projects for:

- Development
- Staging
- Production

Never copy production service-role keys into the Lovable or Expo browser bundle.

## Migrations

Apply versioned migrations through the Supabase CLI:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Deploy Edge Functions:

```bash
supabase functions deploy delete-account
supabase functions deploy export-my-data
supabase functions deploy consent
supabase functions deploy sakhi-chat
```

## Required secrets

- `SUPABASE_SERVICE_ROLE_KEY`
- `SAKHI_CORS_ALLOWLIST`
- `AI_PROVIDER`
- `AI_MODEL`
- `AI_ENDPOINT`
- `AI_API_KEY`
- `AI_FALLBACK_ENDPOINT`
- `AI_FALLBACK_API_KEY`
- Optional Google OAuth client ID and secret
- Optional Web Push VAPID keys

## Backups

Enable Point-in-Time Recovery on production. Test restoration in staging periodically.
Define backup retention and account-deletion exceptions in the production runbook.

## CORS

Set `SAKHI_CORS_ALLOWLIST` to exact Lovable and local origins, comma-separated.
Do not use wildcard CORS for authenticated Edge Functions.
