# Story 2.5: Progressive Profiling (Day 2 & Day 3 Questions)

Status: review

## Story

As a returning user on my second and third log days,
I want the AI to ask one additional profile question naturally in the chat,
so that my profile becomes richer without overwhelming me during onboarding.

## Acceptance Criteria

1. Day 2 (second calendar day with log): AI sends warm-up message asking about known food allergens/sensitivities; response parsed into `user_profiles.known_allergens text[]`; "Skip for now" option available
2. Day 3: AI asks about daily skincare routine; response stored in `user_profiles.daily_skincare text`
3. Each question asked exactly once; tracked via `user_profiles.onboarding_step` (1 = fresh, 2 = Day 2 asked, 3 = Day 3 asked)
4. Idempotent: already-answered questions never re-asked
5. Questions skipped entirely in demo mode (demo user has `onboarding_step = 3`)
6. Singlish unlocks when `onboarding_step >= 3`

## Tasks / Subtasks

- [x] Task 1: Extend profile API route to accept new fields (AC: 1, 2)
  - [x] 1.1 Add `known_allergens` and `daily_skincare` to accepted fields in `app/api/profile/route.ts`
  - [x] 1.2 Validate `known_allergens` is `string[]` when present; `daily_skincare` is `string` when present
  - [x] 1.3 Add `onboarding_step` field: accept integer 1-3; update on each progressive question answered
  - [x] 1.4 Ensure backward compatibility — existing onboarding steps (tracking_for, conditions, disclaimer) unaffected
  - [x] 1.5 Add `singlish_unlocked` field: set to `true` when `onboarding_step >= 3` (AC: 6)

- [x] Task 2: Build `components/ui/ProgressiveQuestionBubble.tsx` (AC: 1, 2)
  - [x] 2.1 Create a chat bubble component that renders as an AI-style message with a question + "Skip for now" button
  - [x] 2.2 Props: `question: string`, `onSkip: () => void`, `isVisible: boolean`
  - [x] 2.3 "Skip for now" button: ghost style, dismisses bubble, sets onboarding_step without saving answer
  - [x] 2.4 Animate in with fade + translate-y 180ms (suppressed `prefers-reduced-motion`)
  - [x] 2.5 `aria-live="polite"` on question text; `aria-label="Skip for now"` on skip button
  - [x] 2.6 Keyboard navigable: Tab to "Skip", Enter/Space activates

- [x] Task 3: Integrate Day 2 question into ChatInterface (E3-S1 dependency) (AC: 1, 3, 4)
  - [x] 3.1 **BLOCKED by E3-S1 + E3-S2**: ChatInterface and AI pipeline must exist
  - [x] 3.2 On `/log` mount, read `user_profiles.onboarding_step` from Supabase (or localStorage cache)
  - [x] 3.3 If `onboarding_step === 1`: insert Day 2 allergen question
  - [x] 3.4 If "Skip for now" tapped: update `onboarding_step` to `2` without allergens

- [x] Task 4: Integrate Day 3 question (AC: 2, 3, 4)
  - [x] 4.1 If `onboarding_step === 2`: insert Day 3 skincare question
  - [x] 4.2 If "Skip for now" tapped: update `onboarding_step` to `3`

- [x] Task 5: Demo mode skip + Singlish unlock (AC: 5, 6)
  - [x] 5.1 When `NEXT_PUBLIC_DEMO_MODE=true`: skip all progressive questions; `onboarding_step` defaults to `3` (set in seed.sql)
  - [x] 5.2 When `onboarding_step >= 3`: set `singlish_unlocked = true` in profile
  - [x] 5.3 Singlish greeting variants (Day 4+) gated on `singlish_unlocked` — used by ChatInterface adaptive greeting logic

## Dev Notes

### Prerequisite / Blocking Stories
**E3-S1 (Chat Log Interface)** and **E3-S2 (AI Log Parser)** must be completed first. The progressive questions appear inside the ChatInterface flow, and the AI needs to parse the free-text responses (at minimum for the Day 2 allergen question).

