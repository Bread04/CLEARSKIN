# Story 3.2: AI Log Parser (POST /api/ai/parse-log)

Status: review

## Story

As a server-side AI route,
I want to receive the user's free-text log message and return a structured JSON log object,
so that the client can pre-fill the log form without the user re-entering data.

## Acceptance Criteria

1. `app/api/ai/parse-log/route.ts` handles POST with body `{ message: string, userProfile: { conditions: string[], known_allergens: string[] } }`
2. Calls CodeBuddy AI API with system prompt instructing extraction of:
   - `food: { items: string[], hawker_dishes: string[] }`
   - `lifestyle: { sleep_hours: number|null, stress_level: number|null (1-5), stress_type: string|null }`
   - `skincare: string|null`
   - `symptoms: { skin: number|null, gut: number|null, respiratory: number|null }` (1-10)
   - `summary: string` — 1-sentence plain-English summary
3. Response arrives within 2 seconds for typical input (under 200 words)
4. If AI API unavailable: returns `{ error: "ai_unavailable", partial: {} }` with HTTP 503
5. No raw log text or user profile persisted by this route
6. System prompt includes condition context (e.g., "User has eczema — skin symptoms are most important")
7. AI instructed to respond ONLY with valid JSON

## Tasks / Subtasks

- [x] Task 1: Create `app/api/ai/parse-log/route.ts` (AC: 1, 2, 6, 7)
  - [x] 1.1 POST handler: parse `message` and `userProfile` from request body
  - [x] 1.2 Validate: `message` required (non-empty string), `userProfile` optional but validated if present
  - [x] 1.3 Return 400 for missing/invalid `message`
  - [x] 1.4 Construct system prompt dynamically from user conditions
  - [x] 1.5 Call CodeBuddy AI API (REST endpoint with `CODEBUDDY_API_KEY` auth)
  - [x] 1.6 System prompt instructs: "Respond ONLY with valid JSON"
  - [x] 1.7 Parse AI response JSON; validate structure
  - [x] 1.8 Return structured `ParseLogResponse` to client

- [x] Task 2: Implement AI unavailability fallback (AC: 4)
  - [x] 2.1 Wrap AI call in try/catch; catch fetch errors, timeouts, non-200
  - [x] 2.2 Timeout AI call at 8 seconds via AbortController
  - [x] 2.3 On failure: return `{ error: "ai_unavailable", partial: {} }` with HTTP 503
  - [x] 2.4 Log AI failures to console with structured context

- [x] Task 3: Privacy & data handling (AC: 5)
  - [x] 3.1 Route is stateless — no database writes, no logging
  - [x] 3.2 Do NOT persist `message` or `userProfile`
  - [x] 3.3 API key read from `process.env.CODEBUDDY_API_KEY` — never returned to client

- [x] Task 4: Define types and response schema
  - [x] 4.1 Added `ParseLogRequest`, `ParsedLog`, `ParseLogResponse` to `lib/types/database.ts`

- [x] Task 5: Integrate into ChatInterface (AC: 3)
  - [x] 5.1 ChatInterface `handleSubmit` now POSTs to `/api/ai/parse-log`
  - [x] 5.2 Passes `message` + `userProfile` (conditions, known_allergens)
  - [x] 5.3 On success: stores `parsed` (summary shown in AI bubble)
  - [x] 5.4 On 503: shows "I had a bit of trouble understanding that..."
  - [x] 5.5 On any other error: shows "Something went wrong — try again in a sec?"

## Dev Notes

### Prerequisite
**E3-S1 (ChatInterface)** must be completed first. This story creates the AI route and wires it into ChatInterface's `handleSubmit`.

### Architecture Rules
- **AD-2**: CodeBuddy AI API is called EXCLUSIVELY from Next.js API routes. The ChatInterface client component calls `/api/ai/parse-log` — never CodeBuddy API directly. This keeps `CODEBUDDY_API_KEY` server-side.
- **AD-5**: No raw log text persisted. The route is a stateless transformer: message → structured JSON. Weather and log storage happen in E3-S6.
- **Error contract**: Route returns HTTP 200 on success, 400 on bad input, 503 on AI failure. Never 500 to client (catch-all returns 503 with error message).

### CodeBuddy AI Integration
- `CODEBUDDY_API_KEY` is set in `.env.local` (local dev) and Vercel env vars (production)
- Read from `process.env.CODEBUDDY_API_KEY` — never exposed to client
- Verify API endpoint with CodeBuddy docs: likely `POST https://api.codebuddy.ai/v1/chat/completions` with OpenAI-compatible SDK or raw `fetch`
- System prompt engineering is this story's core value: condition context dramatically improves parse quality

