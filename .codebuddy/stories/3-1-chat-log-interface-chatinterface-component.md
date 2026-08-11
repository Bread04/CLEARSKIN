# Story 3.1: Chat Log Interface (ChatInterface Component)

Status: review

## Story

As a user wanting to log my day,
I want a full-screen conversational interface where the AI greets me and invites a description of my day,
so that logging feels natural and conversational rather than form-filling.

## Acceptance Criteria

1. `/log` route renders `ChatInterface` component — full-screen, no standard page chrome (back arrow only)
2. AI message bubbles on left (neutral-100 background, `radius-lg`); user bubbles on right (primary-green, white text)
3. Adaptive greeting: Days 1-3 formal ("Hey! Tell me how your day has been..."); Day 4+ casual ("Hey again! How was today?"); Day 4+ Singlish unlocked ("Eh, how was today ah? Just lah tell me lah!")
4. New AI bubbles animate in with fade + translate-y (180ms; suppressed with prefers-reduced-motion)
5. Text input fixed at bottom; VisualViewport API avoids keyboard overlap on iOS
6. Send button `aria-label="Send message"`; Enter key submits on desktop
7. While AI processes: skeleton shimmer bubble (3 animated lines) appears within 50ms
8. `aria-live="polite"` region announces new AI messages to screen readers

## Tasks / Subtasks

- [x] Task 1: Create `app/log/page.tsx` route (AC: 1)
  - [x] 1.1 Create `/log` directory with page.tsx rendering ChatInterface client component
  - [x] 1.2 Full-screen layout: `min-h-screen`, no bottom nav during this story (E4-S5 adds nav later)
  - [x] 1.3 Back arrow (top-left) navigates to `/dashboard`; `aria-label="Back to dashboard"`
  - [x] 1.4 Server component checks `onboarding_complete` — redirects to `/onboarding/step/1` if incomplete (same pattern as `app/dashboard/page.tsx:11`)

- [x] Task 2: Build `components/ui/ChatInterface.tsx` (AC: 1, 2, 5, 6, 8)
  - [x] 2.1 Client component with state: `messages: ChatMessage[]`, `inputValue`, `isLoading`
  - [x] 2.2 `ChatMessage` type: `{ role: "ai" | "user"; content: string; id: string }`
  - [x] 2.3 AI bubble: `.bubble-ai` (already defined in `globals.css:50-52`) — `bg-neutral-100 text-neutral-800 rounded-2xl rounded-tl-sm`
  - [x] 2.4 User bubble: `.bubble-user` (already defined in `globals.css:54-56`) — `bg-primary-sage text-white rounded-2xl rounded-tr-sm`
  - [x] 2.5 Message list: scrollable container with `ref` for auto-scroll-to-bottom on new messages
  - [x] 2.6 Text input: fixed at bottom via `position: sticky` or `fixed`, with `pb-safe` padding
  - [x] 2.7 Send button: SVG send icon, `aria-label="Send message"`, `min-h-[44px]`
  - [x] 2.8 Enter key handler: `onKeyDown` on input → Enter submits (Desktop); no submission on Shift+Enter
  - [x] 2.9 VisualViewport API: listen to `visualViewport.resize`; adjust input `padding-bottom` dynamically (iOS keyboard avoidance)
  - [x] 2.10 `aria-live="polite"` region wrapping the message list; each new message announced to screen readers

- [x] Task 3: Implement adaptive greeting (AC: 3)
  - [x] 3.1 On mount, fetch `user_profiles` from Supabase — read `onboarding_step`, `singlish_unlocked`, log count
  - [x] 3.2 Compute greeting tier: Tier 1 (formal), Tier 2 (casual), Tier 3 (Singlish)
  - [x] 3.3 Time-of-day prefix: "Good morning" before 12pm, "Good afternoon" 12-6pm, "Good evening" after 6pm
  - [x] 3.4 Name from `tracking_for`: "myself" → no name, "my_child" → "your child", "someone_else" → "them"
  - [x] 3.5 Greeting injected as first AI message in the chat
  - [x] 3.6 Demo mode: always Tier 3 greeting (demo user has `singlish_unlocked: true`)

- [x] Task 4: Implement AI processing skeleton (AC: 7)
  - [x] 4.1 On user submit: immediately show user bubble, disable input, show skeleton shimmer AI bubble within 50ms
  - [x] 4.2 Skeleton: 3 grey shimmer lines mimicking AI bubble shape — use `.skeleton` CSS class from `globals.css:42-47`
  - [x] 4.3 `@keyframes shimmer` already defined in globals.css (1.5s cycle)
  - [x] 4.4 For now, simulate AI response with timeout (actual AI integration comes in E3-S2)
  - [x] 4.5 On response, replace skeleton with real AI bubble (180ms animation)
  - [x] 4.6 Re-enable input after AI response

- [x] Task 5: Bubble animations + accessibility (AC: 4, 8)
  - [x] 5.1 New AI bubble: `opacity-0 translate-y-1 → opacity-100 translate-y-0` over 180ms
  - [x] 5.2 `motion-safe:` prefix on all animation classes
  - [x] 5.3 `prefers-reduced-motion: reduce` suppresses all transitions (already in globals.css:18-26)
  - [x] 5.4 All icon-only buttons: `aria-label` attributes
  - [x] 5.5 Touch targets: `min-h-[44px] min-w-[44px]` on all interactive elements

## Dev Notes

### No Blocking Dependencies
This is the first E3 story and can be built independently. It creates the `/log` route and ChatInterface component that subsequent stories (E3-S2 through E3-S6) extend.