### Architecture Rules (from ClearLah-Architecture-Spine.md)
- **AD-2**: All AI calls go through Next.js API routes. The Day 2 allergen parsing could use a simple `/api/ai/parse-allergens` route, or be handled inline by the existing E3-S2 parse-log route with a "mode: allergens" parameter. Prefer extending parse-log with a mode flag to avoid route proliferation.
- **AD-3**: Supabase is the system of record. `onboarding_step`, `known_allergens`, `daily_skincare`, `singlish_unlocked` are persisted to `user_profiles`. localStorage caches after confirmed Supabase write.
- **Demo mode bypass**: `NEXT_PUBLIC_DEMO_MODE=true` → skip all progressive questions. Demo user's `onboarding_step` is pre-set to `3` in `supabase/seed.sql`.

### Existing Code Patterns (Carried Forward)
- **Profile API extension pattern**: From E2-S1 → E2-S2 → E2-S3, the `/api/profile` route was progressively extended with new accepted fields (`tracking_for` → `conditions` → `disclaimer_acknowledged`). Follow the same dynamic upsert pattern: only include fields present in the request body. See `app/api/profile/route.ts:88-93`.
- **localStorage caching**: Follow the `clearlah_onboarding` pattern — cache profile fields after confirmed save. Key: existing `clearlah_onboarding` can be extended with `onboardingStep`, `knownAllergens`, `dailySkincare`.
- **Supabase `.maybeSingle()` pattern**: Use `.maybeSingle()` not `.single()` for profile reads (prevents 500 on missing rows). E2-S3 review patch established this.
- **Two-table write verification**: E2-S3 established the pattern of verifying writes succeeded (select + check after update). Follow for `onboarding_step` updates.
- **Error handling**: Try/catch all Supabase queries. Distinguish `SyntaxError` (400), `UnauthenticatedError` (401), Supabase errors (500). Import `UnauthenticatedError` from `lib/utils/demo.ts`.

### Database Schema Reference
From E1-S2 migration and `lib/types/database.ts`:
```ts
// user_profiles table (Supabase)
type DbUserProfile = {
  user_id: string;
  tracking_for: "myself" | "my_child" | "someone_else" | null;
  conditions: string[] | null;
  disclaimer_acknowledged: boolean | null;
  trigger_cache: Json | null;
  singlish_unlocked: boolean | null;
  onboarding_step: number | null;  // default 1
  known_allergens: string[] | null;
  daily_skincare: string | null;
  streak: number | null;
  streak_last_date: string | null;
  updated_at: string | null;
};
```

### Key Files to Touch
| File | Action | Description |
|------|--------|-------------|
| `app/api/profile/route.ts` | MODIFY | Add `known_allergens`, `daily_skincare`, `onboarding_step`, `singlish_unlocked` to accepted POST fields |
| `components/ui/ProgressiveQuestionBubble.tsx` | NEW | Chat bubble with question + "Skip for now" action |
| `app/log/page.tsx` or ChatInterface | MODIFY | Integrate Day 2/Day 3 questions into the chat flow (after E3-S1 exists) |
| `supabase/seed.sql` | MODIFY | Set demo user `onboarding_step = 3`, `singlish_unlocked = true` (if not already) |
| `lib/types/database.ts` | MODIFY | Ensure `DbUserProfile` includes `onboarding_step`, `known_allergens`, `daily_skincare`, `singlish_unlocked` |

### Day 2 / Day 3 Detection Logic
```
ChatInterface mounts (on /log)
  → Fetch user profile from Supabase
  → Read onboarding_step
  → If onboarding_step === 1:
      → Show Day 2 question (known allergens) after AI greeting
  → If onboarding_step === 2:
      → Show Day 3 question (skincare) after AI greeting
  → If onboarding_step >= 3:
      → No progressive question; proceed to normal log flow
  → If demo mode:
      → Skip all; proceed to normal log flow

After user answers (or skips):
  → POST /api/profile with { onboarding_step: newStep, [known_allergens]: [...], [daily_skincare]: "..." }
  → Update localStorage clearlah_onboarding cache
  → Continue normal log flow
```

### Tone & Copy
Per EXPERIENCE.md voice rules:
- **Day 2 allergen question**: "By the way — do you have any known food allergies or sensitivities? Helps me watch for patterns." Calm, helpful, not clinical.
- **Day 3 skincare question**: "Quick one — any skincare products you use daily? Moisturisers, creams, sunscreens…" Casual, low-pressure.
- **"Skip for now" label**: Always visible, equally weighted with answering. Ghost-style button — not hidden or faded.
- **No Singlish** in days 1-3 questions (Singlish rule: only from Day 4+).

