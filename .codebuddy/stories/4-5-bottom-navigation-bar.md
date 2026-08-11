# Story 4.5: Bottom Navigation Bar

Status: ready-for-dev

## Story

As a user navigating between app sections,
I want a persistent bottom navigation bar with clear section indicators and contextual micro-badges,
so that I can switch contexts quickly and see what needs my attention.

## Acceptance Criteria

1. Bottom nav persists on all app-shell routes: /dashboard, /log, /insights, /hawker
2. Four tabs: Home (house icon), Log (pen icon), Insights (chart icon), Hawker (bowl icon)
3. Active tab: primary-sage icon + label; inactive: neutral-500
4. Log tab: flame icon micro-badge when streak > 0
5. Home tab: orange dot when High Risk Day active and banner not dismissed
6. Insights tab: "New" dot when new insights available (trigger_cache updated since last Insights visit)
7. All tabs: icon + text label visible; minimum 44x44px touch target
8. Keyboard navigable (arrow keys cycle tabs); active tab `aria-current="page"`
9. `role="navigation"` and `aria-label="Main navigation"` on tab bar

## Tasks / Subtasks

- [ ] Task 1: Build `components/ui/BottomNav.tsx` (AC: 1, 2, 3, 4, 7, 8, 9)
  - [ ] 1.1 Client component: receives `currentPath: string`, `streak: number`, `highRiskActive: boolean`, `newInsights: boolean`
  - [ ] 1.2 Four `NavTab` items: Home (/dashboard), Log (/log), Insights (/insights), Hawker (/hawker)
  - [ ] 1.3 Each tab: SVG icon + text label; 44x44px touch target
  - [ ] 1.4 Active tab detection: compare `currentPath` to tab route prefix
  - [ ] 1.5 Active: `text-primary-sage`; inactive: `text-neutral-500`
  - [ ] 1.6 Styling: `bg-neutral-50`, `border-t border-neutral-300`, `h-16` (64px), `pb-safe`
  - [ ] 1.7 `role="navigation"`, `aria-label="Main navigation"` on wrapper
  - [ ] 1.8 Active tab: `aria-current="page"`
  - [ ] 1.9 Keyboard: `onKeyDown` — ArrowLeft/ArrowRight cycles tabs

- [ ] Task 2: Micro-badges (AC: 4, 5, 6)
  - [ ] 2.1 Streak micro-badge on Log tab: terracotta dot + streak number when `streak > 0`
  - [ ] 2.2 Orange dot on Home tab when `highRiskActive && !dismissed`
  - [ ] 2.3 "New" dot on Insights tab when `newInsights`
  - [ ] 2.4 Badge positioning: top-right of tab icon, small circles (8px), no text overflow
  - [ ] 2.5 Shared pill/badge styling

- [ ] Task 3: Create app-shell layout (AC: 1)
  - [ ] 3.1 Create `components/layout/AppShell.tsx` — wraps children + BottomNav
  - [ ] 3.2 Detect current route via `usePathname()` from `next/navigation`
  - [ ] 3.3 Fetch streak from profile (pass as prop or read from context)
  - [ ] 3.4 Apply to `/dashboard`, `/log` routes (existing pages)
  - [ ] 3.5 Create placeholder routes for `/insights` and `/hawker` if they don't exist yet
  - [ ] 3.6 Do NOT wrap onboarding routes (`/onboarding/*`) or landing page (`/`) in AppShell

- [ ] Task 4: Insights "new" dot detection (AC: 6)
  - [ ] 4.1 Track last Insights visit in localStorage: `clearlah_last_insights_visit`
  - [ ] 4.2 Compare against `trigger_cache.computed_at` timestamp
  - [ ] 4.3 If cache was updated since last visit → show "New" dot
  - [ ] 4.4 On Insights mount → update `clearlah_last_insights_visit` to now

## Dev Notes

### Dependencies
- **E4-S1** (Dashboard): Dashboard page must exist for Home tab.
- **E3-S1** (Log): Log page must exist for Log tab.
- **E4-S4** (HighRiskDayAlert): highRiskActive flag needed for Home dot.

### Architecture Rules
- **AD-1**: App shell is a layout component, not a separate route. Wraps existing pages.
- No API changes. Bottom nav reads from existing profile data (streak) and localStorage (visit tracking, dismissal).

### Existing Code Patterns
- **CSS**: `.btn-ghost`, Nav already has `pb-safe` in globals.css
- **Route detection**: `usePathname()` from `next/navigation` (client component)
- **localStorage keys**: `clearlah_*` prefix convention
- **SVG icons**: Inline SVG, 24x24, `stroke="currentColor"` for color inheritance

### Key Files to Touch
| File | Action | Description |
|------|--------|-------------|
| `components/ui/BottomNav.tsx` | NEW | Bottom navigation bar component |
| `components/layout/AppShell.tsx` | NEW | App shell layout wrapping pages with nav |
| `app/dashboard/layout.tsx` | NEW | Dashboard layout using AppShell |
| `app/log/layout.tsx` | MODIFY | Use AppShell wrapper |
| `app/insights/page.tsx` | NEW | Placeholder insights page |
| `app/hawker/page.tsx` | NEW | Placeholder hawker page |

### Tab Icons (SVG)
```tsx
// Home: house
<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
<path d="M9 22V12h6v10"/>

// Log: pen/edit
<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>

// Insights: bar-chart
<path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>

// Hawker: utensils/bowl
<path d="M12 2a10 10 0 0 0-7.07 3.93"/><path d="M12 2v20"/>
```

### Testing Guidance
- Unit: `__tests__/components/BottomNav.test.tsx` — verify 4 tabs render, active tab highlighted, streak badge shows, high risk dot shows
- Manual: Navigate between /dashboard, /log — verify active tab updates, streak badge on Log tab
- Manual: Keyboard — Tab to nav, arrow keys cycle, Enter activates

### UX Design References
- EXPERIENCE.md Bottom Navigation (lines 54-63): tab icons, labels, badges
- DESIGN.md nav-bottom: `bg-neutral-50`, `border-t`, `h-16`, `icon-active: primary-sage`, `icon-inactive: neutral-500`
- EXPERIENCE.md Navigation Invariants (lines 66-70): back nav preserves state, active-tab scrolls to top

### References
- E4-S5 requirements: epics.md lines 522-539
- EXPERIENCE.md Bottom Navigation: lines 54-63
- DESIG.md nav-bottom: line 184-189

## Dev Agent Record

### Agent Model Used

(To be filled by dev agent)

### Debug Log References

### Completion Notes List

### File List
