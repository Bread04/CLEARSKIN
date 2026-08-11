# Story 4.3: Streak Counter & Milestone Celebration Modals

Status: ready-for-dev

## Story

As a consistent logger,
I want my daily streak counted and celebrated at key milestones,
so that I feel acknowledged for consistency and am motivated to continue.

## Acceptance Criteria

1. `StreakBadge`: terracotta pill, flame icon, white bold streak number; in Dashboard header AND Log nav micro-badge
2. Streak increments by 1 after each successful log save (not on same-day re-saves)
3. Streak resets to 0 if a calendar day is missed (checked on Dashboard mount by comparing most recent log date to today)
4. Streak stored in `user_profiles.streak` and `streak_last_date` (not recomputed from scratch)
5. Milestone modals fire at: 3, 7, 14, 21, 30 days
6. Modal: full-screen overlay, centred card, milestone number in `numeric` typography, personalised message, "Keep going" dismiss button; 180ms in/out animation; focus trapped while open
7. Each milestone fires only once (tracked in `user_profiles`)
8. `aria-live="polite"` announces streak increment; streak badge 200ms scale-up animation on increment

## Tasks / Subtasks

- [ ] Task 1: Streak reset logic — dashboard mount check (AC: 3, 4)
  - [ ] 1.1 In `app/dashboard/page.tsx`: after fetching profile, compare `streak_last_date` to today and yesterday
  - [ ] 1.2 If `streak_last_date === today-1`: streak still active (yesterday logged)
  - [ ] 1.3 If `streak_last_date < today-1`: streak broken → update `user_profiles.streak = 0` in DB
  - [ ] 1.4 If `streak_last_date === today`: streak already counted (no change)
  - [ ] 1.5 Do NOT recompute streak from scratch — use the stored value as source of truth

- [ ] Task 2: Build `components/ui/MilestoneModal.tsx` (AC: 5, 6, 7)
  - [ ] 2.1 Client component: props `milestone: number`, `onDismiss: () => void`
  - [ ] 2.2 Full-screen overlay: `bg-black/40`, centred card with 180ms fade-in
  - [ ] 2.3 Card: `rounded-xl`, white background, milestone number in `numeric` typography (2.5rem/700)
  - [ ] 2.4 Milestone-specific messages:
    - 3: "3 days in a row! You're building a habit."
    - 7: "One week of tracking! Your first insights are near."
    - 14: "Two weeks strong — patterns are taking shape."
    - 21: "Three weeks! This is becoming second nature."
    - 30: "A full month! Your health detective work is paying off."
  - [ ] 2.5 "Keep going" primary button; `aria-label="Dismiss milestone"`
  - [ ] 2.6 Focus trap: Tab cycles inside modal; Escape dismisses; `aria-modal="true"`
  - [ ] 2.7 Track shown milestones: store array in `user_profiles` (or localStorage key `clearlah_shown_milestones`)
  - [ ] 2.8 180ms animation: `animate-fade-in-up` on card

- [ ] Task 3: Integrate into DashboardClient (AC: 1, 2, 8)
  - [ ] 3.1 After dashboard mount, check if streak is at a milestone (3, 7, 14, 21, 30)
  - [ ] 3.2 If milestone not previously shown: open MilestoneModal
  - [ ] 3.3 On dismiss: mark milestone as shown (post to profile API or localStorage)
  - [ ] 3.4 `StreakBadge` already rendered in header (from E4-S1)
  - [ ] 3.5 After log save (E3-S6): streak incremented via `/api/logs` — badge reflects new value on next Dashboard visit
  - [ ] 3.6 `aria-live="polite"` on StreakBadge container for screen reader announcements

## Dev Notes

### Dependencies
- **E4-S1**: DashboardClient and StreakBadge exist. StreakBadge is the visual anchor.
- **E3-S6**: `/api/logs` handles streak increment on save. This story handles the Dashboard-side reset + celebration.

### Architecture Rules
- **AD-3**: Streak stored in `user_profiles.streak` and `streak_last_date`. Dashboard checks on mount, not on every API call.
- Streak reset is defensive: `streak_last_date` comparison prevents stale counters.

### Streak Reset Logic (Server-Side)
```ts
const today = new Date().toISOString().split("T")[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

const { data: profile } = await supabase
  .from("user_profiles")
  .select("streak, streak_last_date")
  .eq("user_id", userId)
  .maybeSingle();

let displayStreak = profile?.streak ?? 0;
if (profile?.streak_last_date && profile.streak_last_date < yesterday) {
  displayStreak = 0;
  await supabase.from("user_profiles").upsert(
    { user_id: userId, streak: 0 },
    { onConflict: "user_id" }
  );
}
```

### Key Files to Touch
| File | Action | Description |
|------|--------|-------------|
| `components/ui/MilestoneModal.tsx` | NEW | Modal overlay with milestone celebration |
| `app/dashboard/page.tsx` | MODIFY | Add streak reset logic |
| `components/dashboard/DashboardClient.tsx` | MODIFY | Milestone modal trigger, aria-live |

### Testing Guidance
- Unit: `__tests__/components/MilestoneModal.test.tsx` — render at day 7, verify message, Escape dismisses, focus trap
- Manual: Set streak to 3 → visit dashboard → verify modal shows → dismiss → reload → verify modal does NOT re-show
- Manual: Set streak_last_date to 2 days ago → visit dashboard → verify streak resets to 0

### UX Design References
- EXPERIENCE.md Streak Counter (lines 132-137): increment on save, milestone messages
- DESIGN.md streak-badge: `bg-secondary text-white rounded-full font-bold`
- DESIGN.md numeric typography: 2.5rem/700 for milestone numbers
- EXPERIENCE.md animations: milestone modal 180ms fade + scale

### References
- E4-S3 requirements: epics.md lines 480-498
- EXPERIENCE.md Streak Counter: lines 132-137
- /api/logs route: streak increment logic (E3-S6)
- DashboardClient: from E4-S1

## Dev Agent Record

### Agent Model Used

(To be filled by dev agent)

### Debug Log References

### Completion Notes List

### File List
