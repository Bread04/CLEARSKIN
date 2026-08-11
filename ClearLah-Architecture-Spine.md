# ClearLah — Architecture Spine

**Status:** draft
**Date:** 7 August 2026
**Altitude:** Initiative → Features
**Paradigm:** Server-proxied SPA on a full-stack React framework

---

## Paradigm

Next.js 14 App Router. The browser owns UI state only. All external calls (AI, weather, DB) go through Next.js API routes — never direct from the browser. Supabase is the system of record. localStorage is a read cache for offline resilience and demo seeding only.

---

## Invariants (Architecture Decisions)

### AD-1 — Framework
**Binds:** Every engineer's choice of routing, rendering, and API layer.
**Prevents:** A separate frontend + backend repo diverging independently.
**Rule:** Next.js 14+ App Router is the one codebase. No separate Express/FastAPI server. All API surface lives under `app/api/`.

### AD-2 — AI Layer
**Binds:** How conversational parsing, pattern narration, free-form Q&A, and feedback learning are invoked.
**Prevents:** API keys leaking to the browser; AI calls made directly from client components.
**Rule:** CodeBuddy AI API is called exclusively from Next.js API routes (`/api/ai/parse-log`, `/api/ai/narrate-insights`, `/api/ai/ask`, `/api/ai/feedback`). Client components call these routes — never the CodeBuddy API directly.

The AI agent has four distinct capabilities:
1. **Parse** (`/api/ai/parse-log`): Natural language → structured log entry. Learns from user corrections via feedback few-shot examples.
2. **Narrate** (`/api/ai/narrate-insights`): Correlation results → plain-English insight cards with temporal reasoning (detects delayed food reactions).
3. **Ask** (`/api/ai/ask`): Free-text Q&A that cross-references personal logs, trigger patterns, live NEA weather, and hawker DB. Cites specific dates and evidence.
4. **Feedback** (`/api/ai/feedback`): Thumbs up/down on AI parsing accuracy. Corrections stored and fed back as few-shot learning examples to improve future parses.

### AD-3 — Data Store
**Binds:** Where all user logs, profiles, trigger data, and hawker saves are persisted.
**Prevents:** Two components storing authoritative state in different places.
**Rule:** Supabase (free tier) is the system of record. localStorage is a write-through cache and demo-seed target only. The demo fixture (`demo-data.json`) is loaded into Supabase on "Load Demo Mode" — not into localStorage directly. All reads go to Supabase first.

**Demo mode bypass:** When `NEXT_PUBLIC_DEMO_MODE=true`, all API routes use `DEMO_USER_ID='demo-user-001'` and skip auth checks entirely. This is the default state for the hackathon demo. No login flow is implemented for MVP. The `users` table is pre-populated with a single demo user row via `supabase/seed.sql`. Auth integration is post-hackathon only.

### AD-4 — Pattern Detection
**Binds:** How trigger correlations are computed and surfaced.
**Prevents:** Unpredictable AI-only correlation quality; demo failure if AI is slow or unavailable.
**Rule:** A JavaScript correlation engine (`lib/pattern-engine.ts`) computes frequency analysis across all 5 pillars and produces a structured `CorrelationResult[]`. CodeBuddy AI narrates these results into plain English with **temporal reasoning** (detecting delayed food reactions, not just same-day correlations). If AI is unavailable, the computed results are displayed as-is using a template fallback. AI never receives raw logs for pattern finding — only pre-computed results for narration.

**Feedback loop:** `/api/ai/feedback` stores user corrections on AI parse accuracy. `/api/ai/parse-log` reads recent inaccurate corrections and includes them as few-shot examples in subsequent system prompts. This means the AI agent **learns and improves** for each individual user over time.

**Minimum data threshold:** The pattern engine requires a minimum of **7 `LogEntry` rows** before producing `CorrelationResult[]`. Below this threshold, the engine returns `{ insufficient_data: true, days_logged: N, days_remaining: 7 - N }`. The UI renders a streak/progress state ("X more days to unlock your trigger report") — never an error.

### AD-5 — Weather Integration
**Binds:** How NEA weather data enters the system.
**Prevents:** CORS failures; API credentials leaking to the browser; demo breakage on live API failure.
**Rule:** All weather data flows through `/api/weather`. This route calls the NEA API when `USE_MOCK_WEATHER !== 'true'`, and returns static Singapore mock data otherwise. The client calls `/api/weather` only — the implementation is opaque to it.

