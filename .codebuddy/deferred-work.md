# ClearLah — Deferred Work

## Deferred from: code review of E2-S1 (2026-08-09)

- **API route has no authorization** — auth not implemented for MVP (post-hackathon per architecture AD-3)
- **No Suspense/error boundaries on server components** — project-wide pattern
- **No AbortController on fetch** — accepted for hackathon scope
- **No request body size limit** — Next.js default 4MB limit is adequate
- **localStorage onboarding state has no expiry** — intentional for ephemeral onboarding flow
- **`router.push` failure not handled** — minor edge case detectable in integration testing

## Deferred from: code review of E1-S4 (2026-08-10)

- **No rate limiting on seed endpoint** — Demo-only endpoint guarded by env var. Not needed for hackathon demo scope.
- **DemoSeedButton lacks client-side demo-mode guard** — API route self-guards with `isDemoMode()`. Cosmetic — button only renders when `NEXT_PUBLIC_DEMO_MODE=true`.
