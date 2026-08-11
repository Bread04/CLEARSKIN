# Story 5.3: AI Narration Route & Insight Cards

Status: ready-for-dev

## Story

As a user reviewing my health patterns,
I want top trigger correlations as clear insight cards with plain-English explanations and confidence percentage,
so that I understand my patterns without interpreting raw statistics.

## Acceptance Criteria

1. `app/api/ai/narrate-insights/route.ts` handles POST with `{ correlations: CorrelationResult[], userProfile: { conditions: string[] } }`; returns `{ narrations: string[] }` (one per correlation, max 2 sentences each)
2. AI tone: calm, factual, no medical claims, no alarm language (per EXPERIENCE.md tone guidance)
3. Example narration: "Your skin flares tend to peak when humidity is above 85% and shellfish is in your recent meals. This pattern appeared on 8 of your logged days."
4. `/insights` route renders `InsightCard` components (max 5):
   - 4px primary-sage left border; primary-light fill
   - Confidence % in `numeric` typography (2.5rem/700)
   - Trigger label in `h3`; narration in `body-lg`
   - `PillarTag` components along bottom for involved pillars
   - "See evidence" disclosure toggle (aria-expanded)
5. "See evidence" toggle reveals timeline of 3-5 contributing log dates with brief context
6. Insight cards stagger-animate in (40ms delay between cards; suppressed prefers-reduced-motion)
7. Loading: 3 InsightCard skeleton shimmers
8. Pull-to-refresh re-fetches correlations

## Tasks / Subtasks

- [ ] Task 1: Create `app/api/ai/narrate-insights/route.ts` (AC: 1, 2)
  - [ ] 1.1 POST handler: receive `correlations` and `userProfile.conditions`
  - [ ] 1.2 Build system prompt: "You are a health insights narrator for ClearLah. Write calm, factual explanations. No medical claims. User has: [conditions]."
  - [ ] 1.3 For each correlation, generate 1-2 sentence narration from `trigger`, `confidence`, `cooccurrence_count`
  - [ ] 1.4 Call CodeBuddy AI API with prompt + correlation data
  - [ ] 1.5 Fallback template if AI unavailable: `"{trigger} appeared on {count} of your flare days ({confidence}% confidence)."`
  - [ ] 1.6 Return `{ narrations: string[] }` — array index matches correlations array

- [ ] Task 2: Build `components/insights/InsightCard.tsx` (AC: 4, 5)
  - [ ] 2.1 Client component: props `correlation`, `narration`, `pillar`
  - [ ] 2.2 Styling: `bg-primary-light`, `border-l-4 border-primary-sage`, `rounded-md`, `p-6`
  - [ ] 2.3 Confidence %: `text-numeric` (2.5rem/700), sage colour
  - [ ] 2.4 Trigger label: `text-h3 text-neutral-800`
  - [ ] 2.5 Narration: `text-body-lg text-neutral-600`
  - [ ] 2.6 PillarTags at bottom: render relevant `PillarTag` components
  - [ ] 2.7 "See evidence" button: `aria-expanded`, toggles evidence panel with `transition-all duration-ui`
  - [ ] 2.8 Evidence panel: list of 3-5 dates with brief context (date + food items + symptom score)

- [ ] Task 3: Rewrite `/insights` page (AC: 4, 6, 7, 8)
  - [ ] 3.1 Replace placeholder: `app/insights/page.tsx` fetches from `/api/insights/correlate`
  - [ ] 3.2 Loading: 3 InsightCard-shaped skeleton shimmers (`.skeleton` class)
  - [ ] 3.3 Insufficient data: ProgressRing + "N more days" message (use ProgressRing from E4-S2)
  - [ ] 3.4 Data available: render InsightCard list with stagger animation (40ms delay per card)
  - [ ] 3.5 Pull-to-refresh: re-fetch correlations on `onTouchEnd` overscroll
  - [ ] 3.6 "Generate Report" CTA at bottom (navigates to `/insights/report` — E5-S4)

## Dev Notes

### Dependencies
- **E5-S1**: Pattern engine must exist
- **E5-S2**: `/api/insights/correlate` must exist
- **E4-S2**: ProgressRing component exists

### Architecture Rules
- **AD-2**: AI narration via `/api/ai/narrate-insights` (server-side only)
- **AD-4**: Raw logs NEVER passed to AI — only CorrelationResult[]
- `trigger_cache` pre-computed for demo user (shellfish, humidity, sleep)

### Key Files to Touch
| File | Action | Description |
|------|--------|-------------|
| `app/api/ai/narrate-insights/route.ts` | NEW | AI narration endpoint |
| `components/insights/InsightCard.tsx` | NEW | Single insight card |
| `app/insights/page.tsx` | MODIFY | Full insights page with cards |
| `lib/types/database.ts` | MODIFY | Add narration types |

### Testing Guidance
- Unit: `__tests__/api/narrate-insights.test.ts` — mock AI, verify narration format, fallback template
- Unit: `__tests__/components/InsightCard.test.tsx` — render card, verify confidence display, toggle evidence
- Manual: Demo user → `/insights` → verify 3+ insight cards with narrations

### UX Design References
- EXPERIENCE.md Insight Cards (lines 139-147)
- EXPERIENCE.md Flow 3 (lines 328-341): first insight unlock
- DESIGN.md insight-card: `bg-primary-light`, `border-l-4 border-primary-sage`

### References
- E5-S3 requirements: epics.md lines 589-612
- EXPERIENCE.md Insight Cards: lines 139-147
- DESIG.md insight-card: line 172-175

## Dev Agent Record

### Agent Model Used

(To be filled by dev agent)

### Debug Log References

### Completion Notes List

### File List
