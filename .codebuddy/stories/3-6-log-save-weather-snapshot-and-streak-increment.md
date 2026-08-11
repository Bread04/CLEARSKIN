# Story 3.6: Log Save, Weather Snapshot & Streak Increment

Status: ready-for-dev

## Story

As a user who has filled in today's log,
I want my entry to save with today's weather attached and my streak to increment,
so that weather context is captured automatically and my consistency is rewarded.

## Acceptance Criteria

1. "Confirm & Save" triggers: (1) GET `/api/weather`, (2) POST `/api/logs` with full log object + weather snapshot
2. Log written to Supabase `log_entries`; localStorage updated ONLY after confirmed Supabase write
3. On Supabase failure: data saved to sessionStorage; toast "Couldn't save — will retry when connected" shown
4. Automatic retry when `navigator.onLine` changes to true
5. After successful save: streak counter increments by 1 with 200ms scale-up animation
6. Same-day re-save performs upsert (no duplicate entries for same `logged_at` date)
7. Weather snapshot stored as `{ temp, humidity, psi, uv, source, simulated? }` in `log_entries.weather_snapshot`
8. User navigated to `/dashboard` with success toast: "Day logged! Keep it up." (Singlish variant when unlocked)

## Tasks / Subtasks

- [ ] Task 1: Create `app/api/logs/route.ts` (AC: 2, 6)
  - [ ] 1.1 POST handler: accept `{ log: LogPayload, weather_snapshot: WeatherSnapshot, user_id: string }`
  - [ ] 1.2 Validate: `log` required, `weather_snapshot` required, `user_id` required
  - [ ] 1.3 Validate log fields: food items, sleep 0-24, stress 1-5, symptom sliders 1-10
  - [ ] 1.4 Build insert row from LogPayload + WeatherSnapshot + user_id + `logged_at` (today's date)
  - [ ] 1.5 UPSERT: `ON CONFLICT (user_id, logged_at) DO UPDATE` — enables same-day re-save
  - [ ] 1.6 Return `{ success: true, entry: DbLogEntry }` on success
  - [ ] 1.7 Return 400 for validation errors, 500 for Supabase errors
  - [ ] 1.8 Also return updated `streak` and `streak_last_date` from `user_profiles`

- [ ] Task 2: Build save pipeline in ChatInterface (AC: 1, 5, 8)
  - [ ] 2.1 Create `lib/utils/save-log.ts`: `saveLogEntry(logPayload, userId)` — orchestrates weather + Supabase write
  - [ ] 2.2 Step 1: `GET /api/weather` — fetch current weather snapshot
  - [ ] 2.3 Step 2: `POST /api/logs` with `{ log: logPayload, weather_snapshot: weatherData, user_id: userId }`
  - [ ] 2.4 On success: update `localStorage` with last saved log date (key: `clearlah_last_log_date`)
  - [ ] 2.5 Update streak counter in UI: increment by 1 with 200ms `scale-110 → scale-100` animation via CSS `@keyframes`
  - [ ] 2.6 Show success confirmation in chat: "✓ Log saved for today. 🔥 {streak} day streak!"
  - [ ] 2.7 Collapse PreFillCard after save
  - [ ] 2.8 After 1.5s, navigate to `/dashboard` with success toast: "Day logged! Keep it up."

- [ ] Task 3: Offline resilience (AC: 3, 4)
  - [ ] 3.1 Wrap save in try/catch; on failure, store `{ logPayload, weather_snapshot, timestamp }` in sessionStorage key `clearlah_pending_save`
  - [ ] 3.2 Show toast: "Couldn't save — will retry when connected" (5s duration, persistent variant)
  - [ ] 3.3 Listen to `window.addEventListener("online", ...)` — on reconnect, attempt to save pending log
  - [ ] 3.4 On successful retry: clear sessionStorage, show success toast
  - [ ] 3.5 On retry failure: keep in sessionStorage, show same "will retry" toast

- [ ] Task 4: Streak increment + upsert logic (AC: 5, 6)
  - [ ] 4.1 In `/api/logs` route: after upserting log entry, check current streak
  - [ ] 4.2 Read `user_profiles.streak` and `streak_last_date`
  - [ ] 4.3 If `streak_last_date === yesterday`: increment streak by 1
  - [ ] 4.4 If `streak_last_date === today`: same-day re-save, do NOT increment streak
  - [ ] 4.5 If `streak_last_date < yesterday - 1`: reset streak to 1
  - [ ] 4.6 Update `user_profiles.streak` and `streak_last_date` in same transaction as log save
  - [ ] 4.7 **Critical**: Use `CHECK (streak >= 0)` constraint already on `user_profiles` — verify non-negative

- [ ] Task 5: Weather snapshot integration (AC: 7)
  - [ ] 5.1 `WeatherSnapshot` type already defined in `lib/types/database.ts:83-92`
  - [ ] 5.2 Call `GET /api/weather` immediately before saving (weather route returns `WeatherApiResponse` which IS `WeatherSnapshot`)
  - [ ] 5.3 Store the full `WeatherSnapshot` object in `log_entries.weather_snapshot` JSONB column
  - [ ] 5.4 Weather includes: `temp`, `humidity`, `psi`, `uv`, `source`, `simulated_fields`, `fetched_at`
  - [ ] 5.5 "Simulated data" badge shown in PreFillCard weather section when `simulated: true`

- [ ] Task 6: Success navigation + toast (AC: 8)
  - [ ] 6.1 After save success, show animated streak update → 1.5s delay → `router.push("/dashboard")`
  - [ ] 6.2 Pass `?justLogged=true` query param to Dashboard → triggers success toast
  - [ ] 6.3 Toast: position bottom-center, above nav, green left border (success variant)
  - [ ] 6.4 Toast text: "Day logged! Keep it up." (standard) or "Huat ah! Day logged, lah." (Singlish, when `singlish_unlocked`)
  - [ ] 6.5 Toast auto-dismisses after 3s; swipable to dismiss earlier

## Dev Notes

### Prerequisites
- **E3-S1**: ChatInterface must exist (provides "Confirm & Save" trigger point)
- **E3-S3**: PreFillCard must exist (provides the log data to save)
- **E1-S3**: `/api/weather` already exists and works (mock fallback ready)
- The log save is the critical path that makes all of E3 functional end-to-end.

### Architecture Rules
- **AD-3**: Supabase is the system of record. localStorage updated ONLY after confirmed Supabase write (never before). See State Mutation Rules in Architecture Spine lines 78-82.
- **AD-5**: Weather flows through `/api/weather` which returns live NEA or mock. Already built in E1-S3.
- **AD-6**: `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS in demo mode. The `/api/logs` route uses this for writes.
- **Same-day upsert**: No duplicate entries for same `logged_at`. The schema has `UNIQUE (user_id, logged_at)` constraint.
- **localStorage**: NEVER the source of truth for logs. Used only as a read cache and offline resilience buffer.

### Existing Code Patterns
- **API route pattern**: Follow `app/api/profile/route.ts` — validate input, try/catch, typed responses, `createClient()` for Supabase
- **Weather API**: Already built — `GET /api/weather` returns `WeatherApiResponse`. No changes needed.
- **Toast component**: Not yet built — create `components/ui/Toast.tsx` following EXPERIENCE.md toast spec (lines 261-266)
- **Animation**: `scale-110 → scale-100` for streak increment, 200ms `ease-spring` (defined in globals.css)
- **localStorage key naming**: `clearlah_*` prefix convention. Use `clearlah_last_log_date` and `clearlah_pending_save`.

### Streak Logic (Server-Side in `/api/logs`)
```ts
// Pseudocode for streak computation in POST /api/logs
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStr = yesterday.toISOString().split("T")[0];
const todayStr = new Date().toISOString().split("T")[0];

const { data: profile } = await supabase
  .from("user_profiles")
  .select("streak, streak_last_date")
  .eq("user_id", userId)
  .single();

let newStreak = 1;
if (profile.streak_last_date === yesterdayStr) {
  newStreak = profile.streak + 1;  // consecutive day
} else if (profile.streak_last_date === todayStr) {
  newStreak = profile.streak;      // same-day re-save, no increment
}
// else: streak broken, reset to 1

await supabase.from("user_profiles").update({
  streak: newStreak,
  streak_last_date: todayStr,
}).eq("user_id", userId);
```

### Key Files to Touch
| File | Action | Description |
|------|--------|-------------|
| `app/api/logs/route.ts` | NEW | POST handler: save log + weather + streak |
| `lib/utils/save-log.ts` | NEW | Client-side save orchestrator: weather → Supabase → offline fallback |
| `components/ui/ChatInterface.tsx` | MODIFY | Wire "Confirm & Save" to save pipeline |
| `components/ui/Toast.tsx` | NEW | Toast notification component |
| `components/ui/PreFillCard.tsx` | MODIFY | Wire onConfirm to trigger save |

### Testing Guidance
- Unit: `__tests__/api/logs.test.ts` — POST valid log → verify Supabase row created + streak incremented; POST same-day again → verify upsert (no duplicate); POST with invalid food → verify 400
- Unit: `__tests__/utils/save-log.test.ts` — mock weather + Supabase; verify two-step flow; mock Supabase failure → verify sessionStorage fallback
- Manual: Complete full flow: type message → AI parse → pre-fill card → edit → "Confirm & Save" → verify log in Supabase → verify streak incremented → verify redirected to Dashboard with toast
- Manual: Same-day re-save → verify upsert, streak unchanged
- Manual: Day 2 consecutive → verify streak increments to 2
- Manual: Simulate offline (DevTools → Offline) → save → verify sessionStorage fallback → go online → verify retry
- Manual: Demo mode → verify save works with DEMO_USER_ID

### UX Design References
- EXPERIENCE.md Streak Counter (lines 132-137): increment on confirmed save, milestone modals
- EXPERIENCE.md Toast Notifications (lines 261-266): bottom-center, 3s auto-dismiss, green left border for success
- EXPERIENCE.md Flow 2 Step 8-9 (lines 321-323): "✓ Log saved for today. 🔥 4 days in a row!" → Dashboard navigation
- DESIGN.md streak-badge: `bg-secondary text-white rounded-full font-bold`
- DESIGN.md motion: `duration-micro` 120ms for streak badge pop, `ease-spring` for scale animation

### References
- E3-S6 requirements: epics.md lines 413-430
- Architecture AD-3: Data Store rules lines 28-33
- Architecture AD-5: Weather Integration lines 42-45
- State Mutation Rules: ClearLah-Architecture-Spine.md lines 78-82
- Weather API: app/api/weather/route.ts (already built, E1-S3)
- Profile API pattern: app/api/profile/route.ts
- Database schema: supabase/migrations/20260808000000_initial_schema.sql
- Database types: lib/types/database.ts — LogPayload, WeatherSnapshot, DbLogEntry
- Streak constraint: CHECK (streak >= 0) on user_profiles

## Dev Agent Record

### Agent Model Used

(To be filled by dev agent)

### Debug Log References

### Completion Notes List

### File List
