# Story 5.6: Insufficient Data Empty State & Progress Ring

Status: ready-for-dev

## Story

As a user with fewer than 7 log entries,
I want the Insights page to acknowledge my progress and show how many more days I need,
so that I stay motivated without feeling the feature is broken.

## Acceptance Criteria

1. When API returns `{ status: "insufficient_data", entries_needed: N }`:
   - `ProgressRing` centred on page: `(7 - entries_needed) / 7` proportion filled
   - Below ring: "N more days of logging to unlock your first trigger insights"
   - Below that: quiet encouragement message (no exclamation marks)
2. "Start logging" link navigates to `/log`
3. Empty state replaces insight card area; page header and nav render normally
4. `ProgressRing` shared component with E4-S2 Dashboard usage

## Tasks / Subtasks

- [ ] Task 1: Build `components/insights/InsufficientData.tsx` (AC: 1, 2)
  - [ ] 1.1 Client component: props `entriesNeeded: number`, `logCount: number`
  - [ ] 1.2 Render ProgressRing: `(7 - entriesNeeded) / 7` progress, centre text shows `logCount`
  - [ ] 1.3 Text: "N more days of logging to unlock your first trigger insights"
  - [ ] 1.4 Encouragement message: quiet tone, no exclamation marks
    - "Each day of logging brings you closer to understanding your triggers."
  - [ ] 1.5 "Start logging" link: `<a href="/log" className="btn-primary">` — navigates to `/log`

- [ ] Task 2: Integrate into Insights page (AC: 1, 3, 4)
  - [ ] 2.1 In `app/insights/page.tsx`: check API response for `status === "insufficient_data"`
  - [ ] 2.2 Render `InsufficientData` instead of InsightCard list
  - [ ] 2.3 Page header ("Insights") still renders
  - [ ] 2.4 Reuse `ProgressRing` from `components/ui/ProgressRing.tsx` (E4-S2)

## Dev Notes

### Dependencies
- **E4-S2**: `ProgressRing` component already exists and is shared.
- **E5-S2**: API returns `insufficient_data` status when < 7 entries.

### Architecture Rules
- No data writes. Pure display component.
- Reuses ProgressRing — no duplicate code.

### Key Files to Touch
| File | Action | Description |
|------|--------|-------------|
| `components/insights/InsufficientData.tsx` | NEW | Empty state with progress ring |
| `app/insights/page.tsx` | MODIFY | Render InsufficientData when API returns insufficient |

### Testing Guidance
- Unit: `__tests__/components/InsufficientData.test.tsx` — render with 3 entries_needed, verify progress, text, link
- Manual: Fresh user (< 7 logs) → `/insights` → verify progress ring + "N more days" message

### UX Design References
- EXPERIENCE.md Empty States (line 220): "N more days to unlock your first trigger insight"
- EXPERIENCE.md Insufficient Data (lines 666-675): ProgressRing, encouragement, link to log
- DESIGN.md progress-ring: 48px, 4px stroke

### References
- E5-S6 requirements: epics.md lines 659-675
- ProgressRing: components/ui/ProgressRing.tsx (E4-S2)

## Dev Agent Record

### Agent Model Used

(To be filled by dev agent)

### Debug Log References

### Completion Notes List

### File List