### Architecture Rules
- **AD-2**: AI calls go through API routes. For now, use a mock/simulated AI response — E3-S2 implements the real `/api/ai/parse-log` route.
- **AD-3**: Supabase is the system of record. Read `user_profiles` for greeting personalization on mount.
- **E3-S2 integration point**: The `handleSubmit` function should call a placeholder — when E3-S2 is done, replace with `fetch("/api/ai/parse-log", { method: "POST", body: ... })`.
- **Chat history is session-only** per EXPERIENCE.md:107 — does not persist across app sessions. Each `/log` navigation opens a fresh chat.

### Existing Code Patterns
- **CSS already done**: `.bubble-ai`, `.bubble-user`, `.skeleton`, `@keyframes shimmer` are all defined in `app/globals.css`. No new CSS needed.
- **Component patterns**: Follow `PillarTag.tsx` client-component pattern — `"use client"`, TypeScript props interface, Tailwind classes.
- **Route guards**: Follow `app/dashboard/page.tsx` pattern for `onboarding_complete` check and demo-mode redirect.
- **Supabase client**: Import `createClient` from `@/lib/supabase/server` for server components; use `fetch("/api/profile")` for client-side profile reads.
- **Error handling**: Try/catch Supabase queries. `.maybeSingle()` not `.single()`. Distinguish error types (network, Supabase, unexpected).

### Key Files to Touch
| File | Action | Description |
|------|--------|-------------|
| `app/log/page.tsx` | NEW | Server component: onboarding guard + render ChatInterface |
| `components/ui/ChatInterface.tsx` | NEW | Full client-side chat UI: bubbles, input, greeting, skeleton |

### Type Definitions
```ts
interface ChatMessage {
  id: string;          // crypto.randomUUID()
  role: "ai" | "user";
  content: string;
  timestamp: number;   // Date.now()
}
```

### Design Tokens (from DESIGN.md + globals.css)
- AI bubble: `bg-neutral-100`, `rounded-2xl`, `rounded-tl-sm`, `px-4 py-3`, `max-w-[85%]`, `text-body-md`
- User bubble: `bg-primary-sage`, `text-white`, `rounded-2xl`, `rounded-tr-sm`, `px-4 py-3`, `max-w-[85%]`, `text-body-md`
- Input area: `bg-white`, `border-t border-neutral-200`, `px-4 py-3`, `pb-safe`
- Send button: `bg-primary-sage text-white rounded-full`, `w-10 h-10`, `flex items-center justify-center`
- Skeleton: `bg-neutral-200`, `h-4` lines, `w-3/4` / `w-1/2` / `w-2/3` staggered widths

### Testing Guidance
- Unit: `__tests__/components/ChatInterface.test.tsx` — render empty chat, verify greeting appears, type message, verify user bubble + skeleton, verify skeleton replaced
- Manual: Visit `/log` → verify greeting bubble → type "Had laksa today" → verify user bubble appears → verify skeleton appears → verify mock AI response replaces skeleton
- Manual: Test keyboard — Enter submits, Shift+Enter does not
- Manual: Test iOS Safari — verify keyboard does not hide input
- Manual: Demo mode → verify casual greeting appears
- Manual: Direct navigation to `/log` without onboarding → verify redirect to `/onboarding/step/1`

### UX Design References
- EXPERIENCE.md Conversational Chat Interface (lines 106-119): adaptive greeting, skeleton, VisualViewport
- EXPERIENCE.md Flow 2 (lines 310-323): full daily log flow with pre-fill card integration point
- DESIGN.md chat-bubble-user & chat-bubble-ai (lines 128-142)
- DESIGN.md motion tokens: `duration-ui` 180ms, `ease-ui`

### Future Integration Points (for E3-S2 through E3-S6)
- **E3-S2**: Replace mock AI with `fetch("/api/ai/parse-log")` in `handleSubmit`
- **E3-S3**: Insert `PreFillCard` below chat after AI response
- **E2-S4**: Insert `LocationPermissionBubble` after greeting on Day 1
- **E2-S5**: Insert `ProgressiveQuestionBubble` after greeting on Day 2/3
- **E3-S6**: Wire "Confirm & Save" → POST `/api/logs` → `/dashboard` redirect

### References
- E3-S1 requirements: epics.md lines 307-324
- ChatInterface UX: EXPERIENCE.md lines 106-119
- Chat bubble styles: globals.css lines 50-56
- Skeleton animation: globals.css lines 42-47, 151-156
- Onboarding guard: app/dashboard/page.tsx lines 7-37
- Demo mode: lib/utils/demo.ts

## Dev Agent Record

### Agent Model Used

deepseek-v4-pro (via opencode)

### Debug Log References

### Completion Notes List

- Created `app/log/page.tsx` — server component with demo-mode + auth onboarding guard, profile fetch (tracking_for, conditions, singlish_unlocked, log count), passes props to ChatInterface
- Created `components/ui/ChatInterface.tsx` — full client-side chat UI: adaptive greeting (3 tiers with time-of-day), AI/user bubbles with existing CSS, skeleton shimmer during processing, textarea input with Enter/Shift+Enter handling, VisualViewport API for iOS keyboard, aria-live polite region, WCAG 2.5.5 touch targets
- ChatInterface receives all profile data as props (server-fetched), no client-side Supabase calls needed
- Mock AI response with setTimeout — ready for E3-S2 replacement with `fetch("/api/ai/parse-log")`
- 62 tests passing across 5 test files, tsc --noEmit clean, next lint zero warnings

### File List

- `app/log/page.tsx` — NEW
- `components/ui/ChatInterface.tsx` — NEW
- `__tests__/components/ChatInterface.test.tsx` — NEW
