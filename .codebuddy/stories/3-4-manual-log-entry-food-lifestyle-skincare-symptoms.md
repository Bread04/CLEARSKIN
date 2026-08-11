# Story 3.4: Manual Log Entry (Food, Lifestyle, Skincare, Symptoms)

Status: ready-for-dev

## Story

As a user who prefers manual entry or needs to correct the AI pre-fill,
I want to directly input all log fields including hawker dish shortcuts, sleep, stress, skincare, and symptom severity,
so that I can log accurately even without the conversational interface.

## Acceptance Criteria

1. Food entry: hawker search (GET `/api/hawker?q=` with 300ms debounce) + free-text fallback; multilingual fuzzy match across name_en, name_ms, name_zh, aliases for 80+ dishes
2. Sleep input: numeric input with +/- steppers; accepts 0-24; validates on save
3. Stress level: 1-5 segmented button selector with labels ("Low" to "Very High")
4. Stress type: single-select chips (Work / Relationship / Physical / Financial / Other)
5. Skincare: free-text area with common product suggestions as tap-to-insert pills (CeraVe, Cetaphil, etc.)
6. Symptom sliders: three independent sliders (1-10) with live numeric value; default 0 (not measured); colours match PillarTag variants
7. At least one field must be filled before saving
8. All touch targets minimum 44x44px (WCAG 2.5.5)

## Tasks / Subtasks