### AD-6 — Deployment
**Binds:** Where the app runs and how secrets are managed.
**Prevents:** Secrets in source code; fragile local-only demo.
**Rule:** Vercel hosts the Next.js app. All secrets (`CODEBUDDY_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `USE_MOCK_WEATHER`) live in Vercel environment variables only — never in `.env` files committed to the repo. `.env.local` is gitignored.

---

## Boundaries & Dependency Rules

```
Browser (React Client Components)
    └── calls → Next.js API Routes only
                    ├── /api/ai/parse-log    → CodeBuddy AI API (+ feedback few-shot learning)
                    ├── /api/ai/narrate-insights → CodeBuddy AI API (temporal reasoning prompt)
                    ├── /api/ai/ask          → CodeBuddy AI API (cross-references logs + weather + hawker DB)
                    ├── /api/ai/feedback     → Supabase (stores corrections for parse-log learning)
                    ├── /api/weather         → NEA API | Mock
                    └── /api/*               → Supabase (via server SDK)

lib/pattern-engine.ts (pure TS, no I/O)
    └── called by → /api/insights/correlate
    └── output →   CorrelationResult[]  → /api/ai/narrate-insights
                                       → /api/ai/ask (detailed evidence)

demo-data.json (static fixture)
    └── loaded by → /api/demo/seed  (POST, idempotent)
    └── writes to → Supabase demo user rows
```

No client component may import from `lib/pattern-engine.ts` directly — it is a server-only module.
No client component may hold the system-of-record copy of any log — Supabase is always authoritative.

---

## State Mutation Rules

- **Logs** are written to Supabase via `/api/logs` (POST). localStorage is updated after a confirmed Supabase write — never before.
- **Trigger profile** is derived, never directly edited. It is recomputed by the pattern engine on demand and cached in Supabase under `user_profiles.trigger_cache`.
- **Demo mode** is toggled via a single flag in Supabase (`user_profiles.is_demo = true`). Resetting demo calls `/api/demo/seed` which upserts the fixture rows — idempotent, safe to call repeatedly.
- **Weather** is fetched fresh on each daily log. It is stored as part of the log row — not in a separate weather table.

---

## Shared Data Contracts

### FoodItem
```ts
type FoodItem = {
  dish_id?: string              // references hawker_dishes.id if matched
  name: string                  // free-text or matched dish name
  quantity?: string             // e.g. "1 bowl", "half plate"
  allergen_tags: string[]       // e.g. ["shellfish", "gluten", "dairy"]
}
```

### LifestyleEntry
```ts
type LifestyleEntry = {
  sleep_hours: number           // e.g. 6.5
  stress_level: 1 | 2 | 3 | 4 | 5
  stress_type: 'Work' | 'Relationship' | 'Physical' | 'Financial' | 'Other'
}
```

### SymptomEntry
```ts
type SymptomEntry = {
  skin: number                  // 1–10 severity
  gut: number                   // 1–10 severity
  respiratory: number           // 1–10 severity
}
```

### LogEntry
```ts
type LogEntry = {
  id: string
  user_id: string
  date: string                  // ISO 8601 date
  food: FoodItem[]
  lifestyle: LifestyleEntry
  skincare: string[]            // free-text product names
  symptoms: SymptomEntry
  weather: WeatherSnapshot      // temp_c, humidity_pct, psi, uv_index
  created_at: string
}
```

### CorrelationResult
```ts
type CorrelationResult = {
  trigger_label: string         // e.g. "Shellfish + Humidity > 85%"
  confidence_pct: number        // 0–100
  co_occurrence_count: number
  total_flare_days: number
  variables: string[]           // pillars involved
}
```

### WeatherSnapshot
```ts
type WeatherSnapshot = {
  temp_c: number
  humidity_pct: number
  psi: number
  uv_index: number
  source: 'nea_live' | 'mock'
  fetched_at: string
}
```

---

## Seed (True at cold-start, owned by code once it exists)

- **Framework version:** Next.js 14.2+, React 18, TypeScript strict mode
- **Styling:** Tailwind CSS
- **Supabase client:** `@supabase/supabase-js` v2
- **DB tables:** `users`, `log_entries`, `user_profiles`, `hawker_dishes`, `saved_dishes`
- **user_profiles extended fields:** `ai_feedback_log` (jsonb array — user corrections for AI parse learning)
- **Hawker DB:** 80+ dishes seeded via `supabase/seed.sql`, each with allergen tags and multilingual aliases (EN / Malay / Chinese)
- **Demo fixture:** `data/demo-data.json` — 14 days of realistic log entries for a demo eczema user

---

## Deferred

| Decision | Revisit condition |
|---|---|
| Auth provider (Supabase Auth vs. NextAuth) | Needed if multi-user demo is required before 14 Aug; default to Supabase Auth magic link |
| Rate limiting on AI routes | Post-hackathon if API costs become a concern |
| PDF export implementation | Day 5 — use `react-pdf` or `window.print()` CSS, decide based on time budget |
| Multi-profile (family accounts) | Post-hackathon per PRD |
| Wearable / passive data integration | Post-hackathon per PRD |

---

## Open Questions

| # | Question | Blocker? |
|---|---|---|
| OQ-1 | Does the CodeBuddy AI API require a specific SDK or is it a standard REST endpoint? | Yes — needed Day 2 before `/api/ai/*` routes can be built |
| OQ-2 | NEA API — confirm endpoint URL and whether CORS headers are present | Yes — needed Day 2; mock fallback is ready regardless |
| OQ-3 | Supabase project — created and credentials available? | Yes — needed before any data layer work |

---

*Owner: Winston (Architect)*
*Next: Hand to Amelia (Dev) for implementation. Resolve OQ-1, OQ-2, OQ-3 on Day 2 before coding starts.*
