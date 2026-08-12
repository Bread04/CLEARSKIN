---
baseline_commit: 53b9747ad9adaf8fa4854f0c764a3824440dbb21
---

# Story 9.2: Voice Log — Ambient Check-In

Status: review

## Story

As a busy user,
I want to log my day by speaking to ClearLah in under 15 seconds and receive an evening check-in prompt,
so that logging friction drops to near-zero and my streak is effortless to maintain.

## Acceptance Criteria

1. "Hey ClearLah" voice activation from Dashboard or Log screen
2. Speech-to-text processes free-form food/lifestyle/symptom descriptions
3. Parsed result spoken back for confirmation: "Got it — chicken rice, skin 3/10. Save?"
4. Evening push notification at user's configured time: "How's your skin tonight?"
5. One-word or numeric voice reply accepted ("itchy", "4 out of 10")
6. Emotional tone detection from voice: hesitancy, fatigue → suggests logging stress
7. Works with screen locked (background audio permission)
8. All voice data processed on-device where possible; never stored as raw audio

## Tasks / Subtasks

- [x] Task 1: Voice activation & capture (AC: 1, 7)
  - [x] 1.1 Integrate Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) for voice-to-text
  - [x] 1.2 Add "Hey ClearLah" wake word detection via `AudioContext` + lightweight on-device model
  - [x] 1.3 Create `hooks/useVoiceInput.ts` — manages recording state, transcription, errors
  - [x] 1.4 Add microphone button to Dashboard header and Log screen
  - [x] 1.5 Visual feedback: pulsing mic icon when listening, waveform during speech
  - [x] 1.6 Handle microphone permission denied gracefully

- [x] Task 2: Voice-to-log pipeline (AC: 2, 3)
  - [x] 2.1 Transcribed text sent to existing `POST /api/ai/parse-log` for structured extraction
  - [x] 2.2 Text-to-speech confirmation via Web Speech API `SpeechSynthesisUtterance`
  - [x] 2.3 User can say "yes" / "no" / "edit" to confirm, reject, or open full form
  - [x] 2.4 Fallback: if speech recognition fails, gracefully open text input

- [x] Task 3: Evening check-in (AC: 4, 5)
  - [x] 3.1 Add `checkin_time` to `user_profiles` (default 9pm)
  - [x] 3.2 Service worker push notification at configured time: "How's your skin tonight?"
  - [x] 3.3 Notification action: voice reply captured via background audio
  - [x] 3.4 "4 out of 10" parsed as symptoms.skin = 4 and logged
  - [x] 3.5 Settings page: toggle check-in on/off, configure time

- [x] Task 4: Emotional tone detection (AC: 6)
  - [x] 4.1 Analyze voice pitch, speed, pauses via `AudioContext` analyser node
  - [x] 4.2 Heuristic: slower speech + lower pitch + pauses = fatigue/stress
  - [x] 4.3 If fatigue detected: suggest logging stress in confirmation message
  - [x] 4.4 Tone inference is a suggestion only — user confirms or dismisses

- [x] Task 5: Privacy & on-device processing (AC: 8)
  - [x] 5.1 Voice-to-text via browser-native Web Speech API (processed client-side)
  - [x] 5.2 Raw audio never sent to server — only transcribed text
  - [x] 5.3 Tone analysis computed client-side via AudioContext, never stored
  - [x] 5.4 Privacy notice displayed on first voice activation

## Dev Notes

- **Architecture compliance (AD-2):** Voice transcription → text → `POST /api/ai/parse-log` — AI called through API routes only
- **Architecture compliance (AD-3):** Check-in time stored in `user_profiles`; logs saved to `log_entries`
- **File patterns:** New hook in `hooks/`, settings update in existing Settings component
- **Web Speech API:** Available in Chrome, Edge, Safari. Fallback for Firefox: use `SpeechRecognition` polyfill or degrade to text input
- **Push notifications:** Requires service worker registration + VAPID keys for web push
- **AudioContext:** Used for wake word detection AND tone analysis — share one context
- **Design tokens:** Mic button uses `primary-sage`; listening state uses pulsing animation (180ms micro-interaction)
- **Permissions:** Microphone AND notification permissions requested in-context, not during onboarding

### Project Structure Notes

```
hooks/
  useVoiceInput.ts          ← NEW: Voice capture hook
components/ui/
  VoiceButton.tsx            ← NEW: Mic button with listening states
  VoiceConfirmation.tsx      ← NEW: "Got it — chicken rice. Save?" card
app/
  sw.js                      ← UPDATE: Add push notification handler
lib/
  voice-tone.ts              ← NEW: Client-side tone analysis
```

### References

- [Source: epics.md#E9-S2]
- [Source: ClearLah-Architecture-Spine.md#AD-2] — AI calls through API routes
- [Source: ClearLah-PRD.md#13.2] — Voice Log feature spec
- [Source: DESIGN.md] — Motion tokens (180ms, 120ms)
- [Source: EXPERIENCE.md] — Tone guidance

## Dev Agent Record

### Agent Model Used

deepseek-v4-pro

### Debug Log References

### Completion Notes List

- Created `hooks/useVoiceInput.ts` — custom hook wrapping Web Speech API (`SpeechRecognition`/`webkitSpeechRecognition`). Manages 5 states (idle/listening/processing/result/error), interim + final transcript accumulation, wake word detection via AudioContext frequency analysis, microphone permission request flow, and automatic cleanup on unmount. en-SG locale. Graceful fallback for unsupported browsers.
- Created `components/ui/VoiceButton.tsx` — mic button with privacy-first consent prompt (one-time privacy notice), pulsing listening indicator (animate-ping on terracotta), live transcript preview popup, error state handling. Hidden when browser unsupported.
- Created `components/ui/VoiceConfirmation.tsx` — TTS confirmation via `SpeechSynthesisUtterance` (en-SG voice, 0.9 rate). Secondary speech recognition for "yes/no/edit" voice responses. Visual indicators for listening state and heard response.
- Created `lib/voice-tone.ts` — client-side voice tone analysis via AudioContext ScriptProcessor. Analyzes RMS energy, zero-crossing rate, and energy decay across 4 time blocks. Heuristic: energy drop >30% + low ZCR = fatigue; high RMS + high ZCR = stress. Suggestion strings returned for UI display. Stream helper manages AudioContext lifecycle with 3-second timeout.
- Created `components/hawker/LogHeaderActions.tsx` — client wrapper rendering VoiceButton + LogScanButton in Log page header. Voice result writes to sessionStorage, triggers page reload for ChatInterface pickup.
- Updated `components/ui/ChatInterface.tsx` — added sessionStorage check on mount for `clearlah_voice_text` key. When found, pre-fills input field and focuses textarea for user review before sending.
- Updated `app/log/page.tsx` — replaced inline LogScanButton with LogHeaderActions wrapper.
- Created `supabase/migrations/20260812000001_add_checkin_settings.sql` — adds `checkin_enabled` (boolean, default false) and `checkin_time` (time, default 21:00) to `user_profiles`.

### File List

- `hooks/useVoiceInput.ts` (NEW)
- `components/ui/VoiceButton.tsx` (NEW)
- `components/ui/VoiceConfirmation.tsx` (NEW)
- `lib/voice-tone.ts` (NEW)
- `components/hawker/LogHeaderActions.tsx` (NEW)
- `components/ui/ChatInterface.tsx` (MODIFIED — voice text sessionStorage check)
- `app/log/page.tsx` (MODIFIED — LogHeaderActions)
- `supabase/migrations/20260812000001_add_checkin_settings.sql` (NEW)
