# Story 5.1: Pattern Engine (lib/pattern-engine.ts)

Status: ready-for-dev

## Story

As a server-side computation module,
I want a pure TypeScript pattern detection function that analyses log entries and returns ranked trigger correlations,
so that the Insights page has meaningful data without relying on AI for statistical analysis.

## Acceptance Criteria

1. `lib/pattern-engine.ts` exports: `detectCorrelations(entries: LogEntry[]): CorrelationResult[] | InsufficientDataResult`
2. Returns `{ status: "insufficient_data", entries_needed: number }` when entries.length < 7
3. When 7+ entries: analyses food items x symptoms, weather metrics x symptoms, sleep x symptoms, stress x symptoms correlations
4. Each `CorrelationResult`: `{ trigger: string, pillar: Pillar, confidence: number (0-100), cooccurrence_count: number, affected_days: string[], explanation_template: string }`
5. Results sorted by confidence descending; top 5 returned
6. Pure function: no I/O, no side effects, no Supabase imports
7. Unit tests in `__tests__/pattern-engine.test.ts` with fixture data covering: single trigger, multi-trigger, weather bucket correlation, insufficient data
8. Called ONLY from `/api/insights/correlate`; never from client code

## Tasks / Subtasks

- [ ] Task 1: Build `lib/pattern-engine.ts` (AC: 1-6)
  - [ ] 1.1 Define `LogEntry` input type (from `lib/types/database.ts` `DbLogEntry`)
  - [ ] 1.2 Define output types: `CorrelationResult`, `InsufficientDataResult`
  - [ ] 1.3 Return insufficient_data when entries < 7
  - [ ] 1.4 Food analysis: count each food item; compare average symptom severity when item present vs absent; compute confidence as `(withItemSeverity - withoutItemSeverity) / 10 * 100`
  - [ ] 1.5 Weather analysis: bucket humidity (>85%, 70-85%, <70%), temperature, PSI; correlate each bucket with average symptom severity
  - [ ] 1.6 Sleep analysis: bucket sleep (<6h, 6-7h, >7h); correlate short sleep with symptoms
  - [ ] 1.7 Stress analysis: stress level (4-5 = high) vs symptom correlation
  - [ ] 1.8 Sort by confidence descending, return top 5
  - [ ] 1.9 No Supabase, no fetch, no I/O — pure computation

- [ ] Task 2: Write comprehensive tests (AC: 7)
  - [ ] 2.1 `__tests__/pattern-engine.test.ts` — factory function to create test LogEntry arrays
  - [ ] 2.2 Test: < 7 entries → returns insufficient_data with correct entries_needed
  - [ ] 2.3 Test: 7 entries, mollusc pattern (shellfish 5/7 days with avg skin 8, no-shellfish days skin 2) → shellfish appears with high confidence
  - [ ] 2.4 Test: multi-trigger scenario → food + weather correlations both detected
  - [ ] 2.5 Test: weather bucket — high humidity days vs low humidity days
  - [ ] 2.6 Test: sleep correlation — <6h sleep days have higher symptoms
  - [ ] 2.7 Test: empty food items, null symptoms — handled gracefully

- [ ] Task 3: Define types and exports (AC: 4, 8)
  - [ ] 3.1 Export `CorrelationResult` type to `lib/types/database.ts`
  - [ ] 3.2 Export `InsufficientDataResult` type
  - [ ] 3.3 Export `detectCorrelations` as named export
  - [ ] 3.4 Add JSDoc explaining input/output contract

## Dev Notes

### Architecture Rules
- **AD-4**: "A JavaScript correlation engine computes frequency analysis across all 5 pillars and produces a structured CorrelationResult[]." This IS that engine.
- **Pure function**: No imports from Supabase, no `fetch`, no React. Input is `DbLogEntry[]` array, output is structured results.
- **Server-only**: Import only from API routes (`/api/insights/correlate`). Never from client code.

### Correlation Algorithm
```
For each food item in all entries:
  - Group entries where item WAS eaten → average symptom severity
  - Group entries where item was NOT eaten → average symptom severity  
  - If difference > 1.5 severity points → correlation detected
  - confidence = min(difference * 15, 95) // capped at 95

For humidity:
  - Group entries into buckets: >85%, 70-85%, <70%
  - Average symptom severity per bucket
  - If >85% avg severity significantly higher → correlation

For sleep:
  - <6h avg severity vs >=6h avg severity
  - Difference threshold: 1.5

For stress:
  - High stress (4-5) avg severity vs low stress (1-3)
```

### Key Files to Touch
| File | Action | Description |
|------|--------|-------------|
| `lib/pattern-engine.ts` | NEW | Core correlation engine |
| `lib/types/database.ts` | MODIFY | Add CorrelationResult type |
| `__tests__/pattern-engine.test.ts` | NEW | Comprehensive test suite |

### Types
```ts
type Pillar = "food" | "lifestyle" | "skincare" | "symptoms" | "weather";

interface CorrelationResult {
  trigger: string;           // e.g. "Shellfish", "Humidity > 85%"
  pillar: Pillar;
  confidence: number;        // 0-100
  cooccurrence_count: number;
  affected_days: string[];   // ISO dates
  explanation_template: string;
}

interface InsufficientDataResult {
  status: "insufficient_data";
  entries_needed: number;
}
```

### Testing Guidance
- Unit: All tests in vitest, no Supabase mocking needed (pure function)
- Test data: create `DbLogEntry` arrays with known patterns
- Edge cases: empty food items, null symptoms, all same severity, single entry with extreme value

### References
- E5-S1 requirements: epics.md lines 551-566
- Architecture AD-4: Pattern Detection (ClearLah-Architecture-Spine.md lines 36-40)
- Database types: lib/types/database.ts
- Demo data: data/demo-data.json (14 days with known shellfish + humidity pattern)

## Dev Agent Record

### Agent Model Used

(To be filled by dev agent)

### Debug Log References

### Completion Notes List

### File List
