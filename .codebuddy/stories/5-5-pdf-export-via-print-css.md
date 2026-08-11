# Story 5.5: PDF Export via Print CSS

Status: ready-for-dev

## Story

As a user who has generated my trigger report,
I want to export it as a PDF by printing from my browser,
so that I can share or email it to my doctor without a dedicated export backend.

## Acceptance Criteria

1. "Save as PDF" button calls `window.print()`
2. `@media print` CSS:
   - Bottom nav, "Save as PDF" button, interactive elements hidden
   - Page margins 1.5cm all around
   - Chart and table fit within A4 width without overflow
   - `page-break-before` between major sections
   - Font colours black/neutral-900
3. Report title set as document `<title>` (used as PDF filename)
4. Prints correctly in Chrome, Safari, and Firefox

## Tasks / Subtasks

- [ ] Task 1: Add print CSS to `app/globals.css` (AC: 2)
  - [ ] 1.1 `@media print` rule: hide `.no-print`, nav, buttons, bottom nav
  - [ ] 1.2 Set page margins: `@page { margin: 1.5cm; }`
  - [ ] 1.3 Ensure chart and table use `max-width: 100%` and `overflow: visible` in print
  - [ ] 1.4 `page-break-before: always` or `page-break-inside: avoid` on report sections
  - [ ] 1.5 Force black text: `color: #1C1C1A !important`
  - [ ] 1.6 Add `.no-print` utility class

- [ ] Task 2: Add "Save as PDF" button to report page (AC: 1, 3)
  - [ ] 2.1 Button in `ReportClient.tsx`: "Save as PDF" with `.no-print` class
  - [ ] 2.2 `onClick={window.print}` handler
  - [ ] 2.3 Set `<title>` to "ClearLah-Trigger-Report" for PDF filename
  - [ ] 2.4 Button: `.btn-secondary` style, printer icon SVG

- [ ] Task 3: Cross-browser verification (AC: 4)
  - [ ] 3.1 Verify print layout in Chrome (most common)
  - [ ] 3.2 Verify table fits within A4 (210mm width minus 30mm margins = 180mm)
  - [ ] 3.3 Verify no content cut off between pages

## Dev Notes

### Dependencies
- **E5-S4**: ReportClient must exist (provides the report content to print).

### Architecture Rules
- No libraries. Pure CSS `@media print`. No `react-pdf`, no server-side PDF generation.

### Key Files to Touch
| File | Action | Description |
|------|--------|-------------|
| `app/globals.css` | MODIFY | Add @media print rules |
| `components/insights/ReportClient.tsx` | MODIFY | Add "Save as PDF" button, no-print classes |

### Print CSS Template
```css
@media print {
  .no-print { display: none !important; }
  nav, footer, button { display: none !important; }
  body { color: #1C1C1A; background: white; font-size: 11pt; }
  @page { margin: 1.5cm; size: A4; }
  .report-section { page-break-inside: avoid; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #ccc; padding: 4px 8px; text-align: left; }
}
```

### Testing Guidance
- Manual: Open report page → Ctrl+P → verify 4 sections, no nav, A4 fit
- Manual: "Save as PDF" in Chrome → verify PDF opens with correct filename
- Manual: Verify in Firefox and Safari (CSS print compatibility)

### References
- E5-S5 requirements: epics.md lines 639-655
- ReportClient: components/insights/ReportClient.tsx (E5-S4)

## Dev Agent Record

### Agent Model Used

(To be filled by dev agent)

### Debug Log References

### Completion Notes List

### File List