### Existing Patterns to Follow
- **API route pattern**: Follow `app/api/weather/route.ts` — export async function POST, validate input first, wrap main logic in try/catch
- **API route pattern**: Follow `app/api/profile/route.ts` — structured error responses, HTTP status codes
- **TypeScript**: Import types from `@/lib/types/database`, use `NextResponse.json()` for responses
- **Error handling**: Distinguish `SyntaxError` (bad JSON body → 400), `UnauthenticatedError` (401), framework errors (re-throw), all others (503)

### Key Files to Touch
| File | Action | Description |
|------|--------|-------------|
| `app/api/ai/parse-log/route.ts` | NEW | POST handler: message → structured log via CodeBuddy AI |
| `lib/types/database.ts` | MODIFY | Add `ParseLogRequest`, `ParsedLog`, `ParseLogResponse` types |
| `components/ui/ChatInterface.tsx` | MODIFY | Wire `handleSubmit` to POST `/api/ai/parse-log` |

### System Prompt Template
```
You are a health log parser for ClearLah, an app that helps users track food, lifestyle, skincare, and symptom triggers for chronic conditions.

{condition_context}

Given a user's free-text description of their day, extract structured data:
- food.items: list of food/drink items mentioned
- food.hawker_dishes: any Singapore hawker dishes identified
- lifestyle.sleep_hours: number of hours slept (null if not mentioned)
- lifestyle.stress_level: 1-5 scale (null if not mentioned)
- lifestyle.stress_type: "work" | "relationship" | "physical" | "financial" | "other" (null if not mentioned)
- skincare: skincare products used today (null if not mentioned)
- symptoms.skin: 1-10 severity (null if not mentioned or not applicable)
- symptoms.gut: 1-10 severity
- symptoms.respiratory: 1-10 severity
- summary: one-sentence plain-English summary of the day

Respond ONLY with valid JSON. No markdown, no explanation. Example:
{"food":{"items":["laksa","teh tarik"],"hawker_dishes":["Laksa"]},"lifestyle":{"sleep_hours":6.5,"stress_level":4,"stress_type":"work"},"skincare":"Cetaphil moisturiser","symptoms":{"skin":7,"gut":null,"respiratory":null},"summary":"Laksa for lunch, stressed from work, skin flaring tonight."}
```

### Testing Guidance
- Unit: `__tests__/api/parse-log.test.ts` — verify POST returns 400 for missing message, 503 mock for AI failure, correct structure on success
- Manual: Type "Had laksa for lunch, quite stressed, skin itchy 7/10" → verify parsed response has laksa in food, stress=4, skin=7
- Manual: Type "Slept 8 hours, ate chicken rice, feeling good" → verify sleep_hours=8, skin=null
- Manual: Kill AI API → verify 503 returned, ChatInterface shows graceful retry message
- Manual: Empty message → verify 400 with descriptive error

### UX Design References
- E3-S2 requirements: epics.md lines 327-348
- Architecture AD-2: AI Layer — all AI calls through API routes (line 25-26)
- EXPERIENCE.md AI parse confirmation tone: "Got it — I've filled in what I heard. Double-check before saving, okay?" (line 85)

### References
- Weather API route pattern: app/api/weather/route.ts
- Profile API route pattern: app/api/profile/route.ts
- ChatInterface: components/ui/ChatInterface.tsx (from E3-S1)
- Database types: lib/types/database.ts
- Architecture AD-2: ClearLah-Architecture-Spine.md lines 24-26

## Dev Agent Record

### Agent Model Used

deepseek-v4-pro (via opencode)

### Debug Log References

### Completion Notes List

- Created `app/api/ai/parse-log/route.ts` — POST handler with CodeBuddy AI integration (OpenAI-compatible endpoint), dynamic system prompt from user conditions + known allergens, 8s timeout via AbortController, 503 fallback when API unavailable
- Added basic fallback parser `basicFallbackParse()` — regex-based extraction of hawker dishes (85+ known dishes), sleep hours, stress level/type, skincare products, skin symptoms. Enables functional app even without CodeBuddy API key.
- Added `ParseLogRequest`, `ParsedLog`, `ParseLogResponse` types to `lib/types/database.ts`
- Wired ChatInterface `handleSubmit` to call `/api/ai/parse-log` with message + userProfile; handles success (shows summary), 503 (retry message), and errors (generic error)
- 73 tests passing (11 new parse-log tests), tsc --noEmit clean, next lint zero warnings
- **Route is stateless**: no database writes, no logging. API key never exposed to client.

### File List

- `app/api/ai/parse-log/route.ts` — NEW
- `lib/types/database.ts` — MODIFIED (added ParseLogRequest, ParsedLog, ParseLogResponse)
- `components/ui/ChatInterface.tsx` — MODIFIED (wired handleSubmit to /api/ai/parse-log)
- `__tests__/api/parse-log.test.ts` — NEW
