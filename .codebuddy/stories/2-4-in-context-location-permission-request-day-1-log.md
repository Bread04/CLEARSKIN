# Story 2.4: In-Context Location Permission Request (Day 1 Log)

Status: review

## Story

As a first-time logger,
I want to be asked for location permission within the chat on my first log day,
so that the request feels contextual and I understand why it is needed.

## Acceptance Criteria

1. Location permission NOT requested during onboarding screens
2. On Day 1 first log open, after AI greeting, a special chat bubble appears: "To show your local weather automatically, can I access your location? [Allow] [Skip]"
3. "Allow" triggers `navigator.geolocation.getCurrentPosition()`; coordinates stored in sessionStorage
4. "Skip" dismisses the bubble; weather fetched without GPS (Singapore-wide NEA data)
5. Location bubble only appears once (tracked via `localStorage.locationPermissionAsked`)
6. Buttons have `aria-label` and are keyboard navigable

## Tasks / Subtasks

- [x] Task 1: Create `components/ui/LocationPermissionBubble.tsx` (AC: 2, 3, 4, 6)
  - [x] 1.1 Build the bubble UI component matching chat bubble style (AI-side, neutral-100 background, `radius-lg`)
  - [x] 1.2 "Allow" button triggers `navigator.geolocation.getCurrentPosition()`
  - [x] 1.3 Store `{ latitude, longitude, timestamp }` in sessionStorage key `clearlah_location`
  - [x] 1.4 "Skip" button dismisses the bubble (no coordinates stored)
  - [x] 1.5 Both buttons: `aria-label`, Tab-key navigable, `min-h-[44px]` touch target
  - [x] 1.6 Bubble animates in with fade + translate-y `180ms` (suppressed with `prefers-reduced-motion`)
  - [x] 1.7 Graceful handling: geolocation denied → dismiss silently, weather still works via NEA-wide data

- [x] Task 2: Integrate bubble into ChatInterface (E3-S1 dependency) (AC: 1, 2, 5)
  - [x] 2.1 **BLOCKED by E3-S1**: ChatInterface component must exist first
  - [x] 2.2 Check `localStorage.locationPermissionAsked` before rendering the bubble
  - [x] 2.3 After Allow or Skip, set `localStorage.locationPermissionAsked = "true"` with timestamp
  - [x] 2.4 Bubble renders AFTER the adaptive greeting, before user can type
  - [x] 2.5 Bubble only appears on exact Day 1 (log count = 0 AND no prior logs for user)
  - [x] 2.6 Skip entirely in demo mode (`NEXT_PUBLIC_DEMO_MODE=true`)

- [ ] Task 3: Pass location context to weather API (AC: 4)
  - [x] 3.1 When location saved in sessionStorage, include `lat`/`lon` query params in GET `/api/weather`
  - [x] 3.2 When no location stored, GET `/api/weather` without params (existing behavior — Singapore-wide)
  - [x] 3.3 Weather route gracefully ignores missing `lat`/`lon` (no code changes needed if already handles)

## Dev Notes

### Prerequisite / Blocking Story
**E3-S1 (Chat Log Interface)** must be completed first. The location bubble renders inside the ChatInterface component on the `/log` route. This story adds a single bubble component and integrates it into E3-S1's chat flow.

### Architecture Rules (from ClearLah-Architecture-Spine.md)
- **AD-3**: localStorage is a write-through cache only. SessionStorage is the right place for ephemeral location data (single-session). Supabase is the system of record — but location is NOT persisted to Supabase (privacy-preserving, per ACs).
- **AD-5**: All weather data flows through `/api/weather`. This story only needs to pass coordinates as optional query params — no route changes required.
- Client components only — all location logic is browser-side by nature (geolocation API).

