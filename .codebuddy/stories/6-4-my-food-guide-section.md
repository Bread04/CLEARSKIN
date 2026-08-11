# Story 6.4: My Food Guide Section

Status: ready-for-dev

## Story

As a returning user,
I want all my saved dishes organised by safety label in a persistent guide section,
so that I can quickly reference what I have already evaluated.

## Acceptance Criteria

1. My Food Guide section auto-expands inline below search results after first dish saved
2. Organised in three groups: "Safe", "Approach with caution", "Avoid"
3. Each saved dish shows: name EN, safety label badge, saved date
4. Swipe-left on a saved dish card reveals red "Remove" action button
5. "Remove" calls DELETE `/api/hawker/save`; optimistic removal from UI
6. Guide persists across sessions (loaded from Supabase on `/hawker` mount)
7. Empty guide: "Your food guide is empty. Search for dishes to build your reference."
8. Saved dish count in section header: "My Food Guide (12)"

## Tasks / Subtasks

- [ ] Task 1: Build `components/hawker/FoodGuide.tsx` (AC: 1-8)
  - [ ] 1.1 Fetch saved dishes from Supabase on mount (or pass from server component)
  - [ ] 1.2 Group by safety_label: "avoid" first, then "risky", then "safe"
  - [ ] 1.3 Each group: section header + list of dish cards
  - [ ] 1.4 Swipe-left on card → reveal red "Remove" button
  - [ ] 1.5 Remove calls DELETE `/api/hawker/save` → optimistic removal
  - [ ] 1.6 Empty guide: "Your food guide is empty..."
  - [ ] 1.7 Section header: "My Food Guide (N)" with count
  - [ ] 1.8 Auto-expand when dishes exist, collapsible otherwise

- [ ] Task 2: Integrate into `/hawker` page (AC: 1, 6)
  - [ ] 2.1 Render FoodGuide below search results
  - [ ] 2.2 Pass saved dishes from server component or fetch client-side
  - [ ] 2.3 Auto-expand when first dish saved (optimistic from E6-S3)

## Dev Notes

### Key Files
| File | Action |
|------|--------|
| `components/hawker/FoodGuide.tsx` | NEW |
| `app/hawker/page.tsx` | MODIFY |

## Dev Agent Record
...
