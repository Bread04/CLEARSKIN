---
baseline_commit: 53b9747ad9adaf8fa4854f0c764a3824440dbb21
---

# Story 9.3: ClearCart — Safe Food Commerce

Status: review

## Story

As a user with established safe food patterns,
I want ClearLah to generate a weekly grocery list of my safe foods and surface safe nearby dishes from food delivery apps,
so that every food decision I make is informed by my trigger profile.

## Acceptance Criteria

1. "My Safe Shop" generates weekly grocery list from last 14 days of safe meals
2. Integrates with FairPrice/RedMart API for one-tap ordering
3. "Nearby Safe Dishes" surfaces GrabFood/Foodpanda dishes near user's location with 92%+ safety match
4. Safety score shown per dish: "Chicken Rice — 96% safe for you"
5. "Order now" deep-links to delivery app
6. Grocery list updates automatically as trigger profile evolves
7. Delivery app integration uses public APIs; no user credentials stored

## Tasks / Subtasks

- [ ] Task 1: Safe meal analysis engine (AC: 1, 6)
  - [ ] 1.1 Create `lib/safe-meal-analyzer.ts` — analyzes last 14 days of logs
  - [ ] 1.2 Identify "safe meals": dishes logged on days with symptom severity ≤ 3/10
  - [ ] 1.3 Score each safe meal by frequency, recency, and confidence
  - [ ] 1.4 Filter out meals containing known trigger foods (from `trigger_cache`)
  - [ ] 1.5 Return `SafeMeal[]` sorted by score descending
  - [ ] 1.6 Auto-refresh when trigger profile changes (new log entries, updated triggers)

- [ ] Task 2: Weekly grocery list generation (AC: 1)
  - [ ] 2.1 Create `app/api/clearcart/grocery-list/route.ts` — GET with userId
  - [ ] 2.2 Calls `safe-meal-analyzer.ts`, groups safe meals into ingredient list
  - [ ] 2.3 Returns: `{ items: { name, category, frequency, lastEaten }[], generatedAt }`
  - [ ] 2.4 `ClearCartGrocery` component renders categorized list on `/clearcart` page
  - [ ] 2.5 "Add to cart" button per item with FairPrice/RedMart deep-link

- [ ] Task 3: Nearby safe dish discovery (AC: 2, 3, 4, 5)
  - [ ] 3.1 Create `app/api/clearcart/nearby/route.ts` — GET with userId + lat/lng
  - [ ] 3.2 Cross-reference user's safe foods against hawker DB dishes
  - [ ] 3.3 Generate safety score % per dish: (1 - overlap_with_triggers) × 100
  - [ ] 3.4 Filter to dishes with ≥ 92% safety match
  - [ ] 3.5 `NearbySafeDishes` component renders cards with safety score + "Order now" button
  - [ ] 3.6 Deep-link to GrabFood/Foodpanda via `grab://` or `foodpanda://` URL scheme
  - [ ] 3.7 Fallback when location unavailable: show safe dishes without distance sorting

- [ ] Task 4: `/clearcart` page (AC: 1-7)
  - [ ] 4.1 Create `app/clearcart/page.tsx` — "My Safe Shop" dashboard
  - [ ] 4.2 Two sections: "Weekly Grocery List" + "Nearby Safe Dishes"
  - [ ] 4.3 Add ClearCart tab to BottomNavigationBar component
  - [ ] 4.4 Empty state: "Log 7+ days to unlock your Safe Shop"
  - [ ] 4.5 Loading: skeleton shimmer cards

- [ ] Task 5: Commerce API integrations (AC: 2, 5, 7)
  - [ ] 5.1 FairPrice/RedMart: deep-link to search results with ingredient name
  - [ ] 5.2 GrabFood/Foodpanda: deep-link to restaurant/dish page
  - [ ] 5.3 No API keys or user credentials stored
  - [ ] 5.4 Fallback: generic web search link if deep-link fails

## Dev Notes

- **Architecture compliance (AD-2):** No AI calls needed for this feature — pure computation from existing data
- **Architecture compliance (AD-3):** Reads from Supabase `log_entries` and `trigger_cache`; no new tables needed
- **Safety score formula:** For each dish, score = `1 - (trigger_allergens_in_dish / total_trigger_allergens)`. If user has 3 known triggers and dish has 1, score = 66%. If 0, score = 100%.
- **92% threshold:** Means the dish shares at most one low-confidence allergen with user's profile
- **Deep-linking pattern:** `try { window.open('grab://dish/' + id) } catch { window.open('https://grab.com/sg/food/' + query) }`
- **Design tokens:** Safe score green (`primary-sage`), "Order now" button primary, cards follow `InsightCard` pattern

### Project Structure Notes

```
app/clearcart/
  page.tsx                  ← NEW: Safe Shop page
app/api/clearcart/
  grocery-list/route.ts     ← NEW: Grocery list endpoint
  nearby/route.ts           ← NEW: Nearby safe dishes endpoint
lib/
  safe-meal-analyzer.ts     ← NEW: Safe meal analysis engine
components/clearcart/
  ClearCartGrocery.tsx      ← NEW: Grocery list component
  NearbySafeDishes.tsx      ← NEW: Nearby dishes component
components/ui/
  BottomNavigationBar.tsx   ← UPDATE: Add ClearCart tab
```

### References

- [Source: epics.md#E9-S3]
- [Source: ClearLah-Architecture-Spine.md#AD-3] — Supabase reads
- [Source: ClearLah-PRD.md#13.3] — ClearCart feature spec
- [Source: DESIGN.md] — Color tokens, card patterns

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
