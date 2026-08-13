---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-epic-design", "step-03-write-stories", "step-04-validate"]
inputDocuments:
  - ClearLah-PRD.md
  - ClearLah-Architecture-Spine.md
  - DESIGN.md
  - EXPERIENCE.md
status: complete
---

# ClearLah — Epics & User Stories

> Generated: 2026-08-08 | Project: ClearLah (Tencent Hackathon)

---

## Epic List

| ID  | Epic Name                                | Stories | Priority |
|-----|------------------------------------------|---------|----------|
| E1  | Project Foundation & Infrastructure      | 5       | P0       |
| E2  | Onboarding & User Profile                | 5       | P0       |
| E3  | AI-Powered Daily Log                     | 6       | P0       |
| E4  | Dashboard & Streak System                | 5       | P1       |
| E5  | Insights, Pattern Engine & Doctor Report | 6       | P1       |
| E6  | Hawker Food Safety Checker               | 5       | P1       |
| E7  | AI Agent Intelligence Showcase           | 3       | P0       |
| E8  | Lifestyle Habits & Food Expansion        | 2       | P1       |
| E9  | v2 — The Detective's Sensors             | 5       | P2       |

**Total: 9 epics, 42 user stories**

---

## FR Coverage Map

| FR   | Story  | FR   | Story  |
|------|--------|------|--------|
| FR1  | E2-S1  | FR19 | E5-S2  |
| FR2  | E2-S2  | FR20 | E5-S3  |
| FR3  | E2-S3  | FR21 | E5-S3  |
| FR4  | E2-S2  | FR22 | E5-S3  |
| FR5  | E2-S4  | FR23 | E4-S4  |
| FR6  | E3-S1  | FR24 | E4-S4  |
| FR7  | E3-S2  | FR25 | E6-S1  |
| FR8  | E3-S3  | FR26 | E6-S2  |
| FR9  | E3-S4  | FR27 | E6-S2  |
| FR10 | E3-S4  | FR28 | E6-S3  |
| FR11 | E3-S4  | FR29 | E6-S4  |
| FR12 | E3-S4  | FR30 | E5-S4  |
| FR13 | E1-S3  | FR31 | E5-S4  |
| FR14 | E1-S3  | FR32 | E5-S5  |
| FR15 | E3-S5  | FR33 | E1-S4  |
| FR16 | E3-S6  | FR34 | E1-S4  |
| FR17 | E4-S3  | FR35 | E2-S5  |
| FR18 | E4-S2  |      |        |

---

## E1 â€" Project Foundation & Infrastructure

**Goal:** Establish the full-stack skeleton: Next.js 14 App Router, TypeScript, Tailwind CSS design tokens, Supabase schema, weather API route, demo seed pipeline, and Vercel deployment. All subsequent epics depend on this.

**Definition of Done:** All Supabase tables migrated; `/api/weather` returns data; `/api/demo/seed` is idempotent; app deploys to Vercel; design token Tailwind config applied.

---

### E1-S1 — Next.js Project Scaffold & Design Token Config

> **Status: ✅ COMPLETE** — implemented 2026-08-08

**As a** developer,
**I want** a Next.js 14 App Router project with TypeScript strict mode, Tailwind CSS, and the full ClearLah design token system configured,
**so that** all downstream components can use consistent colour, typography, spacing, and motion tokens without ad-hoc styling.