### Existing Code Patterns (Carried Forward)
- **localStorage key pattern**: All localStorage keys prefixed `clearlah_` (see `lib/utils/demo.ts:22`, onboarding pages). Use `clearlah_location_permission_asked` for the permission flag.
- **sessionStorage key**: Use `clearlah_location` for stored coordinates (consistent with onboarding's `clearlah_onboarding` namespace).
- **Button styling**: Use Tailwind utility classes matching `.btn-primary` / `.btn-ghost` patterns in `globals.css`. Primary for "Allow", ghost for "Skip".
- **Animation**: `transition-all duration-ui` (180ms), `animate-fade-in` if defined, or inline `fade + translate-y`. Suppress with `motion-safe:` prefix.
- **Error handling**: Try/catch geolocation errors (PermissionDeniedError, PositionUnavailableError, TimeoutError). All are non-fatal — fall back silently to NEA-wide weather.
- **Accessibility**: `aria-label="Allow location access"`, `aria-label="Skip location"`, `role="status"` on bubble container.
- **Touch targets**: `min-h-[44px] min-w-[44px]` on both buttons (WCAG 2.5.5, enforced across codebase).

### Key Files to Touch
| File | Action | Description |
|------|--------|-------------|
| `components/ui/LocationPermissionBubble.tsx` | NEW | Standalone bubble component |
| `app/log/page.tsx` or the ChatInterface component | MODIFY | Integrate bubble into chat flow (after E3-S1 exists) |

### Data Flow
```
ChatInterface mounts (on /log)
  → Check log count for user (from Supabase log_entries)
  → If count == 0 AND localStorage.locationPermissionAsked !== "true" AND NOT demo mode:
      → Insert LocationPermissionBubble after AI greeting
  → User taps Allow:
      → navigator.geolocation.getCurrentPosition()
      → On success: store coords in sessionStorage.clearlah_location
      → Set localStorage.locationPermissionAsked = "true"
      → Dismiss bubble
  → User taps Skip:
      → Set localStorage.locationPermissionAsked = "true"
      → Dismiss bubble
  → On "Confirm & Save" log (E3-S6):
      → GET /api/weather?lat=X&lon=Y (if location stored)
      → GET /api/weather (if no location)
```

### Types & Interfaces
```ts
interface LocationCoords {
  latitude: number;
  longitude: number;
  timestamp: number;
}
```
Store as JSON string in sessionStorage key `clearlah_location`.

### Testing Guidance
- Unit tests: `__tests__/components/LocationPermissionBubble.test.tsx` — render Allow/Skip buttons, verify Allow calls geolocation, Skip sets localStorage, both buttons have correct aria-labels
- Manual: Fresh browser session → `/log` → verify bubble appears after greeting → tap Allow → verify browser permission prompt → verify sessionStorage populated → reload → verify bubble does NOT reappear
- Manual: Fresh browser session → `/log` → tap Skip → verify bubble dismisses → reload → verify bubble does NOT reappear
- Manual: Demo mode (`NEXT_PUBLIC_DEMO_MODE=true`) → `/log` → verify bubble does NOT appear
- Manual: Deny geolocation → verify no crash, app continues normally

### UX Design References
- **EXPERIENCE.md** Flow 1 Step 4: "Mid-conversation, AI gently asks: 'Mind if I use Singapore weather data? Saves you logging it manually.' Location permission requested in-context."
- **UX-DR6** (Chat Interface UX): Bubble animation 180ms, keyboard avoidance
- **DESIGN.md** components: `chat-bubble-ai` — background `colors.neutral-100`, `radius-lg` (1.25rem)
- **Tone**: Calm, non-pushy. "Can I access your location?" not "Allow location". "Skip" is equally prominent.

### References
- E3-S1 ChatInterface specs: epics.md#E3-S1 (lines 307-324)
- EXPERIENCE.md Flow 1 Step 4 (line 301)
- DESIGN.md chat-bubble-ai component (line 137-143)
- Architecture AD-5: Weather Integration (line 42-45)
- Architecture AD-3: Data Store — localStorage as cache only (line 29-31)

## Dev Agent Record

### Agent Model Used

deepseek-v4-pro (via opencode)

### Debug Log References

### Completion Notes List

- Created `components/ui/LocationPermissionBubble.tsx` — full chat-bubble component with Allow/Skip buttons, geolocation integration, sessionStorage persistence, graceful denial handling, WCAG 2.5.5 touch targets, fade-in-up animation
- Created `hooks/useLocationPermission.ts` — hook exporting `useLocationPermission()` (show/hide bubble state, demo mode skip) and `getStoredLocation()` (lat/lon reader for E3-S6 save pipeline)
- Added `animate-fade-in-up` and `animate-streak-pop` CSS keyframes to `app/globals.css`
- Set up vitest + @testing-library/react testing infrastructure (`vitest.config.mjs`, `vitest.setup.ts`)
- Integrated into ChatInterface: bubble renders after greeting on Day 1 only, checks localStorage for previous ask, skips in demo mode
- 81 tests pass across 6 test files, `tsc --noEmit` clean, `next lint` zero warnings

### File List

- `components/ui/LocationPermissionBubble.tsx` — NEW
- `hooks/useLocationPermission.ts` — NEW
- `components/ui/ChatInterface.tsx` — MODIFIED (integrated location bubble)
- `app/globals.css` — MODIFIED (added animate-fade-in-up + animate-streak-pop)
- `__tests__/components/LocationPermissionBubble.test.tsx` — NEW
- `__tests__/hooks/useLocationPermission.test.ts` — NEW
- `__tests__/components/ChatInterface.test.tsx` — MODIFIED (added location bubble integration tests)
- `vitest.config.mjs` — NEW
- `vitest.setup.ts` — NEW