- [ ] Task 1: Build food entry section with hawker search (AC: 1)
  - [ ] 1.1 Search input with 300ms debounce (using `setTimeout`/`clearTimeout` pattern)
  - [ ] 1.2 `GET /api/hawker?q=` — displays matching dish results as selectable cards (E6-S1 built first, but for this story use the API directly — it's already available from E6)
  - [ ] 1.3 Results show: dish name EN, Malay/Chinese names, allergens as `PillarTag`-style chips
  - [ ] 1.4 Tapping a result adds it to food items list; tapping ✕ removes
  - [ ] 1.5 Free-text fallback: "Add custom item" button → inline text input with Enter-to-add
  - [ ] 1.6 Selected food items show as removable pills in the card
  - [ ] 1.7 Empty query: show top 10 by `popularity_rank` as suggestions (per API behavior)

- [ ] Task 2: Sleep, stress, skincare, symptom inputs (AC: 2, 3, 4, 5, 6)
  - [ ] 2.1 Sleep: `<input type="number" min="0" max="24" step="0.5">` with "+" / "−" stepper buttons; `aria-label="Sleep hours"`
  - [ ] 2.2 Stress level: 5 segmented buttons, horizontal row, labels "Low" through "Very High"
    - Active button: `bg-primary-sage text-white`; inactive: `bg-neutral-100 text-neutral-700`
  - [ ] 2.3 Stress type: single-select chips using `PillarTag` with `lifestyle` variant
    - Values: "work", "relationship", "physical", "financial", "other"
    - Only one selectable; tapping another deselects previous
  - [ ] 2.4 Skincare: `<textarea>` with `placeholder="e.g. CeraVe Moisturiser, sunblock..."`
  - [ ] 2.5 Common product suggestion pills: "CeraVe", "Cetaphil", "La Roche-Posay", "Aveeno", "Eucerin", "QV", "SebaMed", "Innisfree Aloe"
    - Tapping a pill appends it to the textarea content
    - If textarea empty, sets it; if has content, appends with comma
  - [ ] 2.6 Symptom sliders: three `<input type="range" min="0" max="10">` with:
    - Labels using `getSymptomPillarLabel()`: eczema → "Skin Flares", etc.
    - Live value display (number badge next to slider)
    - Track colour matches DESIGN.md `pillar-tag.symptoms` variant: `#F0E5E5` with `#7A2D2D` fill
    - Gut and respiratory sliders shown regardless of condition — they're always tracked

- [ ] Task 3: Validation + save guard (AC: 7)
  - [ ] 3.1 On "Save" click: check at least one field is non-empty
  - [ ] 3.2 Food items count > 0 OR sleep hours set OR stress level set OR skincare text non-empty OR any symptom > 0
  - [ ] 3.3 If nothing filled: show validation error "Add at least one thing to log — a meal, how you slept, or how you're feeling."
  - [ ] 3.4 Sleep hours: validate 0-24 range; show inline error if out of range
  - [ ] 3.5 Emit `onSave(logData: LogPayload)` with structured log object

- [ ] Task 4: Build `components/ui/ManualLogForm.tsx` (AC: 8)
  - [ ] 4.1 Standalone client component with props: `conditions: Condition[]`, `onSave: (log: LogPayload) => void`
  - [ ] 4.2 Reusable as both inline component (in PreFillCard "Edit more" sheet) and standalone page
  - [ ] 4.3 Section headers with `h3` typography and pillar icons
  - [ ] 4.4 All touch targets: `min-h-[44px] min-w-[44px]`
  - [ ] 4.5 All form fields: `aria-label` and proper `label`/`htmlFor` associations
  - [ ] 4.6 Form sections collapsible (accordion pattern) — food expanded by default, others collapsed

- [ ] Task 5: Integrate into the app (AC: all)
  - [ ] 5.1 Use ManualLogForm as the "Edit more" bottom sheet content in PreFillCard (E3-S3)
  - [ ] 5.2 Standalone: accessible at `/log/manual` for direct manual entry without AI
  - [ ] 5.3 Both entry paths produce the same `LogPayload` type, consumable by E3-S6 save pipeline

## Dev Notes

### Prerequisites
E3-S3 (PreFillCard) provides the "Edit more" integration point. E6-S1 provides `/api/hawker` for dish search. The hawker API route already exists in the codebase. ManualLogForm can be built independently as a standalone component.

### Architecture Rules
- **AD-3**: No Supabase writes in this story. Produces a `LogPayload` that E3-S6 saves.
- Hawker search calls `/api/hawker?q=` — follows AD-2 (all external calls through API routes).
- Form state is purely client-side. No server calls except hawker search.

### Existing Code Patterns
- **PillarTag**: Used for stress type chips and food allergen badges. Import from `@/components/ui/PillarTag`.
- **CSS classes**: `.input`, `.btn-primary`, `.btn-ghost`, `.pill`, `.card` — all in globals.css.
- **Slider styling**: Customize `<input type="range">` with Tailwind `accent-*` or custom CSS.
- **Debounce pattern**: Standard `useRef` + `setTimeout`/`clearTimeout` pattern.
- **localStorage**: Can cache draft log entries (sessionStorage key `clearlah_log_draft`) for recovery on back navigation per EXPERIENCE.md nav invariant.

### Key Files to Touch
| File | Action | Description |
|------|--------|-------------|
| `components/ui/ManualLogForm.tsx` | NEW | Full manual log entry form with all 4 pillar sections |
| `components/ui/PreFillCard.tsx` | MODIFY | Wire "Edit more" button to open ManualLogForm in bottom sheet |
| `app/log/manual/page.tsx` | NEW (optional) | Standalone manual log entry page |

### LogPayload Type
```ts
interface LogPayload {
  food: { items: { name: string; dish_id?: string; meal?: string }[]; notes?: string };
  lifestyle: { sleep_hours: number | null; stress_level: number | null; stress_type: string | null };
  skincare: string | null;
  symptoms: { skin: number | null; gut: number | null; respiratory: number | null };
}
```

### Condition-Personalised Labels
```ts
// From lib/utils/pillars.ts (already exists)
const LABEL = getSymptomPillarLabel(conditions);
// eczema → "Skin Flares", ibs → "Gut Symptoms", asthma → "Breathing", default → "Symptoms"
```

### Testing Guidance
- Unit: `__tests__/components/ManualLogForm.test.tsx` — render, verify all sections, add food item, set sleep, validate empty submit rejected
- Integration: Search "laksa" → verify results appear → tap result → verify added to food list → remove → verify removed
- Manual: Fill all fields → verify LogPayload emitted correctly
- Manual: Empty submit → verify validation error appears
- Manual: Sleep stepper → verify +/- changes value in 0.5 increments
- Manual: Stress type chip → verify single-select behaviour
- Manual: Skincare pills → tap "Cetaphil" → verify appended to textarea
- Manual: Sliders → verify live value display updates
- Manual: Touch targets → verify all interactive elements ≥ 44x44px

### UX Design References
- EXPERIENCE.md Pre-fill card fields (lines 120-128): full section breakdown
- DESIGN.md PillarTag variants: food (#F2EDD9), lifestyle (#DCE5F0), skincare (#EDE5F0), symptoms (#F0E5E5)
- DESIGN.md input component: `bg-neutral-100`, `rounded-sm`, `focus:ring-2 focus:ring-primary-sage`
- DESIGN.md touch targets: `min-h-[44px] min-w-[44px]`
- EXPERIENCE.md Form States (lines 186-196): Default → Focused → Filled → Validated → Submitted
- EXPERIENCE.md Keyboard navigation (line 275): Tab/Enter/Space/Arrow keys; `aria-live` regions

### References
- E3-S4 requirements: epics.md lines 373-392
- EXPERIENCE.md Conversational Chat Interface (lines 106-128)
- PillarTag: components/ui/PillarTag.tsx
- Pillar labels: lib/utils/pillars.ts
- PreFillCard: components/ui/PreFillCard.tsx (from E3-S3)
- Hawker API: app/api/hawker/route.ts (E6-S1)
- Design tokens: DESIGN.md (colors, spacing, typography)

## Dev Agent Record

### Agent Model Used

(To be filled by dev agent)

### Debug Log References

### Completion Notes List

### File List
