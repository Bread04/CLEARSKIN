# Story 6.1: Hawker Dish Search (GET /api/hawker)

Status: ready-for-dev

## Story

As a server-side API route,
I want to handle fuzzy multilingual dish search queries and return matching dishes with allergen data,
so that users can find any hawker dish regardless of whether they type in English, Malay, or Chinese.

## Acceptance Criteria

1. `app/api/hawker/route.ts` handles GET with `?q=` query parameter
2. Fuzzy matches against `hawker_dishes.name_en`, `name_ms`, `name_zh`, and `aliases[]` columns using pg_trgm
3. Returns max 10 results sorted by match relevance (exact match first, partial, alias last)
4. Response per dish: `{ id, name_en, name_ms, name_zh, allergens: string[], category: string }`
5. Empty query returns top 10 by `popularity_rank`
6. Malformed queries (empty string, special chars) return empty array, never 500
7. Response under 300ms (Supabase text search with GIN index on name columns)

## Tasks / Subtasks

- [ ] Task 1: Create `app/api/hawker/route.ts` (AC: 1-7)
  - [ ] 1.1 GET handler: read `q` query param
  - [ ] 1.2 If no `q` or empty: return top 10 by `popularity_rank ASC` (most popular first)
  - [ ] 1.3 If `q` present: query `hawker_dishes` with ILIKE on `name_en`, `name_ms`, `name_zh`, and ANY on `aliases`
  - [ ] 1.4 Use pg_trgm similarity ordering: `ORDER BY similarity(name_en, q) DESC`
  - [ ] 1.5 Limit 10 results; return `{ id, name_en, name_ms, name_zh, allergens, category }`
  - [ ] 1.6 Handle special chars gracefully — return `[]` if query is only special chars
  - [ ] 1.7 No auth required — public endpoint (hawker dishes are read-only)

- [ ] Task 2: Verify existing infrastructure (AC: 7)
  - [ ] 2.1 `hawker_dishes` table with 85 dishes seeded via `supabase/seed.sql`
  - [ ] 2.2 `pg_trgm` extension enabled (from E1-S2 migration)
  - [ ] 2.3 GIN trigram index on `name_en` (from migration)

## Dev Notes

### Dependencies
- **E1-S2**: `hawker_dishes` table + 85 dishes + pg_trgm + GIN index already exist.

### Architecture Rules
- **AD-3**: Read from Supabase. No auth needed — hawker_dishes is public data.
- Response under 300ms — GIN trigram index already in place.

### Key Files to Touch
| File | Action | Description |
|------|--------|-------------|
| `app/api/hawker/route.ts` | NEW | GET handler with fuzzy search |

### Testing Guidance
- Unit: Mock Supabase, verify empty query returns top 10, "laksa" returns Laksa, special chars return []
- Manual: `GET /api/hawker?q=laksa` → verify Laksa returned with shellfishe, dairy, gluten allergens
- Manual: `GET /api/hawker` → verify 10 most popular dishes

### References
- E6-S1 requirements: epics.md lines 687-702
- Hawker table: supabase/seed.sql (85 dishes)
- Migration: supabase/migrations/20260808000000_initial_schema.sql

## Dev Agent Record

### Agent Model Used
(To be filled by dev agent)

### Debug Log References
### Completion Notes List
### File List