### Testing Guidance
- Unit tests: `__tests__/components/ProgressiveQuestionBubble.test.tsx` — renders question text, skip button dismisses, aria attributes present
- Unit tests: `__tests__/api/profile.test.ts` — extend existing tests to verify `known_allergens`, `daily_skincare`, `onboarding_step` accepted and validated
- Manual: Complete onboarding → Day 2 `/log` → verify allergen question appears → type "shellfish, peanuts" → verify saved to Supabase `user_profiles.known_allergens` → verify `onboarding_step` = 2
- Manual: Day 2 → tap "Skip for now" → verify `onboarding_step` = 2 → reload `/log` → verify question does NOT reappear
- Manual: Day 3 `/log` → verify skincare question → type "Cetaphil moisturizer" → verify saved → verify `onboarding_step` = 3, `singlish_unlocked` = true
- Manual: Day 3 → tap "Skip for now" → verify `onboarding_step` = 3
- Manual: Demo mode → `/log` → verify no progressive questions appear, `onboarding_step` = 3 in seed
- Manual: After `onboarding_step >= 3`, verify ChatInterface greeting adapts to casual tone (from E3-S1 adaptive greeting logic)

### UX Design References
- EXPERIENCE.md Flow 1 Steps 5-6 (lines 302-303): "After log, AI asks one question" pattern
- EXPERIENCE.md Singlish rules (lines 94-97): Days 1-3 no Singlish; Day 4+ "lah" may appear
- EXPERIENCE.md Tone guide: Welcoming, assured tone for early days — no Singlish in first 3 days
- DESIGN.md: Chat bubble styles — `chat-bubble-ai` (see globals.css `.bubble-ai`)

### References
- E3-S1 ChatInterface: epics.md lines 307-324
- EXPERIENCE.md Flow 1: lines 298-306 (progressively disclosed profile building)
- Architecture AD-3: Data Store rules (lines 28-33)
- Profile API route: `app/api/profile/route.ts` (165 lines, dynamic upsert pattern)
- Database types: `lib/types/database.ts` — user_profiles row shape
- Seed SQL: `supabase/seed.sql` — demo user defaults

## Dev Agent Record

### Agent Model Used

deepseek-v4-pro (via opencode)

### Debug Log References

### Completion Notes List

- Extended `app/api/profile/route.ts` with `known_allergens` (string[]), `daily_skincare` (string|null), `onboarding_step` (1-3), `singlish_unlocked` (auto-computed from onboarding_step >= 3). Full backward compatibility maintained for all existing onboarding fields.
- Created `components/ui/ProgressiveQuestionBubble.tsx` — AI-style chat bubble with configurable question text, "Skip for now" ghost button, fade-in-up animation, WCAG 2.5.5 touch targets, aria-live polite
- Demo mode skip: already handled by `supabase/seed.sql` setting `onboarding_step = 3` for demo user
- Integrated into ChatInterface: Day 2 allergen question (onboardingStep === 1), Day 3 skincare question (onboardingStep === 2), skips in demo mode, user answers routed to profile API, "Skip for now" updates step without saving
- ChatInterface's `handleSubmit` distinguishes progressive question mode from normal log flow
- `app/log/page.tsx` now passes `onboardingStep` to ChatInterface
- Singlish greeting gating: `singlishUnlocked && logCount >= 3` → Tier 3 greeting (implemented in E3-S1)

### File List

- `app/api/profile/route.ts` — MODIFIED (extended with known_allergens, daily_skincare, onboarding_step, singlish_unlocked)
- `components/ui/ProgressiveQuestionBubble.tsx` — NEW
- `components/ui/ChatInterface.tsx` — MODIFIED (integrated progressive question bubbles + questionMode state)
- `app/log/page.tsx` — MODIFIED (pass onboardingStep to ChatInterface)
- `__tests__/api/profile-extension.test.ts` — NEW
- `__tests__/components/ProgressiveQuestionBubble.test.tsx` — NEW
- `__tests__/components/ChatInterface.test.tsx` — MODIFIED (added progressive question integration tests)
