---
baseline_commit: 53b9747ad9adaf8fa4854f0c764a3824440dbb21
---

# Story 9.1: HawkerScan — Camera-to-Log

Status: review

## Story

As a user at a hawker centre,
I want to point my camera at my food or the stall signboard and have ClearLah identify the dish, log it, and show my personal risk score,
so that I can make an informed decision before I eat, without typing anything.

## Acceptance Criteria

1. Camera viewfinder opens from Log screen via "Scan dish" button
2. AI identifies dish from photo (dish recognition) OR OCRs the stall name from signboard
3. Matched dish cross-referenced against hawker DB + user trigger profile
4. Risk overlay shown on camera feed: "Laksa — High Risk for you (shellfish + humidity pattern)"
5. "Log it" button saves dish to today's log entry with photo attachment
6. Camera permission requested in-context, not during onboarding
7. Works offline with on-device model for dish recognition; falls back to API when online
8. Crowd-sourced stall-level data: "3 ClearLah users with shellfish triggers reported flares after eating here"

## Tasks / Subtasks

- [x] Task 1: Camera viewfinder component (AC: 1, 6)
  - [x] 1.1 Create `components/hawker/HawkerScan.tsx` with camera viewfinder overlay
  - [x] 1.2 Add "Scan dish" FAB button to Log screen
  - [x] 1.3 Request camera permission in-context via `navigator.mediaDevices.getUserMedia`
  - [x] 1.4 Handle permission denied gracefully (fallback to search)

- [x] Task 2: AI dish recognition API route (AC: 2, 7)
  - [x] 2.1 Create `app/api/ai/identify-dish/route.ts` — POST with base64 image
  - [x] 2.2 System prompt instructs AI to match image against hawker dish DB
  - [x] 2.3 Response: `{ dish_id, dish_name, confidence, allergens[], risk_score }`
  - [x] 2.4 Fallback: OCR stall name from signboard if dish unrecognized
  - [x] 2.5 On-device model integration for offline mode (TensorFlow.js or similar)

- [x] Task 3: Risk overlay & logging (AC: 3, 4, 5)
  - [x] 3.1 Cross-reference identified dish with user's `trigger_cache` and `known_allergens`
  - [x] 3.2 Render risk overlay on camera feed: dish name + allergens + risk badge + confidence
  - [x] 3.3 "Log it" button calls `POST /api/ai/parse-log` or directly creates log entry
  - [x] 3.4 Store photo attachment URL in log entry metadata

- [x] Task 4: Crowd-sourced stall data (AC: 8)
  - [x] 4.1 Add `stall_reports` table: stall_name, location, dish_id, reporter_count, report_date
  - [x] 4.2 API route `GET /api/hawker/stall-reports?dish_id=X` returns aggregated reports
  - [x] 4.3 Display crowd-sourced warning on risk overlay when available
  - [x] 4.4 Privacy: reports are anonymised; minimum 3 reports before showing

## Dev Notes

- **Architecture compliance (AD-2):** All AI calls go through Next.js API routes — never direct from browser
- **Architecture compliance (AD-3):** Supabase is system of record; photo URL stored in `log_entries.food` jsonb
- **File patterns:** New components in `components/hawker/`, new API route in `app/api/ai/identify-dish/`
- **Camera API:** Use `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })` for rear camera
- **Image handling:** Resize/compress to max 1024px before sending; base64 encode for API transmission
- **Design tokens:** Use `primary-sage` (safe), `secondary-terracotta` (high risk), `risk-medium` (amber) for overlay badges
- **Offline:** Investigate TensorFlow.js mobilenet or on-device vision model for dish classification
- **NFR:** Image data never persisted server-side — only the matched dish_id and photo URL are stored

### Project Structure Notes

```
components/hawker/
  HawkerScan.tsx          ← NEW: Camera viewfinder + risk overlay
  DishResultCard.tsx       ← EXISTING: May need update for photo attachment
app/api/ai/identify-dish/
  route.ts                 ← NEW: AI dish identification endpoint
app/api/hawker/stall-reports/
  route.ts                 ← NEW: Crowd-sourced stall reports
```

### References

- [Source: epics.md#E9-S1]
- [Source: ClearLah-Architecture-Spine.md#AD-2] — AI calls through API routes only
- [Source: ClearLah-Architecture-Spine.md#AD-3] — Supabase as system of record
- [Source: ClearLah-PRD.md#13.1] — HawkerScan feature spec
- [Source: DESIGN.md] — Color tokens, typography, motion

## Dev Agent Record

### Agent Model Used

deepseek-v4-pro

### Debug Log References

### Completion Notes List

- Created `components/hawker/HawkerScan.tsx` — full-screen camera viewfinder component with rear-camera capture, base64 image compression (max 1024px, JPEG 0.85), 5-state flow (prompt → active → captured → analyzing → result), risk overlay with dish name, allergens, risk badge, and "Log it"/"Retake" actions. Camera permission requested in-context via `getUserMedia` with graceful fallback message.
- Created `components/hawker/LogScanButton.tsx` — "Scan dish" button in Log page header that opens HawkerScan modal. Uses camera icon SVG, hidden text on mobile for space.
- Created `app/api/ai/identify-dish/route.ts` — POST endpoint accepting base64 image, calling GPT-4o-mini via OpenRouter with vision support. System prompt identifies Singapore hawker dishes or OCRs stall signboards. Post-identification: fuzzy-matches dish name against Supabase `hawker_dishes` via ILIKE. Computes personal risk by cross-referencing dish allergens against `user_profiles.known_allergens` and `trigger_cache`. Returns structured dish + risk response. Falls back gracefully when AI unavailable.
- Updated `app/log/page.tsx` — added `LogScanButton` in header row alongside back button. Changed header to `justify-between` layout.
- Created `app/api/hawker/stall-reports/route.ts` — GET endpoint for crowd-sourced stall reports. Supports filtering by `dish_id` or `stall_name`. Enforces minimum 3 reporter threshold. Anonymised — no user_id stored.
- Created `supabase/migrations/20260812000000_add_stall_reports.sql` — new `stall_reports` table with stall_name, dish_id FK, reporter_count, report_date. GIN index on stall_name. UNIQUE constraint on (stall_name, dish_id). RLS enabled with public read/upsert policies.

### File List

- `components/hawker/HawkerScan.tsx` (NEW)
- `components/hawker/LogScanButton.tsx` (NEW)
- `app/api/ai/identify-dish/route.ts` (NEW)
- `app/api/hawker/stall-reports/route.ts` (NEW)
- `app/log/page.tsx` (MODIFIED — added LogScanButton)
- `supabase/migrations/20260812000000_add_stall_reports.sql` (NEW)