**Acceptance Criteria:**
- [x] Next.js 14+ project initialised with `app/` directory structure and TypeScript strict mode
- [x] `tailwind.config.ts` includes all design tokens: colours (`primary-sage` #5B7F6E, `secondary-terracotta` #C0583A, full neutral stack), 9 typography variants (Inter), 4px base spacing grid, radius scale, motion tokens (`--duration-ui` 180ms, `--duration-micro` 120ms)
- [x] Global CSS includes `@keyframes shimmer` for skeleton loading (1.5s cycle)
- [x] `prefers-reduced-motion: reduce` disables all transitions globally
- [x] `lang="en-SG"` set on root `<html>` element in `app/layout.tsx`
- [x] Inter font loaded via `next/font/google`
- [x] `.env.local.example` committed with all required variable names: `CODEBUDDY_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `USE_MOCK_WEATHER`, `NEXT_PUBLIC_DEMO_MODE`
- [x] Project builds successfully with zero TypeScript errors (`npx tsc --noEmit` passes; `next build` ✓)

**Implementation Notes:**
- Project location: `clearlah/` subdirectory
- `next.config.mjs` (not `.ts` — not supported in Next.js 14)
- Also created: `lib/types/database.ts` (full DB type stubs), `lib/utils/cn.ts`, `lib/utils/demo.ts`
- Demo badge rendered server-side via `NEXT_PUBLIC_DEMO_MODE` env check in layout

**UX Reqs Covered:** UX-DR1, UX-DR7, UX-DR10

---

### E1-S2 — Supabase Database Schema & Migration

> **Status: ✅ COMPLETE** — implemented 2026-08-08

**As a** developer,
**I want** the Supabase database schema created via migration SQL with a typed client helper,
**so that** all app modules can read and write data with full TypeScript type safety.

**Acceptance Criteria:**
- [x] `supabase/migrations/` contains initial migration creating 5 tables:
  - `users(id uuid PK, email text, created_at timestamptz, onboarding_complete bool default false)`
  - `user_profiles(user_id uuid FK, tracking_for text, conditions text[], disclaimer_acknowledged bool, trigger_cache jsonb, singlish_unlocked bool, onboarding_step int default 1, known_allergens text[], daily_skincare text, streak int default 0, streak_last_date date, updated_at timestamptz)`
  - `log_entries(id uuid PK, user_id uuid FK, logged_at date, food jsonb, lifestyle jsonb, skincare text, symptoms jsonb, weather_snapshot jsonb, created_at timestamptz)`
  - `hawker_dishes(id uuid PK, name_en text, name_ms text, name_zh text, aliases text[], allergens text[], category text, popularity_rank int)`
  - `saved_dishes(id uuid PK, user_id uuid FK, dish_id uuid FK, safety_label text CHECK IN ('safe','risky','avoid'), saved_at timestamptz)`
- [x] `supabase/seed.sql` seeds `hawker_dishes` with ≥80 dishes (85 total, EN/Malay/Chinese names + allergen arrays)
- [x] `lib/supabase/client.ts` — browser Supabase client; `lib/supabase/server.ts` — server client
- [x] TypeScript types in `lib/types/database.ts` covering all table row shapes (completed in E1-S1)
- [x] `pg_trgm` extension enabled for fuzzy hawker search
- [x] Migration applies cleanly via `supabase db push`

**Implementation Notes:**
- Migration: `supabase/migrations/20260808000000_initial_schema.sql`
- Seed: `supabase/seed.sql` — 85 hawker dishes + demo user row (id: `demo-user-001-0000-0000-000000000000`)
- `lib/supabase/server.ts` uses `SUPABASE_SERVICE_ROLE_KEY` when `NEXT_PUBLIC_DEMO_MODE=true` to bypass RLS; `createClient()` is `async` (Next.js 15 `await cookies()`)
- `.env.local.example` updated: `SUPABASE_URL`/`SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Post-Review Patches Applied (2026-08-08):**
- F1: `DEMO_USER_ID` corrected to `"demo-user-001-0000-0000-000000000000"` in `lib/utils/demo.ts`
- F2: `seed.sql` — added `UNIQUE (name_en)` + `ON CONFLICT (name_en) DO UPDATE` upsert
- F3: RLS — added `FOR INSERT` policy on `user_profiles`
- F4: RLS — added `FOR DELETE` policy on `log_entries`
- F5: `DbUser.email` typed `string | null` in `lib/types/database.ts`
- F6: Added `set_updated_at()` trigger + `trg_user_profiles_updated_at` on `user_profiles`
- F7: `createClient()` validates `SUPABASE_SERVICE_ROLE_KEY` presence with clear error
- F8: `hawker_dishes.category` — added `CHECK (category IN (...))` constraint
- F10: Added `idx_hawker_dishes_aliases_trgm` GIN index on `aliases`
- F11: `createClient()` made `async`; `cookies()` awaited (Next.js 15)
- F12: RLS — added `FOR INSERT` + `FOR UPDATE` policies on `users`
- F13: `streak` — added `CHECK (streak >= 0)` constraint

**NFR Covered:** NFR10

---

### E1-S3 — Weather API Route (NEA + Mock Fallback)

> **Status: ✅ COMPLETE** — implemented 2026-08-08

**As a** server-side module,
**I want** a `/api/weather` route that fetches Singapore weather from NEA and falls back to mock data,
**so that** the client always receives weather data without browser-exposed API keys and the app works during NEA outages.

**Acceptance Criteria:**
- [x] `app/api/weather/route.ts` handles GET requests
- [x] When `USE_MOCK_WEATHER !== 'true'`: fetches from NEA API (temp, humidity, PSI, UV for Singapore)
- [x] When `USE_MOCK_WEATHER === 'true'` OR NEA fails: returns `{ temp: 31, humidity: 82, psi: 45, uv: 9, source: "mock", simulated: true }`
- [x] Response schema: `{ temp: number, humidity: number, psi: number, uv: number, source: "live" | "mock", simulated?: true }`
- [x] Route returns HTTP 200 in all cases (never 500 to client)
- [x] Response cached with `next: { revalidate: 600 }` (10-minute cache)
- [x] No NEA API key present in any committed file

**Implementation Notes:**
- `app/api/weather/route.ts` — route handler; always returns 200; ISR `revalidate = 600`
- `lib/utils/nea.ts` — four concurrent NEA fetches (temperature, humidity, PSI, UV) via `data.gov.sg` public API; any partial failure returns `null` → mock fallback
- Mock: `{ temp: 31, humidity: 82, psi: 45, uv: 9, source: "mock", simulated: true }`
- `USE_MOCK_WEATHER=true` in `.env.local.example` — default for dev/CI

**FR Covered:** FR13, FR14 | **NFR Covered:** NFR9

---

### E1-S4 â€" Demo Mode & Seed Pipeline

**As a** hackathon demo presenter,
**I want** a pre-seeded demo account with 14 days of realistic log data activated via environment variable,
**so that** the app can be demoed with full insights and trigger patterns without real user data.

**Acceptance Criteria:**
- [ ] `data/demo-data.json` contains 14 days of log entries for `DEMO_USER_ID='demo-user-001'` with realistic eczema trigger patterns (shellfish + humidity correlation, sleep deprivation pattern)
- [ ] `app/api/demo/seed/route.ts` handles POST; upserts all demo log entries and profile into Supabase
- [ ] Seed endpoint is idempotent: calling 3Ã— produces same state as calling 1Ã—; returns `{ seeded: true, entries: number }`
- [ ] When `NEXT_PUBLIC_DEMO_MODE === 'true'`: all Supabase queries use `user_id = 'demo-user-001'` via `getDemoUserId()` helper; auth bypassed; app renders directly to Dashboard
- [ ] "Demo Mode" persistent badge visible in UI when active
- [ ] Demo `user_profiles` has `onboarding_complete: true`, `singlish_unlocked: true`, `onboarding_step: 3`, pre-computed trigger cache
- [ ] Seed can be triggered via a button on demo landing page

**FR Covered:** FR33, FR34 | **NFR Covered:** NFR12, NFR13

---

### E1-S5 â€" Vercel Deployment & CI Config

**As a** developer,
**I want** the app deployed to Vercel with correct environment variables and a passing build,
**so that** the team has a shareable live URL for judges.

**Acceptance Criteria:**
- [ ] App deploys successfully to Vercel (production URL accessible)
- [ ] All 5 environment variables configured in Vercel dashboard
- [ ] `NEXT_PUBLIC_DEMO_MODE=true` and `USE_MOCK_WEATHER=true` set in Vercel production
- [ ] Build completes with zero TypeScript errors and zero ESLint errors
- [ ] README.md includes: Deploy to Vercel button, local dev setup, env variable descriptions

**NFR Covered:** NFR14, NFR15

---

## E2 â€" Onboarding & User Profile

**Goal:** Guide a new user from landing page to their first personalised Dashboard in under 2 minutes. Collect tracking target, conditions, and disclaimer acknowledgement; personalise all UI labels; set up progressive profiling for Days 2 and 3.

**Definition of Done:** New user completes onboarding <2 min; condition-specific label overrides applied; disclaimer gate cannot be bypassed; Day 2/3 progressive questions fire correctly.

---

### E2-S1 â€" Landing Page & Tracking-For Selection

**As a** new user visiting ClearLah,
**I want** to see a welcoming landing page and select who I am tracking for,
**so that** the app knows how to address me and personalise subsequent copy.

**Acceptance Criteria:**
- [ ] `/` route renders landing page with ClearLah name, tagline ("Track your triggers. Live with less flare."), and "Get Started" CTA
- [ ] "Get Started" navigates to `/onboarding/step/1`
- [ ] Step 1 presents three selectable cards: "Myself", "My child", "Someone else" with descriptive subtitles
- [ ] Selected card gets primary-sage border and checkmark; "Continue" disabled until one selected
- [ ] Selection stored in `user_profiles.tracking_for` AND localStorage

**FR Covered:** FR1 | **NFR Covered:** NFR2

---

### E2-S2 â€" Condition Selection & Pillar Label Personalisation

**As a** new user,
**I want** to declare my health condition(s) so tracking pillar names are personalised,
**so that** the language feels relevant to my specific situation.

**Acceptance Criteria:**
- [ ] `/onboarding/step/2` presents multi-select condition chips: Eczema, IBS, Food allergy, Asthma, Other
- [ ] At least one condition required; stored in `user_profiles.conditions[]`
- [ ] Pillar label overrides applied globally post-onboarding:
  - Eczema â†' "Skin Flares" | IBS â†' "Gut Symptoms" | Asthma â†' "Breathing" | Food allergy â†' "Reactions" | Default â†' "Symptoms"
- [ ] First selected condition determines pillar label when multiple selected
- [ ] Condition chips use `PillarTag` component with `symptoms` variant

**FR Covered:** FR2, FR4

---

### E2-S3 â€" Medical Disclaimer Acknowledgement Gate

**As a** new user,
**I want** to read and acknowledge a medical disclaimer before I can log anything,
**so that** I understand ClearLah is not a diagnostic tool.

**Acceptance Criteria:**
- [ ] `/onboarding/step/3` shows full disclaimer: "ClearLah helps you track patterns in your symptoms and lifestyle. It is not a medical diagnostic tool. Always consult a qualified healthcare professional for diagnosis and treatment."
- [ ] Checkbox "I understand â€" ClearLah is a tracking tool, not a doctor" must be ticked to enable "Let's go"
- [ ] Checkbox NOT pre-checked on page load
- [ ] On completion: `user_profiles.disclaimer_acknowledged = true` AND `onboarding_complete = true` written to Supabase
- [ ] Direct navigation to `/dashboard` with `onboarding_complete: false` redirects to `/onboarding/step/1`
- [ ] No app route (except `/`) accessible before disclaimer acknowledged

**FR Covered:** FR3

---

### E2-S4 â€" In-Context Location Permission Request (Day 1 Log)

**As a** first-time logger,
**I want** to be asked for location permission within the chat on my first log day,
**so that** the request feels contextual and I understand why it is needed.

**Acceptance Criteria:**
- [ ] Location permission NOT requested during onboarding screens
- [ ] On Day 1 first log open, after AI greeting, a special chat bubble appears: "To show your local weather automatically, can I access your location? [Allow] [Skip]"
- [ ] "Allow" triggers `navigator.geolocation.getCurrentPosition()`; coordinates stored in sessionStorage
- [ ] "Skip" dismisses the bubble; weather fetched without GPS (Singapore-wide NEA data)
- [ ] Location bubble only appears once (tracked via `localStorage.locationPermissionAsked`)
- [ ] Buttons have `aria-label` and are keyboard navigable

**FR Covered:** FR5

---

### E2-S5 â€" Progressive Profiling (Day 2 & Day 3 Questions)

**As a** returning user on my second and third log days,
**I want** the AI to ask one additional profile question naturally in the chat,
**so that** my profile becomes richer without overwhelming me during onboarding.

**Acceptance Criteria:**
- [ ] Day 2 (second calendar day with log): AI sends warm-up message asking about known food allergens/sensitivities; response parsed into `user_profiles.known_allergens text[]`; "Skip for now" option available
- [ ] Day 3: AI asks about daily skincare routine; response stored in `user_profiles.daily_skincare text`
- [ ] Each question asked exactly once; tracked via `user_profiles.onboarding_step` (1 = fresh, 2 = Day 2 asked, 3 = Day 3 asked)
- [ ] Idempotent: already-answered questions never re-asked
- [ ] Questions skipped entirely in demo mode (demo user has `onboarding_step = 3`)
- [ ] Singlish unlocks when `onboarding_step >= 3`

**FR Covered:** FR35

---


## E3 - AI-Powered Daily Log

**Goal:** Make the daily log fast enough (under 3 minutes) and enjoyable enough that users return every day. The conversational AI interface accepts free-text, parses it into structured fields, lets the user review and edit, then saves to Supabase with weather snapshot and streak increment.

**Definition of Done:** User describes their day in natural language; AI pre-fills form correctly; user edits and confirms; log saves to Supabase with weather snapshot; streak increments; smart meal suggestions appear for repeat dishes.

---

### E3-S1 - Chat Log Interface (ChatInterface Component)

**As a** user wanting to log my day,
**I want** a full-screen conversational interface where the AI greets me and invites a description of my day,
**so that** logging feels natural and conversational rather than form-filling.

**Acceptance Criteria:**
- [ ] `/log` route renders `ChatInterface` component -- full-screen, no standard page chrome (back arrow only)
- [ ] AI message bubbles on left (neutral-100 background, `radius-lg`); user bubbles on right (primary-green, white text)
- [ ] Adaptive greeting: Days 1-3 formal ("Hey! Tell me how your day has been..."); Day 4+ casual ("Hey again! How was today?"); Day 4+ Singlish unlocked ("Eh, how was today ah? Just lah tell me lah!")
- [ ] New AI bubbles animate in with fade + translate-y (180ms; suppressed with prefers-reduced-motion)
- [ ] Text input fixed at bottom; VisualViewport API avoids keyboard overlap on iOS
- [ ] Send button `aria-label="Send message"`; Enter key submits on desktop
- [ ] While AI processes: skeleton shimmer bubble (3 animated lines) appears within 50ms
- [ ] `aria-live="polite"` region announces new AI messages to screen readers

**FR Covered:** FR6 | **NFR Covered:** NFR1, NFR3 | **UX Covered:** UX-DR6, UX-DR7

---

### E3-S2 - AI Log Parser (POST /api/ai/parse-log)

**As a** server-side AI route,
**I want** to receive the user's free-text log message and return a structured JSON log object,
**so that** the client can pre-fill the log form without the user re-entering data.

**Acceptance Criteria:**
- [ ] `app/api/ai/parse-log/route.ts` handles POST with body `{ message: string, userProfile: { conditions: string[], known_allergens: string[] } }`
- [ ] Calls CodeBuddy AI API with system prompt instructing extraction of:
  - `food: { items: string[], hawker_dishes: string[] }`
  - `lifestyle: { sleep_hours: number|null, stress_level: number|null (1-5), stress_type: string|null }`
  - `skincare: string|null`
  - `symptoms: { skin: number|null, gut: number|null, respiratory: number|null }` (1-10)
  - `summary: string` -- 1-sentence plain-English summary
- [ ] Response arrives within 2 seconds for typical input (under 200 words)
- [ ] If AI API unavailable: returns `{ error: "ai_unavailable", partial: {} }` with HTTP 503
- [ ] No raw log text or user profile persisted by this route
- [ ] System prompt includes condition context (e.g., "User has eczema -- skin symptoms are most important")
- [ ] AI instructed to respond ONLY with valid JSON

**FR Covered:** FR7 | **NFR Covered:** NFR9

---

### E3-S3 - Pre-Fill Card & Editable Form Review

**As a** user who has described my day to the AI,
**I want** to see a pre-filled form card below the chat that I can review and edit before saving,
**so that** I can correct AI mistakes and confirm the data is accurate.

**Acceptance Criteria:**
- [ ] After AI parses the log, a pre-fill card expands below the chat thread with smooth height animation (180ms)
- [ ] Card displays all extracted fields in a compact editable form:
  - Food: list of detected items, each editable; "Add food" button
  - Sleep hours: number input (0-24) pre-filled from AI parse
  - Stress level: 1-5 segmented selector
  - Stress type: chip selector (Work / Relationship / Physical / Financial / Other)
  - Skincare: free-text area pre-filled from AI parse
  - Symptoms: three sliders (Skin/Gut/Respiratory, 1-10) with current value shown
- [ ] "Confirm & Save" primary button always visible (never hidden below keyboard)
- [ ] "Edit more" secondary button expands full form in bottom sheet
- [ ] Pillar labels use condition-personalised names (FR4)
- [ ] All form fields have `aria-label` attributes

**FR Covered:** FR8 | **UX Covered:** UX-DR6

---

### E3-S4 - Manual Log Entry (Food, Lifestyle, Skincare, Symptoms)

**As a** user who prefers manual entry or needs to correct the AI pre-fill,
**I want** to directly input all log fields including hawker dish shortcuts, sleep, stress, skincare, and symptom severity,
**so that** I can log accurately even without the conversational interface.

**Acceptance Criteria:**
- [ ] Food entry: hawker search (GET `/api/hawker?q=` with 300ms debounce) + free-text fallback; multilingual fuzzy match across name_en, name_ms, name_zh, aliases for 80+ dishes
- [ ] Sleep input: numeric input with +/- steppers; accepts 0-24; validates on save
- [ ] Stress level: 1-5 segmented button selector with labels ("Low" to "Very High")
- [ ] Stress type: single-select chips (Work / Relationship / Physical / Financial / Other)
- [ ] Skincare: free-text area with common product suggestions as tap-to-insert pills (CeraVe, Cetaphil, etc.)
- [ ] Symptom sliders: three independent sliders (1-10) with live numeric value; default 0 (not measured); colours match PillarTag variants
- [ ] At least one field must be filled before saving
- [ ] All touch targets minimum 44x44px (WCAG 2.5.5)

**FR Covered:** FR9, FR10, FR11, FR12 | **NFR Covered:** NFR4, NFR5

---

### E3-S5 - Smart Meal Suggestions

**As a** repeat logger,
**I want** the app to suggest dishes I have previously logged on the same day of the week,
**so that** logging my routine meals is faster and I do not need to retype common dishes.

**Acceptance Criteria:**
- [ ] When opening food entry, app queries last 7 log entries for same day-of-week
- [ ] If a dish appears in 3 or more of those entries, it appears as a "Suggested" chip above the search field with flame icon
- [ ] Tapping a suggested chip adds it directly to food list without typing
- [ ] Suggestions computed client-side from Supabase data (no AI call needed)
- [ ] Maximum 3 suggestions shown (most frequent first); suggestion row hidden if no qualifying dishes
- [ ] Suggestions do not appear for first 3 log entries (insufficient history)

**FR Covered:** FR15

---

### E3-S6 - Log Save, Weather Snapshot & Streak Increment

**As a** user who has filled in today's log,
**I want** my entry to save with today's weather attached and my streak to increment,
**so that** weather context is captured automatically and my consistency is rewarded.

**Acceptance Criteria:**
- [ ] "Confirm & Save" triggers: (1) GET `/api/weather`, (2) POST `/api/logs` with full log object + weather snapshot
- [ ] Log written to Supabase `log_entries`; localStorage updated ONLY after confirmed Supabase write
- [ ] On Supabase failure: data saved to sessionStorage; toast "Couldn't save -- will retry when connected" shown
- [ ] Automatic retry when `navigator.onLine` changes to true
- [ ] After successful save: streak counter increments by 1 with 200ms scale-up animation
- [ ] Same-day re-save performs upsert (no duplicate entries for same `logged_at` date)
- [ ] Weather snapshot stored as `{ temp, humidity, psi, uv, source, simulated? }` in `log_entries.weather_snapshot`
- [ ] User navigated to `/dashboard` with success toast: "Day logged! Keep it up." (Singlish variant when unlocked)

**FR Covered:** FR13, FR14, FR16 | **NFR Covered:** NFR8, NFR10

---

## E4 - Dashboard & Streak System

**Goal:** The Dashboard is the motivational hub that shows today's context (weather, risk level), celebrates consistency (streaks, milestones), surfaces early insights, and anchors the bottom navigation. It should feel alive and personally responsive from Day 1.

**Definition of Done:** Dashboard renders weather widget, streak counter, High Risk Day banner when conditions met, progressive encouragement messages, and navigates to all main sections. Milestone modals fire at correct streak counts.

---

### E4-S1 - Dashboard Layout & Weather Widget

**As a** user who has completed onboarding,
**I want** a Dashboard that shows today's date, my streak, current weather, and quick navigation,
**so that** I get an at-a-glance picture of my tracking status and environment every day.

**Acceptance Criteria:**
- [ ] `/dashboard` route renders after onboarding completes
- [ ] Header row: ClearLah wordmark (left), `StreakBadge` component (right) with current consecutive streak
- [ ] Weather widget: temperature (C), humidity (%), PSI, UV index with relevant icons; skeleton shimmer during fetch
- [ ] Weather data fetched on mount via GET `/api/weather`
- [ ] When `simulated: true`, a "Simulated data" badge visible on weather widget
- [ ] Pull-to-refresh (overscroll) re-fetches weather and re-checks High Risk Day
- [ ] Empty state (0 logs): warm welcome card with "Start your first log" CTA; no streak or risk elements
- [ ] Bottom navigation bar persists on all app-shell routes

**FR Covered:** FR13, FR14 | **UX Covered:** UX-DR3, UX-DR5, UX-DR11, UX-DR14

---

### E4-S2 - Progressive Insights & Encouragement Messages

**As a** user in my first 6 days of logging,
**I want** to see encouraging messages and a progress indicator on my Dashboard,
**so that** I stay motivated even before the 7-day threshold for pattern detection.

**Acceptance Criteria:**
- [ ] When log count is 1-6: "Building your picture" section shows:
  - `ProgressRing` (48px, 4px stroke, primary-sage) showing N of 7 days with days remaining in centre
  - Rotating encouragement message (5 variants, no exclamation marks, quiet tone)
  - No trigger or pattern insights
- [ ] When log count is 0: "Log your first day to start building your health picture."
- [ ] From Day 4+ with `singlish_unlocked: true`: one message variant uses Singlish ("Eh, you doing pretty well leh. Keep going ah.")
- [ ] `ProgressRing` is shared component `components/ui/ProgressRing.tsx`

**FR Covered:** FR18 | **UX Covered:** UX-DR8, UX-DR12

---

### E4-S3 - Streak Counter & Milestone Celebration Modals

**As a** consistent logger,
**I want** my daily streak counted and celebrated at key milestones,
**so that** I feel acknowledged for consistency and am motivated to continue.

**Acceptance Criteria:**
- [ ] `StreakBadge`: terracotta pill, flame icon, white bold streak number; in Dashboard header AND Log nav micro-badge
- [ ] Streak increments by 1 after each successful log save (not on same-day re-saves)
- [ ] Streak resets to 0 if a calendar day is missed (checked on Dashboard mount by comparing most recent log date to today)
- [ ] Streak stored in `user_profiles.streak` and `streak_last_date` (not recomputed from scratch)
- [ ] Milestone modals fire at: 3, 7, 14, 21, 30 days
- [ ] Modal: full-screen overlay, centred card, milestone number in `numeric` typography, personalised message, "Keep going" dismiss button; 180ms in/out animation; focus trapped while open
- [ ] Each milestone fires only once (tracked in `user_profiles`)
- [ ] `aria-live="polite"` announces streak increment; streak badge 200ms scale-up animation on increment

**FR Covered:** FR16, FR17 | **UX Covered:** UX-DR5, UX-DR9, UX-DR10

---

### E4-S4 - High Risk Day Alert Banner

**As a** user with an established trigger profile,
**I want** a prominent banner on my Dashboard when today's weather matches my known triggers,
**so that** I can take precautions before symptoms flare up.

**Acceptance Criteria:**
- [ ] `HighRiskDayAlert` component renders as full-width banner at top of Dashboard content (below header)
- [ ] Banner shows: weather alert icon, "High Risk Day -- [trigger summary]" message, "See why" CTA
- [ ] "See why" navigates to `/insights` with top contributing trigger pre-expanded
- [ ] Banner styling: secondary-light background, 4px muted-terracotta left border, neutral-900 text
- [ ] Alert SUPPRESSED when log count < 7 (FR24)
- [ ] Alert SUPPRESSED if dismissed today (tracked via `localStorage.highRiskDismissedDate`)
- [ ] Any banner interaction (tap anywhere) counts as dismissal for the day
- [ ] `aria-live="assertive"` on banner container
- [ ] High Risk logic: compare live weather against top 3 triggers in `trigger_cache`; show if 2+ trigger conditions simultaneously met
- [ ] Orange notification dot on Home bottom nav tab when High Risk active and banner not dismissed

**FR Covered:** FR23, FR24 | **UX Covered:** UX-DR3, UX-DR9

---

### E4-S5 - Bottom Navigation Bar

**As a** user navigating between app sections,
**I want** a persistent bottom navigation bar with clear section indicators and contextual micro-badges,
**so that** I can switch contexts quickly and see what needs my attention.

**Acceptance Criteria:**
- [ ] Bottom nav persists on all app-shell routes: /dashboard, /log, /insights, /hawker
- [ ] Four tabs: Home (house icon), Log (pen icon), Insights (chart icon), Hawker (bowl icon)
- [ ] Active tab: primary-sage icon + label; inactive: neutral-500
- [ ] Log tab: flame icon micro-badge when streak > 0
- [ ] Home tab: orange dot when High Risk Day active and banner not dismissed
- [ ] Insights tab: "New" dot when new insights available (trigger_cache updated since last Insights visit)
- [ ] All tabs: icon + text label visible; minimum 44x44px touch target
- [ ] Keyboard navigable (arrow keys cycle tabs); active tab `aria-current="page"`
- [ ] `role="navigation"` and `aria-label="Main navigation"` on tab bar

**UX Covered:** UX-DR9, UX-DR11

---

## E5 - Insights, Pattern Engine & Doctor Report

**Goal:** Deliver genuine value by surfacing trigger correlations users came for. The pure-TypeScript pattern engine analyses log data, the AI narrates findings in plain English, and the Doctor Report bundles everything into a shareable PDF.

**Definition of Done:** Pattern engine produces CorrelationResult[] from 7+ log entries; AI narrates in plain English; Insight cards show confidence and evidence; Doctor Report generates and prints as PDF.

---

### E5-S1 - Pattern Engine (lib/pattern-engine.ts)

**As a** server-side computation module,
**I want** a pure TypeScript pattern detection function that analyses log entries and returns ranked trigger correlations,
**so that** the Insights page has meaningful data without relying on AI for statistical analysis.

**Acceptance Criteria:**
- [ ] `lib/pattern-engine.ts` exports: `detectCorrelations(entries: LogEntry[]): CorrelationResult[] | InsufficientDataResult`
- [ ] Returns `{ status: "insufficient_data", entries_needed: number }` when entries.length < 7
- [ ] When 7+ entries: analyses food items x symptoms, weather metrics x symptoms, sleep x symptoms, stress x symptoms correlations
- [ ] Each `CorrelationResult`: `{ trigger: string, pillar: Pillar, confidence: number (0-100), cooccurrence_count: number, affected_days: string[], explanation_template: string }`
- [ ] Results sorted by confidence descending; top 5 returned
- [ ] Pure function: no I/O, no side effects, no Supabase imports
- [ ] Unit tests in `__tests__/pattern-engine.test.ts` with fixture data covering: single trigger, multi-trigger, weather bucket correlation, insufficient data
- [ ] Called ONLY from `/api/insights/correlate`; never from client code

**NFR Covered:** NFR11

---

### E5-S2 - Insights API Route & Data Fetching

**As a** client page,
**I want** an API route that computes correlations, caches results, and triggers AI narration,
**so that** the Insights page loads quickly with fresh, human-readable trigger insights.

**Acceptance Criteria:**
- [ ] `app/api/insights/correlate/route.ts` handles GET with `userId` query param
- [ ] Fetches all `log_entries` for user, calls `detectCorrelations()`, stores result in `user_profiles.trigger_cache`
- [ ] Returns `{ status, correlations: CorrelationResult[], narrations: string[], lastUpdated: string }`
- [ ] `narrations`: one plain-English string per correlation, generated by POST to `/api/ai/narrate-insights`
- [ ] Cache invalidation: if `trigger_cache.lastUpdated` within last 6 hours AND log count unchanged, return cache without re-running engine
- [ ] Graceful handling of `insufficient_data`: returns `{ status: "insufficient_data", entries_needed: N }` to client
- [ ] Raw log entries NEVER passed to AI; only `CorrelationResult[]` sent for narration

**FR Covered:** FR19 | **NFR Covered:** NFR9, NFR11

---

### E5-S3 - AI Narration Route & Insight Cards

**As a** user reviewing my health patterns,
**I want** top trigger correlations as clear insight cards with plain-English explanations and confidence percentage,
**so that** I understand my patterns without interpreting raw statistics.

**Acceptance Criteria:**
- [ ] `app/api/ai/narrate-insights/route.ts` handles POST with `{ correlations: CorrelationResult[], userProfile: { conditions: string[] } }`; returns `{ narrations: string[] }` (one per correlation, max 2 sentences each)
- [ ] AI tone: calm, factual, no medical claims, no alarm language (per EXPERIENCE.md tone guidance)
- [ ] Example narration: "Your skin flares tend to peak when humidity is above 85% and shellfish is in your recent meals. This pattern appeared on 8 of your logged days."
- [ ] `/insights` route renders `InsightCard` components (max 5):
  - 4px primary-sage left border; primary-light fill
  - Confidence % in `numeric` typography (2.5rem/700)
  - Trigger label in `h3`; narration in `body-lg`
  - `PillarTag` components along bottom for involved pillars
  - "See evidence" disclosure toggle (aria-expanded)
- [ ] "See evidence" toggle reveals timeline of 3-5 contributing log dates with brief context (e.g., "12 Jul -- Laksa + humidity 88% -> Skin 8/10")
- [ ] Insight cards stagger-animate in (40ms delay between cards; suppressed prefers-reduced-motion)
- [ ] Loading: 3 InsightCard skeleton shimmers
- [ ] Pull-to-refresh re-fetches correlations

**FR Covered:** FR20, FR21, FR22 | **UX Covered:** UX-DR2, UX-DR4, UX-DR7, UX-DR14

---

### E5-S4 - Doctor-Ready Trigger Report Generation

**As a** user preparing for a doctor's appointment,
**I want** a structured trigger summary report with my top patterns, symptom trends, and log timeline,
**so that** I can share objective data with my healthcare provider.

**Acceptance Criteria:**
- [ ] `/insights/report` route renders the Doctor Report view
- [ ] Report structure:
  1. Header: "ClearLah Trigger Summary Report" + patient-reported disclaimer at TOP
  2. "Top 5 Suspected Triggers" with confidence % and pillar icons
  3. Symptom trend chart: line/bar chart of Skin/Gut/Respiratory severity over last 14 days
  4. 14-day log timeline: table with date, food, sleep, stress, symptom scores, weather summary
  5. Footer: "Patient-reported data summary -- not a medical diagnosis. Consult a qualified healthcare professional."
- [ ] Medical disclaimer at BOTH top AND bottom (FR31)
- [ ] "Generate Report" button on `/insights` navigates to `/insights/report`
- [ ] Report data fetched from Supabase on mount; skeleton section loaders shown during fetch
- [ ] No AI called during report generation (uses cached `trigger_cache` + raw log data)
- [ ] All sections render correctly on A4 print preview

**FR Covered:** FR30, FR31

---

### E5-S5 - PDF Export via Print CSS

**As a** user who has generated my trigger report,
**I want** to export it as a PDF by printing from my browser,
**so that** I can share or email it to my doctor without a dedicated export backend.

**Acceptance Criteria:**
- [ ] "Save as PDF" button calls `window.print()`
- [ ] `@media print` CSS:
  - Bottom nav, "Save as PDF" button, interactive elements hidden
  - Page margins 1.5cm all around
  - Chart and table fit within A4 width without overflow
  - `page-break-before` between major sections
  - Font colours black/neutral-900
- [ ] Report title set as document `<title>` (used as PDF filename)
- [ ] Prints correctly in Chrome, Safari, and Firefox

**FR Covered:** FR32

---

### E5-S6 - Insufficient Data Empty State & Progress Ring

**As a** user with fewer than 7 log entries,
**I want** the Insights page to acknowledge my progress and show how many more days I need,
**so that** I stay motivated without feeling the feature is broken.

**Acceptance Criteria:**
- [ ] When API returns `{ status: "insufficient_data", entries_needed: N }`:
  - `ProgressRing` centred on page: `(7 - entries_needed) / 7` proportion filled
  - Below ring: "N more days of logging to unlock your first trigger insights"
  - Below that: quiet encouragement message (no exclamation marks)
- [ ] "Start logging" link navigates to `/log`
- [ ] Empty state replaces insight card area; page header and nav render normally
- [ ] `ProgressRing` shared component with E4-S2 Dashboard usage

**UX Covered:** UX-DR8, UX-DR12

---

## E6 - Hawker Food Safety Checker

**Goal:** Help users make safer food choices at Singapore hawker centres. Multilingual search across 80+ dishes returns allergen information and a personalised risk score. Users build a growing My Food Guide for quick future reference.

**Definition of Done:** Search returns 80+ dishes with correct allergens; personalised risk score reflects trigger profile; save/unsave works; My Food Guide persists; swipe-to-remove gesture works.

---

### E6-S1 - Hawker Dish Search (GET /api/hawker)

**As a** server-side API route,
**I want** to handle fuzzy multilingual dish search queries and return matching dishes with allergen data,
**so that** users can find any hawker dish regardless of whether they type in English, Malay, or Chinese.

**Acceptance Criteria:**
- [ ] `app/api/hawker/route.ts` handles GET with `?q=` query parameter
- [ ] Fuzzy matches against `hawker_dishes.name_en`, `name_ms`, `name_zh`, and `aliases[]` columns using pg_trgm
- [ ] Returns max 10 results sorted by match relevance (exact match first, partial, alias last)
- [ ] Response per dish: `{ id, name_en, name_ms, name_zh, allergens: string[], category: string }`
- [ ] Empty query returns top 10 by `popularity_rank`
- [ ] Malformed queries (empty string, special chars) return empty array, never 500
- [ ] Response under 300ms (Supabase text search with GIN index on name columns)

**FR Covered:** FR25

---

### E6-S2 - Dish Result Cards with Allergen Badges & Risk Score

**As a** user searching for a hawker dish,
**I want** allergen information and my personalised risk level for each search result,
**so that** I can make an informed decision about whether to eat that dish.

**Acceptance Criteria:**
- [ ] `/hawker` route renders search page with auto-focused text input at top
- [ ] Input triggers GET `/api/hawker?q=` with 300ms debounce
- [ ] Each result card shows:
  - Dish name EN (h3), Malay and Chinese names below (caption)
  - Allergen badges: one PillarTag-style chip per allergen (shellfish, gluten, nuts, dairy, eggs, etc.)
  - Personalised risk badge: "High Risk" (terracotta), "Moderate" (amber), "Safe" (sage)
- [ ] Risk score logic:
  - "High Risk": dish contains 1+ allergen confirmed as user trigger (from trigger_cache or known_allergens)
  - "Moderate": dish contains 1+ allergen flagged but low confidence
  - "Safe": no known allergen overlap
  - <7 logs: "Unknown -- keep logging" in neutral style
- [ ] Loading: 2 result card skeleton shimmers
- [ ] No results: "No dishes found for '[query]'. Try the English, Malay, or Chinese name."

**FR Covered:** FR26, FR27 | **UX Covered:** UX-DR4, UX-DR7, UX-DR12

---

### E6-S3 - Save Dish to My Food Guide

**As a** user who has found a dish's allergen profile,
**I want** to save it as Safe / Risky / Avoid to build my personal food reference,
**so that** I do not need to look it up again next time.

**Acceptance Criteria:**
- [ ] Each result card has three action buttons: "Safe" (sage), "Risky" (amber), "Avoid" (terracotta)
- [ ] Tapping calls POST `/api/hawker/save` with `{ dish_id, safety_label }`; saves to `saved_dishes` table
- [ ] After saving: tapped button shows filled/active state; success toast "Added to your Food Guide" (3s auto-dismiss)
- [ ] Saving an already-saved dish with new label performs upsert (on user_id + dish_id)
- [ ] Saved dish immediately appears in My Food Guide (optimistic UI update)
- [ ] While POST in-flight: all three buttons disabled; re-enabled on response

**FR Covered:** FR28 | **UX Covered:** UX-DR13

---

### E6-S4 - My Food Guide Section

**As a** returning user,
**I want** all my saved dishes organised by safety label in a persistent guide section,
**so that** I can quickly reference what I have already evaluated.

**Acceptance Criteria:**
- [ ] My Food Guide section auto-expands inline below search results after first dish saved (FR29) -- no separate page
- [ ] Organised in three labelled groups: "Safe", "Approach with caution", "Avoid"
- [ ] Each saved dish shows: name EN, safety label badge, saved date
- [ ] Swipe-left on a saved dish card reveals red "Remove" action button
- [ ] "Remove" calls DELETE `/api/hawker/save`; optimistic removal from UI; updates Supabase
- [ ] Guide persists across sessions (loaded from Supabase on `/hawker` mount)
- [ ] Empty guide: "Your food guide is empty. Search for dishes to build your reference."
- [ ] Saved dish count in section header: "My Food Guide (12)"

**FR Covered:** FR29 | **UX Covered:** UX-DR12, UX-DR14

---

### E6-S5 - Hawker Save/Remove API Routes

**As a** server-side API module,
**I want** save and remove routes for saved dishes,
**so that** the client can persist dish safety decisions without direct browser Supabase access.

**Acceptance Criteria:**
- [ ] POST `app/api/hawker/save/route.ts` accepts `{ user_id, dish_id, safety_label }`; upserts `saved_dishes`; returns `{ success: true, dish: SavedDish }`
- [ ] DELETE `app/api/hawker/save/route.ts` accepts `{ user_id, dish_id }`; deletes matching row; returns `{ success: true }`
- [ ] Both routes validate inputs; return 400 for missing required fields
- [ ] Both routes return 404 if dish does not exist in `hawker_dishes`
- [ ] No Supabase client credentials exposed to browser (NFR9)

**FR Covered:** FR28 | **NFR Covered:** NFR9

---

## E7 — AI Agent Intelligence Showcase

**Goal:** Elevate ClearLah's AI from a parser/narrator utility into a genuinely intelligent agent that reasons temporally, learns from feedback, and answers free-form questions with cited personal evidence. These capabilities directly target the "AI Innovation" (30%) and "Technical Excellence" (20%) judging criteria.

**Definition of Done:** Ask ClearLah answers questions citing specific dates and evidence; AI feedback learning stores corrections and improves future parses; temporal reasoning detects delayed food reactions in narration.

---

### E7-S1 — Ask ClearLah Conversational Agent

**As a** user with an established trigger profile,
**I want** to ask free-text questions like "Can I eat laksa today?" or "Why is today high risk?" and get personalised answers backed by my own data,
**so that** the AI agent feels like a personal health detective, not a form with AI features.

**Acceptance Criteria:**
- [x] `app/api/ai/ask/route.ts` handles POST with `{ question: string }`
- [x] Fetches user's recent 30 log entries, trigger correlations via pattern engine, current NEA weather
- [x] Builds rich system prompt with: user profile, trigger patterns, 14-day detailed evidence (dates + foods + symptom scores + weather + sleep + stress), today's weather, recent foods
- [x] AI instructed to cite specific dates and mechanisms when answering "why" questions
- [x] AI instructed to mention time delay when discussing food triggers (temporal reasoning)
- [x] `AskClearLah` dashboard component with suggestion chips, input field, "AI detective thinking…" loading state, and answer card
- [x] Suggestion chips include "Why is today high risk for me?", "Can I eat laksa today?", "What triggered my last flare?", "Which hawker dishes should I avoid?"
- [x] Graceful fallback when AI unavailable: friendly degradation message
- [x] TypeScript compilation passes with zero errors

**FR Covered:** NEW | **NFR Covered:** NFR9

---

### E7-S2 — AI Feedback Learning Loop

**As a** user who has logged a day,
**I want** to tell the AI whether its parsing was accurate and have it learn from my corrections,
**so that** the AI agent improves its understanding of my language and food habits over time.

**Acceptance Criteria:**
- [x] `PreFillCard` shows three buttons: "Looks right — save" (thumbs up), "Fix it" (opens full form), "Not quite" (opens full form)
- [x] `app/api/ai/feedback/route.ts` stores corrections in `user_profiles.ai_feedback_log` (max 20 entries)
- [x] Feedback entry includes: original message, parsed result, rating (accurate/inaccurate), corrections if any, timestamp
- [x] `app/api/ai/parse-log/route.ts` fetches recent corrections and includes them as few-shot examples in system prompt
- [x] Maximum 3 inaccurate corrections used as few-shot examples (to avoid prompt bloat)
- [x] Feedback is non-blocking — log save always proceeds even if feedback API fails
- [x] After feedback: thank-you message shown ("Thanks! This helps me learn your patterns." / "Got it — I'll do better next time.")
- [x] "AI Analysis" badge on InsightCard makes AI attribution visible

**FR Covered:** NEW | **NFR Covered:** NFR9

---

### E7-S3 — Temporal Reasoning in AI Narration

**As a** user reviewing my insights,
**I want** the AI to detect and explain delayed food reactions (6-12 hour lag),
**so that** I understand why food diaries previously failed to catch my triggers and the AI's intelligence is clearly demonstrated.

**Acceptance Criteria:**
- [x] `app/api/ai/narrate-insights/route.ts` system prompt instructs AI to look for delayed reactions
- [x] AI narration includes temporal mechanism: "Your flares show up 6-8 hours after eating — that time lag is why food diaries never caught this"
- [x] `app/api/ai/ask/route.ts` system prompt includes temporal reasoning instruction for Q&A
- [x] AI narration prompt updated to produce confident, specific 2-3 sentence explanations with mechanism, evidence, and actionable takeaway
- [x] Singlish sparingly used only for takeaway sentences

**FR Covered:** NEW

---

## E8 — Lifestyle Habits & Food Database Expansion

**Goal:** Expand ClearLah's tracking beyond basic food logging by (a) capturing 4 additional lifestyle dimensions that affect chronic conditions, and (b) broadening the food database from 85 hawker-only dishes to 147 dishes spanning hawker centres, restaurant chains, and international cuisines.

**Definition of Done:** AI agent extracts exercise, water, caffeine, and alcohol from free text; ManualLogForm and PreFillCard display these fields; food search returns dishes from all 3 food types with type badges.

---

### E8-S1 — Lifestyle Habit Tracking

**As a** user logging my day,
**I want** the AI agent to extract and track my exercise, water intake, caffeine consumption, and alcohol intake,
**so that** I can see how these lifestyle factors correlate with my symptoms over time.

**Acceptance Criteria:**
- [x] `LifestyleLog` type includes: `exercise_minutes`, `water_ml`, `caffeine_cups`, `alcohol_drinks` (all required, nullable)
- [x] AI parse-log system prompt instructs extraction of all 4 fields with inference hints (e.g., "8 glasses" → 2000ml)
- [x] Fallback regex parser detects: exercise ("ran 30min"), water ("8 glasses" → 2000ml), caffeine (coffee/tea mentions → 1 cup), alcohol (beer/wine mentions → 1 drink)
- [x] `POST /api/logs` persists all 7 lifestyle fields to Supabase
- [x] `ManualLogForm` includes 2×2 grid with number inputs for exercise, water, caffeine, alcohol
- [x] `PreFillCard` displays exercise, water, caffeine, alcohol rows when detected by AI
- [x] TypeScript compilation passes with zero errors
- [x] 129+ tests passing

**FR Covered:** NEW

---

### E8-S2 — Food Database Expansion (Restaurant + International)

**As a** user searching for food safety information,
**I want** to find dishes from restaurant chains (McDonald's, Din Tai Fung, etc.) and international cuisines (Italian, Japanese, Korean, etc.),
**so that** I can check allergens and personal risk for any food I encounter, not just hawker centre dishes.

**Acceptance Criteria:**
- [x] Migration adds `food_type` column to `hawker_dishes` with CHECK: `hawker`, `restaurant`, `international`
- [x] Category CHECK expanded to 19 types including: `fast_food`, `chinese_restaurant`, `japanese`, `korean`, `italian`, `western`, `thai`, `indian`, `vietnamese`, `mexican`
- [x] 25 restaurant chain dishes seeded: McDonald's (5), KFC (4), Burger King (2), Subway (2), Din Tai Fung (3), Hai Di Lao (2), Tim Ho Wan (2), Jollibee (2), Shake Shack (1)
- [x] 37 international cuisine dishes seeded: Italian (6), Japanese (6), Korean (4), Western (5), Thai (4), Indian (4), Vietnamese (3), Mexican (3)
- [x] Total food database: 85 hawker + 62 new = 147 dishes across 19 categories and 3 food types
- [x] Hawker search API returns `food_type` in results
- [x] `DishResultCard` displays food type badge: yellow "Hawker", blue "Restaurant", purple "International"
- [x] `DbHawkerDish` and `HawkerCategory` types updated with all new categories
- [x] All tests passing

**FR Covered:** NEW

---

## E9 — v2: The Detective's Sensors

**Goal:** Transform ClearLah's AI agent from retrospective detection to interceptive prevention and care guidance by adding five new data streams: camera-based food identification, frictionless voice logging, safe food commerce integration, photo-based skin tracking, and personalised foods-to-eat guidance. Each sensor feeds the agent richer data, making the detective — and care navigator — smarter.

**Definition of Done:** Camera identifies hawker dishes with risk score overlay; voice input works in under 15 seconds with tone inference; grocery list generates from safe meal history; skin photo returns a 0–10 tracking score with triage; "foods to eat" list is personalised against the user's allergens.

---

### E9-S1 — HawkerScan: Camera-to-Log

**As a** user at a hawker centre,
**I want** to point my camera at my food or the stall signboard and have ClearLah identify the dish, log it, and show my personal risk score,
**so that** I can make an informed decision before I eat, without typing anything.

**Acceptance Criteria:**
- [ ] Camera viewfinder opens from Log screen via "Scan dish" button
- [ ] AI identifies dish from photo (dish recognition) OR OCRs the stall name from signboard
- [ ] Matched dish cross-referenced against hawker DB + user trigger profile
- [ ] Risk overlay shown on camera feed: "Laksa — High Risk for you (shellfish + humidity pattern)"
- [ ] "Log it" button saves dish to today's log entry with photo attachment
- [ ] Camera permission requested in-context, not during onboarding
- [ ] Works offline with on-device model for dish recognition; falls back to API when online
- [ ] Crowd-sourced stall-level data: "3 ClearLah users with shellfish triggers reported flares after eating here"

**FR Covered:** NEW

---

### E9-S2 — Voice Log: Ambient Check-In

**As a** busy user,
**I want** to log my day by speaking to ClearLah in under 15 seconds and receive an evening check-in prompt,
**so that** logging friction drops to near-zero and my streak is effortless to maintain.

**Acceptance Criteria:**
- [ ] "Hey ClearLah" voice activation from Dashboard or Log screen
- [ ] Speech-to-text processes free-form food/lifestyle/symptom descriptions
- [ ] Parsed result spoken back for confirmation: "Got it — chicken rice, skin 3/10. Save?"
- [ ] Evening push notification at user's configured time: "How's your skin tonight?"
- [ ] One-word or numeric voice reply accepted ("itchy", "4 out of 10")
- [ ] Emotional tone detection from voice: hesitancy, fatigue → suggests logging stress
- [ ] Works with screen locked (background audio permission)
- [ ] All voice data processed on-device where possible; never stored as raw audio

**FR Covered:** NEW

---

### E9-S3 — ClearCart: Safe Food Commerce

**As a** user with established safe food patterns,
**I want** ClearLah to generate a weekly grocery list of my safe foods and surface safe nearby dishes from food delivery apps,
**so that** every food decision I make is informed by my trigger profile.

**Acceptance Criteria:**
- [ ] "My Safe Shop" generates weekly grocery list from last 14 days of safe meals
- [ ] Integrates with FairPrice/RedMart API for one-tap ordering
- [ ] "Nearby Safe Dishes" surfaces GrabFood/Foodpanda dishes near user's location with 92%+ safety match
- [ ] Safety score shown per dish: "Chicken Rice — 96% safe for you"
- [ ] "Order now" deep-links to delivery app
- [ ] Grocery list updates automatically as trigger profile evolves
- [ ] Delivery app integration uses public APIs; no user credentials stored

**FR Covered:** NEW

---

### E9-S4 — SkinCheck: Photo Skin Tracking & Triage

**As a** user who wants an objective read on my skin,
**I want** to upload a photo of my skin and get a flare tracking score with a severity label and, when severe, a recommendation to see a dermatologist,
**so that** I can monitor changes over time and know when to escalate to professional care.

**Acceptance Criteria:**
- [ ] "Skin check" button opens photo upload from the Log screen
- [ ] AI returns a 0–10 flare tracking score and severity label (clear/mild/moderate/severe)
- [ ] Severe scores (or urgent indicators like weeping/crusting) trigger a "consider seeing a dermatologist" nudge
- [ ] Generic self-care tips shown; no medical diagnosis or treatment advice
- [ ] "Log it" saves the skin score to today's log entry
- [ ] Photos sent to the AI provider for analysis and never stored
- [ ] Disclaimer shown: tracking score, not a diagnosis

**FR Covered:** NEW

---

### E9-S5 — EatClear: Foods to Eat

**As a** user tired of only hearing what to avoid,
**I want** ClearLah to recommend anti-inflammatory, skin-supportive foods personalised to exclude my allergens,
**so that** I have positive, actionable guidance — not just deprivation.

**Acceptance Criteria:**
- [ ] "Foods to eat" card shown on the dashboard
- [ ] Recommendations are evidence-tiered (strongly supported / moderate / emerging)
- [ ] Foods are filtered against the user's known allergens and confirmed triggers (plural/synonym-aware)
- [ ] Each recommendation lists the nutrient, benefit, and concrete examples
- [ ] Completes the "avoid → swap" loop alongside existing trigger detection

**FR Covered:** NEW

---

## Appendix: Shared UI Components

The following components are referenced across multiple epics and should be built as shared components in `components/ui/`:

| Component       | Stories Using It         | UX Req   |
|-----------------|--------------------------|----------|
| StreakBadge      | E3-S6, E4-S3, E4-S5     | UX-DR5   |
| ProgressRing     | E4-S2, E5-S6            | UX-DR8   |
| PillarTag        | E2-S2, E3-S4, E5-S3, E6-S2 | UX-DR4 |
| InsightCard      | E5-S3                   | UX-DR2   |
| HighRiskDayAlert | E4-S4                   | UX-DR3   |
| ChatInterface    | E3-S1                   | UX-DR6   |
| SkeletonShimmer  | E3-S1, E4-S1, E5-S3, E6-S2, E5-S4 | UX-DR7 |
| Toast            | E3-S6, E6-S3            | UX-DR13  |

---

## Implementation Order (Suggested)

**Day 2 (Today):** E1-S1, E1-S2, E1-S3 (scaffold + DB + weather)
**Day 3:** E2-S1 through E2-S3 (onboarding flow), E3-S1 (chat UI shell)
**Day 4:** E3-S2, E3-S3, E3-S6 (AI parser, pre-fill, save), E4-S1 (Dashboard)
**Day 5:** E4-S3, E4-S4, E5-S1, E5-S2, E5-S3 (streaks, risk banner, pattern engine, insights)
**Day 6:** E6-S1 through E6-S4 (hawker checker), E5-S4, E5-S5 (doctor report + PDF)
**Day 7:** E1-S4, E1-S5 (demo seeding, Vercel deploy), E2-S5, E3-S5 (progressive profiling, meal suggestions)
**Day 8:** Buffer / polish / accessibility sweep
