# Story 6.5: Hawker Save/Remove API Routes

Status: ready-for-dev

## Story

As a server-side API module,
I want save and remove routes for saved dishes,
so that the client can persist dish safety decisions without direct browser Supabase access.

## Acceptance Criteria

1. POST `app/api/hawker/save/route.ts` accepts `{ user_id, dish_id, safety_label }`; upserts `saved_dishes`; returns `{ success: true, dish: SavedDish }`
2. DELETE `app/api/hawker/save/route.ts` accepts `{ user_id, dish_id }`; deletes matching row; returns `{ success: true }`
3. Both routes validate inputs; return 400 for missing required fields
4. Both routes return 404 if dish does not exist in `hawker_dishes`
5. No Supabase client credentials exposed to browser

## Tasks / Subtasks

- [ ] Task 1: Create `app/api/hawker/save/route.ts` (AC: 1-5)
  - [ ] 1.1 POST handler: validate `user_id`, `dish_id`, `safety_label`
  - [ ] 1.2 Verify dish exists in `hawker_dishes` → return 404 if not
  - [ ] 1.3 Upsert `saved_dishes` on `(user_id, dish_id)` conflict
  - [ ] 1.4 DELETE handler: validate `user_id`, `dish_id`
  - [ ] 1.5 Delete matching row; return `{ success: true }`
  - [ ] 1.6 400 for missing fields, 404 for non-existent dish

## Dev Notes

### Architecture Rules
- **AD-3**: Browser never talks to Supabase directly. Client calls this API route.
- Follow `app/api/profile/route.ts` pattern: validate, upsert, try/catch.

### Key Files
| File | Action |
|------|--------|
| `app/api/hawker/save/route.ts` | NEW — POST + DELETE handlers |

### Testing Guidance
- Unit: mock Supabase, verify POST upserts, DELETE removes, 400 on bad input, 404 on missing dish

## Dev Agent Record
...
