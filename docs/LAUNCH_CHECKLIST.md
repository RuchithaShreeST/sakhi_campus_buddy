# Sakhi Launch Checklist

## Security

- [ ] RLS integration tests pass against a migrated database
- [ ] Admin/moderator cannot read private wellness, cycle, memory or conversation rows
- [ ] Direct-message and block tests pass
- [ ] AI proxy JWT verification is enabled
- [ ] Rate limiting is enabled
- [ ] CORS allowlist contains exact origins only
- [ ] Service-role and AI keys are Edge/CI secrets, never browser variables
- [ ] Point-in-time recovery is enabled and a restore is tested

## Privacy and operations

- [ ] Privacy policy is approved and published
- [ ] Terms are published
- [ ] Moderation staffing and escalation process is active
- [ ] Consent withdrawal has live deletion tests
- [ ] Account export and deletion flows are tested
- [ ] Backup retention and deletion policy are documented
- [ ] Logging excludes personal and health data

## Release

- [ ] Dev, staging and production projects are separated
- [ ] Lovable production origin is configured in Supabase
- [ ] Email verification and password recovery are tested
- [ ] Optional Google OAuth is tested
- [ ] GitHub Actions passes on every PR
- [ ] Store listing, support contact and crisis resources are present
