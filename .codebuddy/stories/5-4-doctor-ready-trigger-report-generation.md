# Story 5.4: Doctor-Ready Trigger Report Generation

Status: ready-for-dev

## Story

As a user preparing for a doctor's appointment,
I want a structured trigger summary report with my top patterns, symptom trends, and log timeline,
so that I can share objective data with my healthcare provider.

## Acceptance Criteria

1. `/insights/report` route renders the Doctor Report view
2. Report structure:
   1. Header: "ClearLah Trigger Summary Report" + patient-reported disclaimer at TOP
   2. "Top 5 Suspected Triggers" with confidence % and pillar icons
   3. Symptom trend chart: line/bar chart of Skin/Gut/Respiratory severity over last 14 days
   4. 14-day log timeline: table with date, food, sleep, stress, symptom scores, weather summary
   5. Footer: "Patient-reported data summary — not a medical diagnosis. Consult a qualified healthcare professional."
3. Medical disclaimer at BOTH top AND bottom
4. "Generate Report" button on `/insights` navigates to `/insights/report`
5. Report data fetched from Supabase on mount; skeleton section loaders shown during fetch
6. No AI called during report generation (uses cached `trigger_cache` + raw log data)
7. All sections render correctly on A4 print preview

## Tasks / Subtasks

- [ ] Task 1: Create `app/insights/report/page.tsx` (AC: 1, 4, 5)
  - [ ] 1.1 Server component: fetch `user_profiles` (trigger_cache) + `log_entries` (last 14) from Supabase
  - [ ] 1.2 Pass data to `ReportClient` client component
  - [ ] 1.3 "Generate Report" button on `/insights` page (E5-S3) navigates here

- [ ] Task 2: Build `components/insights/ReportClient.tsx` (AC: 2, 3, 7)
  - [ ] 2.1 Header section: "ClearLah Trigger Summary Report" title, date generated, patient disclaimer
  - [ ] 2.2 Top Triggers section: list from `trigger_cache.top_triggers` with confidence % and PillarTags
  - [ ] 2.3 Symptom Trend chart: simple bar/line visualization using inline SVG of last 14 days' symptom scores (skin, gut, respiratory). Pure CSS/SVG, no chart library.
  - [ ] 2.4 Log Timeline table: responsive table with columns Date | Food | Sleep | Stress | Skin | Gut | Respiratory | Weather
  - [ ] 2.5 Footer disclaimer: "Patient-reported data summary — not a medical diagnosis. Consult a qualified healthcare professional."
  - [ ] 2.6 Print CSS: `@media print` hides nav, buttons; `page-break-inside: avoid` on sections
  - [ ] 2.7 Skeleton loaders during data fetch: 4 section-shaped shimmer blocks

- [ ] Task 3: Symptom trend SVG chart (AC: 2.3)
  - [ ] 3.1 Simple bar chart: 14 columns (one per day), stacked or grouped by skin/gut/respiratory
  - [ ] 3.2 Y-axis: 0-10 severity; X-axis: dates (MM/DD)
  - [ ] 3.3 Colours match PillarTag symptoms variant
  - [ ] 3.4 `aria-label` describing the trend: "Symptom trend shows [increasing/stable/decreasing] over 14 days"

## Dev Notes

### Dependencies
- **E5-S2**: `trigger_cache` populated via `/api/insights/correlate`
- **E3-S6**: `log_entries` in Supabase with food, lifestyle, symptoms, weather
- No AI calls. Pure data rendering.

### Architecture Rules
- **AD-3**: Read from Supabase. `trigger_cache` is pre-computed. `log_entries` read directly.
- Report is server-rendered, not generated client-side. Simpler, faster, print-friendly.

### Key Files to Touch
| File | Action | Description |
|------|--------|-------------|
| `app/insights/report/page.tsx` | NEW | Server component: fetch data |
| `components/insights/ReportClient.tsx` | NEW | Report layout + sections |
| `app/insights/page.tsx` | MODIFY | Add "Generate Report" button |

### Print CSS
```css
@media print {
  nav, .btn-primary, footer { display: none !important; }
  body { font-size: 12pt; color: #000; }
  .section { page-break-inside: avoid; }
  @page { margin: 1.5cm; }
}
```

### Testing Guidance
- Unit: `__tests__/components/ReportClient.test.tsx` — render with mock data, verify sections present, disclaimer at top + bottom
- Manual: Print preview (Ctrl+P) → verify 4 sections fit A4, no nav or buttons visible

### UX Design References
- EXPERIENCE.md Doctor Report (lines 160-168): sections and disclaimer rules
- EXPERIENCE.md Flow 5 (lines 360-376): report generation flow
- DESIGN.md typography: report uses `body` for content, `h2` for sections

### References
- E5-S4 requirements: epics.md lines 615-636
- EXPERIENCE.md Flow 5: lines 360-376

## Dev Agent Record

### Agent Model Used

(To be filled by dev agent)

### Debug Log References

### Completion Notes List

### File List
