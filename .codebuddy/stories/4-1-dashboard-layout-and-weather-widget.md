# Story 4.1: Dashboard Layout & Weather Widget

Status: ready-for-dev

## Story

As a user who has completed onboarding,
I want a Dashboard that shows today's date, my streak, current weather, and quick navigation,
so that I get an at-a-glance picture of my tracking status and environment every day.

## Acceptance Criteria

1. `/dashboard` route renders after onboarding completes
2. Header row: ClearLah wordmark (left), `StreakBadge` component (right) with current consecutive streak
3. Weather widget: temperature (C), humidity (%), PSI, UV index with relevant icons; skeleton shimmer during fetch
4. Weather data fetched on mount via GET `/api/weather`
5. When `simulated: true`, a "Simulated data" badge visible on weather widget
6. Pull-to-refresh (overscroll) re-fetches weather and re-checks High Risk Day
7. Empty state (0 logs): warm welcome card with "Start your first log" CTA; no streak or risk elements
8. Bottom navigation bar persists on all app-shell routes

## Tasks / Subtasks

- [ ] Task 1: Replace dashboard placeholder with real layout (AC: 1, 2, 7)
  - [ ] 1.1 Rewrite `app/dashboard/page.tsx` as server component that fetches user profile + streak + log count
  - [ ] 1.2 Create `components/dashboard/DashboardClient.tsx` receiving profile data as props
  - [ ] 1.3 Header: ClearLah wordmark (left) + StreakBadge component (right)
  - [ ] 1.4 0 logs: render warm welcome card "Your trigger map starts here. Log Day 1 to begin." + CTA link to `/log`
  - [ ] 1.5 1+ logs: show weather widget + streak section (no "Log your first day" prompt)

- [ ] Task 2: Build `components/dashboard/WeatherWidget.tsx` (AC: 3, 4, 5)
  - [ ] 2.1 Client component: fetches `GET /api/weather` on mount
  - [ ] 2.2 Display: temperature (°C), humidity (%), PSI, UV index — each with SVG icon
  - [ ] 2.3 Skeleton shimmer placeholder during fetch (`.skeleton` CSS class, already defined)
  - [ ] 2.4 "Simulated data" badge when `simulated: true` (small neutral pill)
  - [ ] 2.5 PSI contextual label: Good (0-50) / Moderate (51-100) / Unhealthy (101-200) / Hazardous (201+)
  - [ ] 2.6 Weather card: `card` CSS with `rounded-xl`

- [ ] Task 3: Build `components/ui/StreakBadge.tsx` (AC: 2)
  - [ ] 3.1 Client component: props `streak: number`
  - [ ] 3.2 Renders as terracotta pill: `bg-secondary text-white rounded-full px-3 py-1`
  - [ ] 3.3 Flame icon + streak number; `font-bold text-label-sm`
  - [ ] 3.4 `aria-label="Streak: {N} days"`
  - [ ] 3.5 Shared component (used in Dashboard header AND E4-S5 Log nav micro-badge)

- [ ] Task 4: Pull-to-refresh (AC: 6)
  - [ ] 4.1 CSS `overscroll-behavior-y: contain` on dashboard container
  - [ ] 4.2 `onTouchEnd` or `pull-to-refresh` pattern: re-fetch `/api/weather`
  - [ ] 4.3 For E4-S4: also re-check high-risk status (deferred to that story)

## Dev Notes

### No Blocking Dependencies
Dashboard currently has a placeholder. E1-S3 (weather API) and E1-S2 (Supabase schema) provide the data. StreakBadge is new but standalone.

### Architecture Rules
- **AD-5**: Weather via `/api/weather` — already built in E1-S3. No changes needed.
- **AD-3**: Supabase for profile reads. Dashboard page fetches `user_profiles` (streak, conditions) + `log_entries` count.
- Server component pattern: `app/dashboard/page.tsx` fetches data, passes to `DashboardClient.tsx` client component.

### Existing Code Patterns
- **Dashboard guard**: Already in place — checks `onboarding_complete`, redirects to onboarding if incomplete. Preserve this.
- **Weather API**: `GET /api/weather` returns `WeatherSnapshot`. Already built. Response schema: `{ temp, humidity, psi, uv, source, simulated?, simulated_fields, fetched_at }`.
- **CSS**: `.card`, `.skeleton`, `.pill`, `.btn-primary` all defined in globals.css.
- **Streak in DB**: `user_profiles.streak` (int, CHECK >= 0), `user_profiles.streak_last_date` (date).

### Key Files to Touch
| File | Action | Description |
|------|--------|-------------|
| `app/dashboard/page.tsx` | MODIFY | Replace placeholder with real data fetch + render |
| `components/dashboard/DashboardClient.tsx` | NEW | Client component with weather, streak, empty states |
| `components/dashboard/WeatherWidget.tsx` | NEW | Weather card with skeleton + simulated badge |
| `components/ui/StreakBadge.tsx` | NEW | Shared terracotta pill component |

### Design Tokens
- StreakBadge: `bg-secondary` (#C0583A), `text-white`, `rounded-full`, `text-label-sm` (0.75rem/600)
- WeatherWidget: `card` + `rounded-xl`
- Weather icons: SVG inline, 24x24, `text-neutral-500`
- Empty state: `card`, `text-body-lg`, `btn-primary` CTA

### Testing Guidance
- Unit: `__tests__/dashboard/WeatherWidget.test.tsx` — mock fetch, verify temp/humidity/PSI/UV displayed, simulated badge shown when `simulated: true`, skeleton shown during fetch
- Unit: `__tests__/components/StreakBadge.test.tsx` — renders streak number, flame icon, correct styling, aria-label
- Manual: `/dashboard` → verify weather loads, streak badge visible, empty state on fresh account
- Manual: Toggle `USE_MOCK_WEATHER` → verify "Simulated data" badge appears/disappears

### UX Design References
- EXPERIENCE.md Dashboard (lines 46-52): header, weather, empty states
- DESIGN.md streak-badge: line 165-170
- DESIGN.md weather widget: card component
- EXPERIENCE.md empty states: line 218-219 — "Your trigger map starts here. Log Day 1 to begin."

### References
- E4-S1 requirements: epics.md lines 441-458
- EXPERIENCE.md Surface Map: Dashboard (line 47)
- Weather API: app/api/weather/route.ts
- Dashboard guard: app/dashboard/page.tsx (existing)
- DESIGN.md: colors, typography, components

## Dev Agent Record

### Agent Model Used

(To be filled by dev agent)

### Debug Log References

### Completion Notes List

### File List
