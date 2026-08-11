# Story 6.2: Dish Result Cards with Allergen Badges & Risk Score

Status: ready-for-dev

## Story

As a user searching for a hawker dish,
I want allergen information and my personalised risk level for each search result,
so that I can make an informed decision about whether to eat that dish.

## Acceptance Criteria

1. `/hawker` route renders search page with auto-focused text input at top
2. Input triggers GET `/api/hawker?q=` with 300ms debounce
3. Each result card shows: dish name EN (h3), Malay and Chinese names below (caption), allergen badges (PillarTag-style per allergen), personalised risk badge: "High Risk" (terracotta), "Moderate" (amber), "Safe" (sage)
4. Risk score logic: "High Risk" if dish contains 1+ allergen confirmed as user trigger (from trigger_cache or known_allergens); "Moderate" if dish contains 1+ allergen flagged but low confidence; "Safe" if no known allergen overlap
5. < 7 logs: "Unknown — keep logging" in neutral style
6. Loading: 2 result card skeleton shimmers
7. No results: "No dishes found for '[query]'. Try the English, Malay, or Chinese name."

## Tasks / Subtasks

- [ ] Task 1: Build `/hawker` search page (AC: 1, 2, 5, 6, 7)
  - [ ] 1.1 Replace placeholder `app/hawker/page.tsx` with full search UI
  - [ ] 1.2 Auto-focused search input at top; 300ms debounce before API call
  - [ ] 1.3 Fetch user profile (known_allergens, trigger_cache) for risk scoring
  - [ ] 1.4 Loading state: 2 skeleton result cards
  - [ ] 1.5 Empty state: "No dishes found for '[query]'"
  - [ ] 1.6 < 7 logs: show "Unknown — keep logging" badge instead of risk score

- [ ] Task 2: Build `components/hawker/DishResultCard.tsx` (AC: 3, 4)
  - [ ] 2.1 Props: dish data + risk level + risk reason
  - [ ] 2.2 Dish name EN (h3), Malay + Chinese below (caption)
  - [ ] 2.3 Allergen badges: PillarTag-style chips (e.g. shellfish, gluten, dairy)
  - [ ] 2.4 Risk badge: "High Risk" (terracotta pill), "Moderate" (amber pill), "Safe" (sage pill), "Unknown" (neutral)
  - [ ] 2.5 Save action buttons: "Safe", "Risky", "Avoid" (for E6-S3 integration)

- [ ] Task 3: Risk scoring logic (AC: 4)
  - [ ] 3.1 Compare dish.allergens against user.known_allergens + trigger_cache.top_triggers
  - [ ] 3.2 If exact allergen match in trigger_cache with confidence ≥ 50% → High Risk
  - [ ] 3.3 If allergen is in known_allergens but not in confirmed triggers → Moderate
  - [ ] 3.4 No overlap → Safe

## Dev Notes

### Dependencies
- **E6-S1**: `/api/hawker` route must exist
- **E4-S5**: Bottom nav already has Hawker tab

### Key Files to Touch
| File | Action | Description |
|------|--------|-------------|
| `app/hawker/page.tsx` | MODIFY | Full search page |
| `components/hawker/DishResultCard.tsx` | NEW | Result card component |

### Testing Guidance
- Unit: `__tests__/components/DishResultCard.test.tsx` — render with High/Moderate/Safe risk, verify badges
- Manual: Search "laksa" → verify card with allergens (shellfish, dairy, gluten) + risk badge

### References
- E6-S2 requirements: epics.md lines 706-728
- DESIGN.md badge-risk-high/medium/safe

## Dev Agent Record
...
