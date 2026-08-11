# Story 3.3: Pre-Fill Card & Editable Form Review

Status: ready-for-dev

## Story

As a user who has described my day to the AI,
I want to see a pre-filled form card below the chat that I can review and edit before saving,
so that I can correct AI mistakes and confirm the data is accurate.

## Acceptance Criteria

1. After AI parses the log, a pre-fill card expands below the chat thread with smooth height animation (180ms)
2. Card displays all extracted fields in a compact editable form:
   - Food: list of detected items, each editable; "Add food" button
   - Sleep hours: number input (0-24) pre-filled from AI parse
   - Stress level: 1-5 segmented selector
   - Stress type: chip selector (Work / Relationship / Physical / Financial / Other)
   - Skincare: free-text area pre-filled from AI parse
   - Symptoms: three sliders (Skin/Gut/Respiratory, 1-10) with current value shown
3. "Confirm & Save" primary button always visible (never hidden below keyboard)
4. "Edit more" secondary button expands full form in bottom sheet
5. Pillar labels use condition-personalised names (FR4)
6. All form fields have `aria-label` attributes

## Tasks / Subtasks

- [ ] Task 1: Build `components/ui/PreFillCard.tsx` (AC: 1, 2, 5, 6)
  - [ ] 1.1 Client component receiving `parsedLog: ParsedLog` (from E3-S2 parse) and `conditions: Condition[]`
  - [ ] 1.2 Expand animation: `max-h-0 overflow-hidden → max-h-[2000px]` over 180ms with `ease-ui`
  - [ ] 1.3 Food section: list of `items[]`, each item in editable pill with ✕ remove. "Add food" button opens inline text input
  - [ ] 1.4 Sleep hours: `<input type="number" min="0" max="24" step="0.5">` pre-filled from AI, with stepper buttons
  - [ ] 1.5 Stress level: 5 segmented buttons (1-5) with labels ("Low" to "Very High"); selected button filled
  - [ ] 1.6 Stress type: horizontal chip selector — "Work", "Relationship", "Physical", "Financial", "Other"; single-select
  - [ ] 1.7 Skincare: `<textarea>` pre-filled; `placeholder="e.g. Cetaphil, CeraVe"`
  - [ ] 1.8 Symptoms: three range sliders with labels — use personalised pillar label from `getSymptomPillarLabel()`
    - Skin flair / Gut symptom / Respiratory slider (label varies by condition)
    - Each slider: `1-10`, current value shown, default 0 (not measured)
    - Slider colours match `PillarTag` variants: `symptoms` pillar variant (#F0E5E5 / #7A2D2D)
  - [ ] 1.9 All fields: `aria-label`, `htmlFor`/`id` associations, keyboard navigable

- [ ] Task 2: "Confirm & Save" + "Edit more" buttons (AC: 3, 4)
  - [ ] 2.1 "Confirm & Save": `.btn-primary`, full-width, sticky at bottom of card, `min-h-[44px]`
  - [ ] 2.2 "Edit more": `.btn-ghost`, expands a bottom sheet with full detailed form (full food list, all fields)
  - [ ] 2.3 Bottom sheet: slides up, semi-transparent backdrop, `rounded-xl` top corners
  - [ ] 2.4 "Confirm & Save" handler: emits `onConfirm(editedLog: ParsedLog)` — actual save is deferred to E3-S6
  - [ ] 2.5 For this story: `onConfirm` stores the edited log in state/sessionStorage; placeholder save confirmation

- [ ] Task 3: Integrate into ChatInterface (AC: 1, 3)
  - [ ] 3.1 **BLOCKED by E3-S1 + E3-S2**: ChatInterface + AI parse must exist
  - [ ] 3.2 After AI parse response (E3-S2), insert PreFillCard below the chat thread
  - [ ] 3.3 PreFillCard receives `parsedLog` from the parse API response
  - [ ] 3.4 On "Confirm & Save": for now, show confirmation bubble in chat "✓ Log saved for today." (full save implementation in E3-S6)
  - [ ] 3.5 Keyboard-safe layout: card above input; scrollable card content within `max-h-[50vh]`

- [ ] Task 4: Condition-personalised labels (AC: 5)
  - [ ] 4.1 Import `getSymptomPillarLabel(conditions)` from `lib/utils/pillars.ts` (already exists from E2-S2)
  - [ ] 4.2 Symptom slider label adapts: eczema → "Skin Flares", ibs → "Gut Symptoms", asthma → "Breathing", default → "Symptoms"
  - [ ] 4.3 Food section uses "Food" (unchanged); Lifestyle uses "Lifestyle" (unchanged); Skincare uses "Skincare" (unchanged)

## Dev Notes

### Prerequisites
**E3-S1 (ChatInterface)** and **E3-S2 (AI parse-log)** must be completed first. This story builds the review/edit card that appears after AI parsing.

### Architecture Rules
- **AD-3**: Supabase is the system of record. The PreFillCard doesn't write to Supabase — it only edits in-memory state. E3-S6 handles the actual save.
- All form state is local to the component. No Supabase calls in this story.
- localStorage is NOT used for the log entry itself — sessionStorage only for draft recovery during session.

### Existing Code Patterns
- **`PillarTag` component** (from E2-S2): Available for stress type chips and pillar indicators. Import from `@/components/ui/PillarTag`.
- **`getSymptomPillarLabel()`** (from E2-S2): Already in `lib/utils/pillars.ts`. Use for dynamic symptom slider label.
- **Button styles**: `.btn-primary`, `.btn-ghost` defined in `globals.css`.
- **Animation**: Use `transition-all duration-ui` (180ms), `ease-ui` for card expand/collapse.
- **Sliders**: Native `<input type="range">` styled with Tailwind; or custom slider component.

### Key Files to Touch
| File | Action | Description |
|------|--------|-------------|
| `components/ui/PreFillCard.tsx` | NEW | Editable review card with all log fields |
| `components/ui/ChatInterface.tsx` | MODIFY | Insert PreFillCard after AI parse response |

### Types (from E3-S2 / lib/types/database.ts)
```ts
interface ParsedLog {
  food: { items: string[]; hawker_dishes: string[] };
  lifestyle: { sleep_hours: number | null; stress_level: number | null; stress_type: string | null };
  skincare: string | null;
  symptoms: { skin: number | null; gut: number | null; respiratory: number | null };
  summary: string;
}
```

### Testing Guidance
- Unit: `__tests__/components/PreFillCard.test.tsx` — render with mock ParsedLog → verify all fields pre-filled, edit food item, change stress level, verify onConfirm called with edited data
- Unit: Verify condition-personalised label: eczema → "Skin Flares", ibs → "Gut Symptoms"
- Manual: Full flow: type message → AI parses → card appears → edit sleep hours → change stress → "Confirm & Save" → verify chat confirmation
- Manual: "Edit more" → bottom sheet opens → verify all fields editable → close sheet → verify card still shows edits
- Manual: Remove food item → verify item disappears from list
- Manual: Add food item manually → verify appears in list

### UX Design References
- EXPERIENCE.md Pre-fill card fields (lines 120-128): section structure and edit types
- EXPERIENCE.md Flow 2 Step 5-7 (lines 317-321): card expansion, smart suggestions, edit → confirm flow
- DESIGN.md `insight-card` left-border style: 4px primary-sage left border (reference for card styling)
- DESIGN.md `pillar-tag` colour variants for symptom sliders
- DESIGN.md motion: `duration-ui` 180ms transitions

### References
- E3-S3 requirements: epics.md lines 351-372
- EXPERIENCE.md Flow 2: lines 310-323
- PillarTag: components/ui/PillarTag.tsx
- Pillar labels: lib/utils/pillars.ts
- ChatInterface: components/ui/ChatInterface.tsx (from E3-S1)
- ParsedLog type: lib/types/database.ts (added in E3-S2)

## Dev Agent Record

### Agent Model Used

(To be filled by dev agent)

### Debug Log References

### Completion Notes List

### File List
