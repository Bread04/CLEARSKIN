# Story 4.4: High Risk Day Alert Banner

Status: ready-for-dev

## Story

As a user with an established trigger profile,
I want a prominent banner on my Dashboard when today's weather matches my known triggers,
so that I can take precautions before symptoms flare up.

## Acceptance Criteria

1. `HighRiskDayAlert` component renders as full-width banner at top of Dashboard content (below header)
2. Banner shows: weather alert icon, "High Risk Day — [trigger summary]" message, "See why" CTA
3. "See why" navigates to `/insights` with top contributing trigger pre-expanded
4. Banner styling: secondary-light background, 4px muted-terracotta left border, neutral-900 text
5. Alert SUPPRESSED when log count < 7 (FR24)
6. Alert SUPPRESSED if dismissed today (tracked via `localStorage.highRiskDismissedDate`)
7. Any banner interaction (tap anywhere) counts as dismissal for the day
8. `aria-live="assertive"` on banner container
9. High Risk logic: compare live weather against top 3 triggers in `trigger_cache`; show if 2+ trigger conditions simultaneously met
10. Orange notification dot on Home bottom nav tab when High Risk active and banner not dismissed

## Tasks / Subtasks

- [ ] Task 1: Build `components/dashboard/HighRiskDayAlert.tsx` (AC: 1, 2, 3, 4, 5, 6, 7, 8)
  - [ ] 1.1 Client component: reads `trigger_cache` from Supabase, `weatherSnapshot` from `/api/weather`
  - [ ] 1.2 Check high risk: compare live weather against top 3 `trigger_cache.top_triggers`
    - Example trigger conditions: "shellfish" (food), "humidity > 80%" (weather), "sleep < 6h" (lifestyle)
    - If 2+ conditions matched simultaneously → high risk
  - [ ] 1.3 Banner styling: `bg-secondary-light`, `border-l-4 border-secondary`, `rounded-lg`, `p-4`
  - [ ] 1.4 Content: weather alert icon (SVG), "High Risk Day — {summary}" text, "See why" link to `/insights`
  - [ ] 1.5 Suppress when `log_count < 7` (from `trigger_cache` precondition)
  - [ ] 1.6 Check `localStorage.highRiskDismissedDate` — suppress if already dismissed today
  - [ ] 1.7 On interaction: set `localStorage.highRiskDismissedDate = today`; dismiss banner
  - [ ] 1.8 `aria-live="assertive"` on container

- [ ] Task 2: Integrate into DashboardClient (AC: 1, 10)
  - [ ] 2.1 Render `HighRiskDayAlert` below Dashboard header, above weather widget
  - [ ] 2.2 Pass weather data + trigger cache from server component
  - [ ] 2.3 Orange dot on Home nav tab (E4-S5 handles nav rendering)
  - [ ] 2.4 For now: set a CSS class/data attribute on the body for E4-S5 to read

- [ ] Task 3: Trigger matching logic (AC: 9)
  - [ ] 3.1 Create `lib/utils/trigger-match.ts`: `isHighRiskDay(triggers: TriggerEntry[], weather: WeatherSnapshot): MatchResult`
  - [ ] 3.2 Check humidity threshold (>80%, >85%)
  - [ ] 3.3 Check temperature extremes
  - [ ] 3.4 Check PSI threshold
  - [ ] 3.5 Return `{ isHighRisk: boolean, matchedTriggers: string[], summary: string }`
  - [ ] 3.6 Pure function, no I/O — testable

## Dev Notes

### Dependencies
- **E4-S1**: DashboardClient must exist.
- **E4-S5**: Bottom nav must exist for the orange dot (or pass a prop/callback).
- **E5-S1** (future): trigger_cache is populated by the pattern engine. For demo user, trigger_cache is pre-seeded in demo-data.json with realistic triggers.

### Architecture Rules
- **AD-3**: `trigger_cache` stored in `user_profiles.trigger_cache` JSONB column. Already seeded for demo.
- **AD-4**: Pattern engine not needed here — this story only reads the already-computed `trigger_cache`.
- Weather comparison is pure logic — no AI needed.

### Trigger Cache Structure (from seed.sql)
```json
{
  "top_triggers": [
    { "factor": "shellfish", "correlation": 0.82, "occurrences": 8, "condition": "eczema" },
    { "factor": "humidity > 80%", "correlation": 0.75, "occurrences": 9, "condition": "eczema" },
    { "factor": "sleep < 6h", "correlation": 0.68, "occurrences": 5, "condition": "eczema" }
  ]
}
```

### Key Files to Touch
| File | Action | Description |
|------|--------|-------------|
| `components/dashboard/HighRiskDayAlert.tsx` | NEW | High risk banner |
| `lib/utils/trigger-match.ts` | NEW | Pure function: weather vs trigger comparison |
| `app/dashboard/page.tsx` | MODIFY | Fetch trigger_cache, pass to DashboardClient |
| `components/dashboard/DashboardClient.tsx` | MODIFY | Render HighRiskDayAlert |

### Testing Guidance
- Unit: `__tests__/utils/trigger-match.test.ts` — mock weather (humidity 90%, PSI 60) + trigger cache → verify 2+ matches returns high risk
- Unit: `__tests__/dashboard/HighRiskDayAlert.test.tsx` — render with high risk → verify banner visible; render with < 7 logs → verify hidden; tap → verify dismissed
- Manual: Demo mode with seeded trigger_cache → weather mock at humidity 82% → verify banner appears

### UX Design References
- EXPERIENCE.md High Risk Day (lines 504-519): suppression rules, dismissal, notification dot
- DESIGN.md alert-high-risk: `bg-secondary-light`, `border-secondary`, `rounded-lg`
- EXPERIENCE.md tone: "Calm urgency, not alarmist" (line 88)

### References
- E4-S4 requirements: epics.md lines 500-520
- EXPERIENCE.md High Risk Day Alert: lines 504-519
- DESIGN.md alert-high-risk: line 178-182
- Trigger cache: supabase/seed.sql demo user data

## Dev Agent Record

### Agent Model Used

(To be filled by dev agent)

### Debug Log References

### Completion Notes List

### File List
