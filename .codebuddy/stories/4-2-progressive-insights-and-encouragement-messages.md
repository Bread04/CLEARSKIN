# Story 4.2: Progressive Insights & Encouragement Messages

Status: ready-for-dev

## Story

As a user in my first 6 days of logging,
I want to see encouraging messages and a progress indicator on my Dashboard,
so that I stay motivated even before the 7-day threshold for pattern detection.

## Acceptance Criteria

1. When log count is 1-6: "Building your picture" section shows:
   - `ProgressRing` (48px, 4px stroke, primary-sage) showing N of 7 days with days remaining in centre
   - Rotating encouragement message (5 variants, no exclamation marks, quiet tone)
   - No trigger or pattern insights
2. When log count is 0: "Log your first day to start building your health picture."
3. From Day 4+ with `singlish_unlocked: true`: one message variant uses Singlish ("Eh, you doing pretty well leh. Keep going ah.")
4. `ProgressRing` is shared component `components/ui/ProgressRing.tsx`

## Tasks / Subtasks

- [ ] Task 1: Build `components/ui/ProgressRing.tsx` (AC: 1, 4)
  - [ ] 1.1 SVG circular progress ring: `radius`, `stroke`, `progress` props
  - [ ] 1.2 Track: `stroke-neutral-200`; fill: `stroke-primary-sage` with `stroke-linecap="round"`
  - [ ] 1.3 Centre text slot (children): e.g. "4" or "3 more"
  - [ ] 1.4 Default: `size="48"`, `stroke="4"`, `progress=0` (0-1)
  - [ ] 1.5 `aria-label="Progress: {N} of 7"` on SVG

- [ ] Task 2: Build `components/dashboard/BuildingPicture.tsx` (AC: 1, 2, 3)
  - [ ] 2.1 Client component: props `logCount: number`, `singlishUnlocked: boolean`
  - [ ] 2.2 0 logs: renders quiet text "Log your first day to start building your health picture."
  - [ ] 2.3 1-6 logs: renders `ProgressRing` (N/7) + encouragement message
  - [ ] 2.4 5 encouragement message variants (rotate randomly, not time-based):
    - "Building your picture — each day tells us more."
    - "A few more days and we'll start spotting patterns."
    - "Your health story is taking shape. Keep going."
    - "Every log entry is a piece of the puzzle."
    - Singlish variant (Day 4+, singlishUnlocked): "Eh, you doing pretty well leh. Keep going ah."
  - [ ] 2.5 7+ logs: return null (insights take over — E5-S3)

- [ ] Task 3: Integrate into Dashboard (AC: 1)
  - [ ] 3.1 Add `BuildingPicture` to `DashboardClient.tsx` between weather and empty state sections
  - [ ] 3.2 Pass `logCount` and `singlishUnlocked` from server component
  - [ ] 3.3 Section renders as `card` with `rounded-xl`

## Dev Notes

### Dependencies
- **E4-S1**: DashboardClient must exist for the integration point.
- No API changes needed. Uses existing `user_profiles` data (streak, singlish_unlocked, log count).

### Architecture Rules
- **AD-3**: Log count fetched server-side from Supabase `log_entries` count. Passed as prop.
- No AI calls. Pure display logic.

### Existing Code Patterns
- **CSS**: `.card`, `.text-body-lg`, `.text-caption` — all in globals.css
- **Server component data fetch**: Follow `app/log/page.tsx` pattern — server fetches, passes to client
- **ProgressRing SVG**: Pure SVG component, no canvas. Follow DESIGN.md progress-ring token.

### Key Files to Touch
| File | Action | Description |
|------|--------|-------------|
| `components/ui/ProgressRing.tsx` | NEW | Shared SVG progress ring |
| `components/dashboard/BuildingPicture.tsx` | NEW | Encouragement messages + progress |
| `app/dashboard/page.tsx` | MODIFY | Pass logCount + singlishUnlocked |
| `components/dashboard/DashboardClient.tsx` | MODIFY | Render BuildingPicture section |

### Design Tokens
- ProgressRing: `size="48"`, `stroke-width="4"`, `color-primary-sage`, `track-neutral-200`
- Text: `text-body-md text-neutral-700` for messages, `text-body-sm text-neutral-500` for subtext

### Message Rotation
```ts
const MESSAGES = {
  standard: [
    "Building your picture — each day tells us more.",
    "A few more days and we'll start spotting patterns.",
    "Your health story is taking shape. Keep going.",
    "Every log entry is a piece of the puzzle.",
  ],
  singlish: "Eh, you doing pretty well leh. Keep going ah.",
};
```
Pick random from standard + Singlish (if unlocked). Never show same message twice consecutively (track in state).

### Testing Guidance
- Unit: `__tests__/components/ProgressRing.test.tsx` — verify SVG renders, correct stroke-dashoffset at various progress values
- Unit: `__tests__/dashboard/BuildingPicture.test.tsx` — 0 logs: render text, 3 logs: render ring + message, 7+ logs: returns null
- Manual: New user → verify "Log your first day" shows. 3 logs → verify ring shows 3/7. 7+ logs → verify section hidden

### UX Design References
- EXPERIENCE.md Empty States (line 220): "Your trigger map starts here. Log Day 1 to begin."
- DESIGN.md progress-ring: size 48px, stroke 4px, `fill-color: primary-sage`, `track-color: neutral-200`
- EXPERIENCE.md tone: "Patient, motivating" for below-threshold messages (line 87)

### References
- E4-S2 requirements: epics.md lines 461-478
- EXPERIENCE.md Dashboard: line 47
- DESING.md progress-ring: line 192-196
- DashboardClient: from E4-S1

## Dev Agent Record

### Agent Model Used

(To be filled by dev agent)

### Debug Log References

### Completion Notes List

### File List
