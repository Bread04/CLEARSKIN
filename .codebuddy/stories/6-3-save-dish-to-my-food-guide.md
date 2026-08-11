# Story 6.3: Save Dish to My Food Guide

Status: ready-for-dev

## Story

As a user who has found a dish's allergen profile,
I want to save it as Safe / Risky / Avoid to build my personal food reference,
so that I do not need to look it up again next time.

## Acceptance Criteria

1. Each result card has three action buttons: "Safe" (sage), "Risky" (amber), "Avoid" (terracotta)
2. Tapping calls POST `/api/hawker/save` with `{ dish_id, safety_label }`; saves to `saved_dishes` table
3. After saving: tapped button shows filled/active state; success toast "Added to your Food Guide" (3s auto-dismiss)
4. Saving an already-saved dish with new label performs upsert (on user_id + dish_id)
5. Saved dish immediately appears in My Food Guide (optimistic UI update)
6. While POST in-flight: all three buttons disabled; re-enabled on response

## Tasks / Subtasks

- [ ] Task 1: Add save buttons to DishResultCard (AC: 1, 6)
  - [ ] 1.1 Three buttons below card: "Safe" (sage), "Risky" (amber), "Avoid" (terracotta)
  - [ ] 1.2 Existing save state: highlight the currently-saved label
  - [ ] 1.3 Disable all during save; show loading state on active button
  - [ ] 1.4 All buttons `min-h-[44px]`, `aria-label` attributes

- [ ] Task 2: POST to `/api/hawker/save` (AC: 2, 3, 4, 5)
  - [ ] 2.1 On tap: POST `{ dish_id, safety_label }` to API route (E6-S5)
  - [ ] 2.2 On success: update local state (optimistic), show toast "Added to your Food Guide"
  - [ ] 2.3 On upsert (re-saving with new label): update state, show toast "Updated in your Food Guide"
  - [ ] 2.4 Error handling: show error toast on failure

## Dev Notes

### Dependencies
- **E6-S2**: DishResultCard must exist
- **E6-S5**: `/api/hawker/save` route must exist (build together or before)

### Key Files
| File | Action |
|------|--------|
| `components/hawker/DishResultCard.tsx` | MODIFY — add save buttons |
| `app/hawker/page.tsx` | MODIFY — handle save state |

## Dev Agent Record
...
