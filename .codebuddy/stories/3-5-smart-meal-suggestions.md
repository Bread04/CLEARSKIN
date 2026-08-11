# Story 3.5: Smart Meal Suggestions

Status: ready-for-dev

## Story

As a repeat logger,
I want the app to suggest dishes I have previously logged on the same day of the week,
so that logging my routine meals is faster and I do not need to retype common dishes.

## Acceptance Criteria

1. When opening food entry, app queries last 7 log entries for same day-of-week
2. If a dish appears in 3 or more of those entries, it appears as a "Suggested" chip above the search field with flame icon
3. Tapping a suggested chip adds it directly to food list without typing
4. Suggestions computed client-side from Supabase data (no AI call needed)
5. Maximum 3 suggestions shown (most frequent first); suggestion row hidden if no qualifying dishes
6. Suggestions do not appear for first 3 log entries (insufficient history)

## Tasks / Subtasks

- [ ] Task 1: Build suggestion computation hook (AC: 1, 2, 4, 6)
  - [ ] 1.1 Create `lib/utils/suggestions.ts` — pure function: `getSuggestedDishes(logs: DbLogEntry[], targetDayOfWeek: number): Suggestion[]`
  - [ ] 1.2 Query Supabase for user's last 7 log entries (ordered by `logged_at DESC`, limit 7)
  - [ ] 1.3 Filter to same day-of-week entries (e.g., all Mondays in the 7-entry window)
  - [ ] 1.4 Count food item occurrences across those entries
  - [ ] 1.5 Return items appearing in ≥ 3 entries, sorted by frequency descending, max 3
  - [ ] 1.6 Return empty array if total log entries < 3
  - [ ] 1.7 No AI call — pure data computation

- [ ] Task 2: Build `components/ui/SmartSuggestions.tsx` (AC: 2, 3, 5)
  - [ ] 2.1 Client component: renders a horizontal row of suggestion chips
  - [ ] 2.2 Each chip: flame icon (🔥), dish name, `aria-label="Add {dish} from past logs"`
  - [ ] 2.3 Chip styling: `.pill-sage` variant, `cursor-pointer`, hover state
  - [ ] 2.4 Tapping a chip emits `onSelect(dish: Suggestion)` → parent adds to food list
  - [ ] 2.5 Row hidden entirely when suggestions array is empty (no empty space)
  - [ ] 2.6 Animate in: fade + slide-down 180ms
  - [ ] 2.7 Section label: "Based on your past {dayName}s" (e.g., "Based on your past Mondays")

- [ ] Task 3: Create `hooks/useSmartSuggestions.ts` (AC: 1, 6)
  - [ ] 3.1 Custom React hook: `useSmartSuggestions(userId: string): Suggestion[]`
  - [ ] 3.2 Fetches logs on mount: Supabase query for most recent 7 entries
  - [ ] 3.3 Calls `getSuggestedDishes()` with logs + `new Date().getDay()`
  - [ ] 3.4 Returns memoized suggestions array
  - [ ] 3.5 Guards: skips if total logs < 3 (returns [])

- [ ] Task 4: Integrate into ManualLogForm + PreFillCard (AC: 3, 5)
  - [ ] 4.1 Add `SmartSuggestions` above the food search input in `ManualLogForm.tsx`
  - [ ] 4.2 On suggestion tap → add dish directly to food items list
  - [ ] 4.3 Also show in PreFillCard food section (E3-S3) as small chips above the food list
  - [ ] 4.4 Suggestions row takes minimal vertical space — hidden when empty

## Dev Notes

### Prerequisites
E3-S4 (ManualLogForm) provides the food entry integration point. Log entries must exist in Supabase for suggestions to work on real data. The demo seed provides 14 days of logs for testing.

### Architecture Rules
- **AD-3**: Suggestions are computed from Supabase log data, not AI. This is a client-side aggregation — reads from Supabase, computes locally.
- **AD-4**: Pattern detection is for correlation — suggestions are a simpler frequency count, not pattern detection. No `lib/pattern-engine.ts` involvement.
- This is the only E3 story that requires no AI calls.

### Existing Code Patterns
- **Supabase client**: Use `createClient()` from `@/lib/supabase/server` for server components; for client components, fetch through API routes or use `lib/supabase/client.ts`.
- **Day-of-week**: JavaScript `Date.getDay()` returns 0 (Sunday) through 6 (Saturday). Singapore calendar is Sunday-Saturday.
- **Data shape**: Food items stored as `food.items[]` with `name` and optional `dish_id` in `log_entries`. Match by `dish_id` first (exact), then by `name` (case-insensitive).

### Key Files to Touch
| File | Action | Description |
|------|--------|-------------|
| `lib/utils/suggestions.ts` | NEW | Pure function: compute meal suggestions from log entries |
| `hooks/useSmartSuggestions.ts` | NEW | React hook: fetch logs + compute suggestions |
| `components/ui/SmartSuggestions.tsx` | NEW | Chip row UI component |
| `components/ui/ManualLogForm.tsx` | MODIFY | Add SmartSuggestions above food search |
| `components/ui/PreFillCard.tsx` | MODIFY | Add SmartSuggestions in food section |

### Types
```ts
interface Suggestion {
  name: string;           // e.g. "Chicken Rice"
  dish_id?: string;       // hawker_dishes.id if matched
  frequency: number;      // count across same-weekday logs (3-7)
  dayOfWeek: number;      // 0-6
}
```

### Testing Guidance
- Unit: `__tests__/utils/suggestions.test.ts` — mock 7 entries with 4 Chicken Rice on Mondays → verify Chicken Rice suggested; mock 2 entries → verify empty; mock 7 entries, no dish appears 3+ times → verify empty
- Unit: `__tests__/components/SmartSuggestions.test.tsx` — render with 2 suggestions → verify chips visible; render empty → verify component hidden
- Manual: Demo user (14 days of logs) → open food entry → verify "Based on your past {day}" shows suggested dishes
- Manual: Tap suggested chip → verify added to food list
- Manual: Fresh user (0 logs) → verify no suggestions shown
- Manual: User with 2 logs → verify no suggestions (need 3+ to qualify per AC6 but note: "3 or more of last 7 same-weekday entries" per AC2 means total log count could be higher)

### UX Design References
- EXPERIENCE.md Smart suggestions (line 130): "If a user has logged the same dish on ≥ 3 of the last 7 same-weekday logs, a suggestion chip appears"
- EXPERIENCE.md Flow 2 Step 6 (line 319): "Smart suggestion chip: 'You usually log Chicken Rice on weekdays — add it?'"
- DESIGN.md pill-sage variant: `bg-primary-sage-50 text-primary-sage-dark`

### References
- E3-S5 requirements: epics.md lines 393-408
- EXPERIENCE.md Smart suggestions: line 130
- EXPERIENCE.md Flow 2: line 319
- ManualLogForm: components/ui/ManualLogForm.tsx (from E3-S4)
- PreFillCard: components/ui/PreFillCard.tsx (from E3-S3)
- DB types: lib/types/database.ts — DbLogEntry, FoodLog

## Dev Agent Record

### Agent Model Used

(To be filled by dev agent)

### Debug Log References

### Completion Notes List

### File List
