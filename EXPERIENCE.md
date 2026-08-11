---
status: final
updated: 2026-08-08
product: ClearLah
version: "1.1"
design-ref: DESIGN.md v1.1
sources:
  - ClearLah-PRD.md
  - ClearLah-Architecture-Spine.md
  - ClearLah-Architecture-Explainer.md
---

# ClearLah — Experience Specification

> Visual identity is owned by `DESIGN.md`. This document owns how ClearLah **works** — behaviour, states, flows, accessibility, and all user-facing interaction logic. Cross-references use `{path.to.token}` syntax pointing to `DESIGN.md`.

---

## Foundation

**Form factor:** Mobile-first responsive web app. Primary use context: one-handed, on-the-go (hawker centre, home, office). No native install required for MVP. Optimised for 375–430px viewport width; usable on tablet up to 768px; no desktop-specific layout required for hackathon.

**UI system:** Tailwind CSS utility classes. No component library. Custom components follow patterns defined in `DESIGN.md.components`. All interactive components are built as React Server or Client Components within Next.js 14 App Router.

**Visual identity reference:** `DESIGN.md` — all colour tokens, typography scales, shape rules, and component specs originate there. This document references them by token only.

**Rendering strategy:**
- Server Components for static chrome (layout, nav, metadata)
- Client Components for interactive surfaces (chat, forms, streak counter)
- `NEXT_PUBLIC_DEMO_MODE=true` bypasses auth globally; all routes use `DEMO_USER_ID='demo-user-001'`

---

## Information Architecture

### Surface Map

```
ClearLah Web App
├── Onboarding (first-run only — 2 screens, progressive disclosure)
│   ├── /onboarding/welcome    — Value prop + primary concern (eczema / rhinitis / asthma / other)
│   └── /onboarding/disclaimer — Medical disclaimer (acknowledged, cannot be skipped)
│   Note: Location permission, trigger explainer, and detailed profile
│         are collected progressively through AI log conversations (Days 1–3)
│
└── App Shell (post-onboarding)
    ├── /dashboard             — Home: streak, quick log, weather, High Risk Day
    ├── /log                   — Daily log entry (conversational AI + confirm form)
    ├── /insights              — Trigger pattern cards + correlation explorer
    ├── /hawker                — Hawker dish safety checker
    └── /report                — Doctor-ready trigger summary + export
```

**Bottom navigation** (persists on all app-shell routes):

| Tab | Icon | Route | Badge |
|---|---|---|---|
| Home | house | `/dashboard` | High Risk dot (orange) |
| Log | plus-circle | `/log` | Streak flame if active |
| Insights | chart-bar | `/insights` | "New" dot if new insight |
| Hawker | utensils | `/hawker` | — |

Active tab uses `{colors.primary}` icon + label. Inactive uses `{colors.neutral-500}`.

### Navigation Invariants

- Back navigation never clears an in-progress log entry (state is preserved in session storage)
- Tapping the active bottom-nav tab scrolls the current page to top
- Log tab is always reachable in ≤ 1 tap from any app screen

---

## Voice and Tone

> Brand personality lives in `DESIGN.md.Brand & Style`. This section owns the **behavioural rules** for microcopy.

**Guiding principle:** ClearLah speaks like a knowledgeable Singaporean friend who happens to be a health detective — warm, direct, occasionally uses "lah" naturally, never preachy or alarmist.

| Context | Tone | Example |
|---|---|---|
| Onboarding | Welcoming, assured, no Singlish | "Let's set up your personal trigger tracker. Takes less than 2 minutes." |
| Daily log prompt | Casual, conversational | "Hey Sarah 👋 How was your day? What did you eat?" |
| AI parse confirmation | Helpful, concise | "Got it — I've filled in what I heard. Double-check before saving, okay?" |
| Insight reveal | Empowering, data-forward | "Based on 14 days of your data, here's what I'm seeing…" |
| Insight explanation | Plain English, specific | "Flares hit most often when humidity's above 85% AND you've had shellfish within 8 hours." |
| Streak encouragement | Celebratory, personal | "🔥 7 days in a row! Your trigger map is getting clearer." |
| Below-threshold (< 7 days) | Patient, motivating | "4 more days to unlock your first trigger insight — you're doing great." |
| High Risk Day alert | Calm urgency, not alarmist | "Today's weather matches patterns linked to your flares. Worth taking it easy, lah." |
| Error states | Apologetic, actionable | "Something went wrong on our end. Try again in a sec?" |
| Medical disclaimer | Neutral, clear, always present | "ClearLah identifies patterns from self-reported data. Not a medical diagnosis. Always see your doctor." |

**Singlish rules:**
- Days 1–3: no Singlish — build trust first with quiet, assured language
- Day 4+: "lah" may appear in encouragement and casual prompts only — max 1 per session
- Never use Singlish in error states, disclaimers, or medical copy — ever
- No forced dialect beyond "lah" — avoid "lor", "mah", "sia" in UI copy
- Multilingual dish names (Chinese / Malay) are shown verbatim, never transliterated mid-sentence

---

## Component Patterns

> Visual specs (colours, sizing, radius, shadow) live in `DESIGN.md.components`. This section specifies **behaviour** only.

### Conversational Chat Interface (`/log`)

**Behaviour:**
- Opens with an adaptive greeting based on user tenure:
  - **Days 1–3 (question-first):** Direct, low-friction — "Good evening, Sarah. What did you have for meals today?" AI builds habit before personality.
  - **Day 4+ (observation-first):** Leads with a contextual note before asking — e.g. *"PSI is 98 today — worth noting. What did you eat?"* or *"You had a flare 3 days ago — how's your skin feeling tonight?"* AI earns its voice through data.
- User types in a single text input at the bottom; submits via Enter or Send button
- AI response appears within 1–2 seconds (skeleton bubble shown immediately)
- After AI parse, a **Pre-fill Card** expands below the chat thread — an editable form showing AI-extracted fields
- User reviews pre-fill card, edits any field, then taps "Confirm & Save"
- On save: chat shows "✓ Log saved", streak counter animates, form collapses
- Input field disabled during AI processing; re-enabled after response
- Keyboard pushes chat thread up (CSS `padding-bottom` = keyboard height via VisualViewport API)
- Chat history is session-only — does not persist across app sessions (each log opens fresh)

**Pre-fill card fields (collapsible sections):**

| Section | Fields | Edit type |
|---|---|---|
| 🍜 Food | Dish names, allergen tags | Tag-based input with free text |
| 💤 Lifestyle | Sleep hours, stress level (1–5), stress type | Slider + pill selector |
| 🧴 Skincare | Product names | Tag-based free text |
| 🩺 Symptoms | Skin / Gut / Respiratory severity (1–10) | Three sliders |
| ☁️ Weather | Auto-filled from NEA/mock | Read-only display with source badge |

**Smart suggestions:** If a user has logged the same dish on ≥ 3 of the last 7 same-weekday logs, a suggestion chip appears: "Add [dish]?" — tapping adds it to the pre-fill food section.

### Streak Counter

- Displayed as `{components.streak-badge}` on Dashboard header and as a micro-badge on the Log nav tab
- Increments only after a confirmed log save (not on AI parse)
- Milestone messages at: 3, 7, 14, 21, 30 days — full-screen modal celebration with confetti (CSS-only, 1.5s)
- Breaking a streak (no log for > 24h) resets counter to 0 with a gentle message: "Streak ended — no worries, start fresh today lah 💪"

### Insight Cards (`/insights`)

- Rendered as a scrollable vertical list of `{components.insight-card}` items
- Each card contains: trigger label (`h3`), confidence percentage (large `display` size), plain-English explanation (`body-lg`), pillar tags, and a "See evidence" disclosure toggle
- "See evidence" expands to show a compact timeline of 3–5 log dates that contributed to the correlation
- Cards sorted by `confidence_pct` descending
- Below-threshold state (< 7 days logged): no cards — show a progress section with days remaining and a streak progress ring (`{components.progress-ring}`)
- Loading state: 3 skeleton cards (grey shimmer animation)
- Empty state (7+ days, no correlations found): "Not enough patterns yet — keep logging and I'll keep looking, lah."

### Hawker Dish Safety Checker (`/hawker`)

- Single search input with debounced query (300ms) — triggers GET `/api/hawker?q=`
- Multilingual: accepts EN, Malay, Chinese queries; matches `name_en`, `name_ms`, `name_zh` and aliases
- Result card shows: dish name (all three languages), allergen tags, personal risk badge
- Personal risk badge derived from user's `trigger_cache`: if any confirmed trigger allergen appears in dish's `allergen_tags` → HIGH risk; if probable trigger allergen → MEDIUM; else SAFE
- "Save dish" action: bottom sheet with three options — ✅ Safe / ⚠️ Risky / ❌ Avoid — tapping saves immediately
- **After save:** Sheet dismisses; result card updates inline to show saved status badge; "My Food Guide" section auto-expands below the search field — user sees their growing guide without navigating away
- My Food Guide grouped by status (Avoid → Risky → Safe), most recently saved first within each group
- No search results → "No dish found — try searching in another language, or check the spelling?"

### Doctor Report (`/report`)

- Triggered by "Generate Report" CTA on `/insights` (only visible when ≥ 7 days logged)
- Report renders as a styled in-app view (not a new tab) before export
- Sections: Profile summary, Top 5 triggers with confidence, symptom trend chart (SVG sparkline), 14-day log timeline
- Medical disclaimer rendered in `{typography.scale.caption}` at the top AND bottom — not hideable
- Export options: "Download PDF" (`window.print()` with print-specific CSS) and "Copy shareable link" (future — shows "Coming soon" state for MVP)
- Print CSS: hides nav, footer, buttons; renders full-width single column; `page-break-inside: avoid` on each section

---

## State Patterns

### Global State Taxonomy

| State name | Trigger | UI Behaviour |
|---|---|---|
| `onboarding_complete` | User acknowledges disclaimer on final onboarding screen | Redirect to `/dashboard`; onboarding routes become inaccessible |
| `demo_mode` | `NEXT_PUBLIC_DEMO_MODE=true` | Yellow "Demo Mode" banner at top of every app-shell page; "Reset Demo" button in header |
| `below_threshold` | `log_entries.count < 7` | Insights page shows progress ring; Report CTA hidden; High Risk alert suppressed |
| `streak_active` | Last log within 24h | Streak badge visible with count |
| `streak_broken` | Last log > 24h ago | Badge resets; gentle message on next log open |
| `high_risk_day` | Live weather matches trigger profile | Banner appears on Dashboard; dismissed after 24h or user interaction |
| `ai_unavailable` | `/api/ai/*` returns 5xx or timeout | Template fallback used; toast: "AI is taking a breather — showing computed insights instead" |
| `weather_mock` | `USE_MOCK_WEATHER=true` OR NEA API fails | `WeatherSnapshot.source = 'mock'`; weather widget shows "(simulated)" label |

### Form States

Every form field follows:

```
Default → Focused → Filled → Validated (success/error) → Submitted (disabled)
```

- Focus ring: `{components.input.focus-border}` with `{elevation.focus-ring}`
- Error state: red border (`{colors.risk-high}`), inline error text in `body-sm` below field
- Success state: green border (`{colors.primary}`) on final validation
- Submitted (loading): field disabled, skeleton shimmer over value

### Async / Loading States

| Context | Skeleton pattern |
|---|---|
| AI parse response | Grey shimmer chat bubble (same shape as AI bubble) |
| Insight cards loading | 3 card-shaped grey shimmer blocks |
| Hawker search results | 2 result-card shimmer blocks |
| Weather widget | Single-line shimmer |
| Report generation | Full report skeleton renders immediately (4 section-shaped grey shimmer blocks), fills in section by section as data resolves — no loader screen |

All skeleton animations use CSS `@keyframes shimmer` (150ms cycle, 60% opacity low–high). No spinner icons.

### Empty States

Every list/collection surface has a defined empty state.

**Copy tone rule:** Empty states use quiet, assured language. No exclamation marks. No Singlish in the first 3 days — it unlocks progressively from Day 4 as the user becomes comfortable. White space replaces decorative illustrations.

| Surface | Empty state |
|---|---|
| Dashboard (no logs yet) | "Your trigger map starts here. Log Day 1 to begin." + CTA (no illustration — white space does the work) |
| Insights (< 7 days) | Progress ring, days remaining, encouragement copy |
| Insights (≥ 7 days, no patterns) | "No strong patterns yet — keep logging and I'll keep watching." |
| Hawker saved dishes | "No saved dishes yet. Search for a dish to get started." |
| Hawker search no results | "No match found — try another language or spelling?" |

---

## Interaction Primitives

### Touch & Tap

- All interactive targets: minimum `44 × 44px` (WCAG 2.5.5)
- Tap feedback: `active:scale-95` on buttons (CSS transform, 100ms ease); no ripple effect
- Swipe-to-dismiss on toasts (horizontal swipe > 80px threshold)
- Long-press on insight card → haptic feedback + share sheet (mobile only, progressive enhancement)

### Gestures

| Gesture | Component | Behaviour |
|---|---|---|
| Pull-to-refresh | Dashboard, Insights | Re-fetches weather + re-checks high risk status |
| Swipe left on saved dish | My Food Guide list | Reveals "Remove" action button (red, 44px wide) |
| Swipe down | Bottom sheet modal | Dismisses sheet |

### Animations

All animations use `ease-in-out`. Transitions: `180ms`. Micro-interactions: `120ms`. See `DESIGN.md.motion` for tokens.

| Element | Animation | Duration |
|---|---|---|
| Page transition | Slide-up (new page) / slide-down (back) | 180ms |
| New streak badge | Scale 1.0 → 1.15 → 1.0 | 120ms |
| AI bubble appear | Fade in + translate-Y(-4px → 0) | 180ms |
| Pre-fill card expand | Height 0 → auto with `overflow: hidden` | 180ms |
| Insight card enter | Fade + stagger (40ms per card) | 180ms base |
| Toast | Slide-in from bottom | 180ms |
| Milestone modal | Fade in backdrop, scale card 0.92 → 1.0 | 180ms |

**Reduced motion:** All animations suppressed when `prefers-reduced-motion: reduce` is set. State changes still occur — only motion is removed.

### Toast Notifications

- Position: bottom-center, above bottom nav
- Duration: 3s auto-dismiss (errors: 5s, persistent)
- Types: success (green left border), warning (orange left border), error (red left border), info (neutral left border)
- Maximum 1 toast visible at a time; queue subsequent toasts

---

## Accessibility Floor

> Colour contrast ratios live in `DESIGN.md.Colors`. This section owns **behavioural accessibility**.

### Requirements (WCAG 2.1 AA minimum)

- **Keyboard navigation:** All interactive elements reachable and operable via Tab/Enter/Space/Arrow keys
- **Focus management:** Modals and bottom sheets trap focus; focus returns to trigger element on close
- **Screen reader labels:** All icon-only buttons have `aria-label`; all form inputs have `htmlFor`/`aria-describedby` associations; pillar tags have `role="status"` where dynamically updated
- **Live regions:** Streak counter uses `aria-live="polite"`; High Risk Day banner uses `aria-live="assertive"`; toast notifications use `role="status"`
- **Error identification:** Form errors announced via `aria-live="assertive"` and linked to field via `aria-describedby`
- **Language declaration:** `<html lang="en-SG">` at root; inline Chinese content wrapped in `<span lang="zh-Hans">`, Malay in `<span lang="ms">`
- **Touch targets:** All interactive elements ≥ 44×44px (enforced via Tailwind `min-h-[44px] min-w-[44px]`)
- **Colour-only information:** Risk levels (High/Medium/Safe) communicated via label text AND icon AND colour — never colour alone
- **Medical disclaimer:** Always visible in DOM (not behind a toggle); never `display:none`

### Known Limitations (MVP)

- PDF export via `window.print()` is not screen-reader optimised — annotated as post-hackathon
- Chart (symptom trend sparkline) has `aria-label` describing the trend in text — no full table fallback in MVP

---

## Key Flows

### Flow 1 — First Setup (Sarah, 28, marketing exec, has eczema)

Sarah lands on ClearLah for the first time, referred by a friend.

1. **Screen 1 — Welcome:** Hero: "Know your triggers. Live without limits." Below: "What's your main concern?" Four pill options: **Eczema / Rhinitis / Asthma / Other**. Sarah taps Eczema. ClearLah silently personalises all skin copy (e.g. symptom pillar becomes "Skin flares"). Primary CTA: "Let's go →"
2. **Screen 2 — Medical disclaimer:** Full-screen warm-white card: "ClearLah identifies patterns from self-reported data. It does not provide medical diagnoses. Always consult a qualified doctor before making health decisions." Single CTA: "I understand — let's go". Cannot be swiped or skipped.
3. **Dashboard — Day 1:** Sarah lands on her personalised dashboard. Greeting: "Hey Sarah 👋 Day 1 — let's start finding those triggers." Demo streak badge visible. CTA: "Log your first day".
4. **Log — Day 1 (progressive disclosure):** AI greets and logs first entry. Mid-conversation, AI gently asks: "Mind if I use Singapore weather data? Saves you logging it manually." Location permission requested in-context.
5. **Log — Day 2:** After log, AI asks one question: "Do you have any known food allergies I should watch for?"
6. **Log — Day 3:** After log, AI asks: "Any skincare products you use daily?" Profile now complete.

*Climax beat:* The moment Sarah taps "I understand — let's go" on the disclaimer — she has committed. The dashboard opens in 2 taps from cold open. The journey begins.  
*Progressive disclosure:* No trigger list, no weather permission screen, no explainer slide — everything surfaces naturally through the first 3 days of logging.

---

### Flow 2 — Daily Log via Conversational AI (Sarah, Day 4)

Sarah opens ClearLah after dinner, tired but remembers to log.

1. **Quick entry trigger:** Dashboard shows "Log today" CTA + ambient reminder: "Day 4 — 3 more to unlock your first insight 🔒". Sarah taps the Log tab.
2. **Chat opens:** AI greets her: "Hey Sarah 🌙 How was your day? What did you eat?" (Evening greeting because it's after 7pm).
3. **Sarah types:** "Had laksa for lunch, quite stressed from work, skin a bit itchy tonight"
4. **AI processes:** Skeleton bubble appears (1.2s). AI responds: "Got it — sounds like a tough one. Let me fill this in for you." Pre-fill card expands below.
5. **Pre-fill card:** Food: [Laksa, shellfish, gluten, coconut milk] ✅ auto-tagged. Stress: Level 4, "Work". Symptoms: Skin 6/10 auto-inferred from "itchy". Skincare: empty. Weather: Auto-filled — 29°C, 82% humidity, PSI 45, UV 7.
6. **Smart suggestion chip:** "You usually log Chicken Rice on weekdays — add it?" Sarah taps No.
7. **Sarah edits:** She adjusts Skin symptom to 7/10 (was slightly worse than AI estimated) and adds "Cetaphil moisturiser" to skincare.
8. **Confirm & Save:** Sarah taps. Save animation plays. Streak badge updates: "🔥 4 days in a row!" Chat shows "✓ Log saved for today."
9. **Return to dashboard:** Streak now shows 4. Progress ring: "3 more days to unlock your first insight."

*Climax beat:* The streak animation — seeing "🔥 4 days in a row!" — is the dopamine moment that drives Sarah back tomorrow.

---

### Flow 3 — First Trigger Insight Unlock (Sarah, Day 8)

Sarah wakes up, opens ClearLah, logs Day 8. Then taps "Insights".

1. **Insights tab (below threshold yesterday):** Now at 8 days, threshold crossed. Animation: progress ring completes, confetti burst, "🎉 Your first trigger insights are ready!"
2. **Insight cards appear:** Three cards, ordered by confidence:
   - **Card 1 — 74% confidence:** "Shellfish + High Humidity" — "Flares occur most often when humidity is above 82% AND you've eaten shellfish in the last 8 hours. These two together appeared before 6 of your 8 flare days." Pillars: `food`, `weather`.
   - **Card 2 — 61% confidence:** "Work Stress + Poor Sleep" — "On days when stress was Work-related AND sleep was under 6.5 hours, skin severity averaged 6.8/10 — vs 3.1/10 on other days." Pillars: `lifestyle`.
   - **Card 3 — 44% confidence:** "Cetaphil Moisturiser" — "You logged Cetaphil on 3 of 5 flare evenings. More data needed to confirm — keep logging." Pillars: `skincare`.
3. **"See evidence" on Card 1:** Expands to show 6 dated entries with shellfish + high humidity + flare.
4. **Sarah scrolls down:** Sees "Generate Doctor Report" CTA.

*Climax beat:* Reading "74% confidence — Shellfish + High Humidity." Three years of mystery — condensed into one number. This is the product's core promise, delivered.

---

### Flow 4 — Hawker Safety Check (Wei Ming, father, son has allergies)

Wei Ming is at a hawker centre with his son. Opens ClearLah at the stall.

1. **Hawker tab:** Search input focused immediately. Wei Ming types "炒粿条" (Char Kway Teow in Chinese).
2. **Instant results:** Card appears — "Char Kway Teow / Char Koay Teow / 炒粿条". Allergens: 🦐 Shellfish, 🥚 Eggs, 🌾 Gluten.
3. **Personal risk badge:** RED — "High Risk — contains shellfish (confirmed trigger)".
4. **Wei Ming saves it:** Taps "Save dish" → Bottom sheet: ✅ Safe / ⚠️ Risky / ❌ Avoid. Taps ❌ Avoid. Sheet dismisses; card updates inline with ❌ Avoid badge; My Food Guide section auto-expands below search — Char Kway Teow visible under Avoid immediately.
5. **Wei Ming types "chicken rice":** Results: 🍗 Chicken Rice / Nasi Ayam / 鸡饭. Allergens: none flagged. Risk badge: GREEN — "Looks safe based on your profile."
6. **Wei Ming saves:** Taps ✅ Safe. Card updates inline; Chicken Rice appears under Safe in My Food Guide — both dishes visible without any navigation.
7. **My Food Guide (inline):** Wei Ming sees his growing guide directly below search. He can reference it at any future hawker visit from the same screen.

*Climax beat:* The moment the green "Looks safe" badge appears for Chicken Rice — Wei Ming can order without anxiety for the first time.

---

### Flow 5 — Doctor Visit Prep (Sarah, Day 14)

Sarah has a dermatologist appointment tomorrow. She opens ClearLah to prepare.

1. **Insights tab:** Taps "Generate Doctor Report" — available because she has 14 days of data.
2. **Report skeleton:** Full report layout renders instantly as 4 shimmer blocks (Profile / Top Triggers / Symptom Trend / Log Timeline) in correct positions. No spinner, no loader screen. Perceived wait: zero.
3. **Sections fill in sequentially:** Profile → Top Triggers → Symptom Trend → Log Timeline, each fading in (`180ms ease-in-out`) as data resolves. Disclaimer banner (top) always visible first: "Patient-reported data summary — not a medical diagnosis."
4. **Report sections (filled):**
   - *Profile:* Sarah, 28, tracking for Eczema since Day 1
   - *Top Triggers:* 5 items, ranked by confidence, each with plain-English description
   - *Symptom Trend:* SVG sparkline showing daily skin severity over 14 days
   - *Log Timeline:* 14 rows — date, key food, stress, skincare, symptoms, weather
5. **Disclaimer footer:** "Always consult a qualified doctor. This data was self-reported using ClearLah."
6. **Download PDF:** Taps. Print dialogue opens. Sarah saves as PDF. Takes it to her appointment.

*Climax beat:* Handing the printed report to her dermatologist — and the doctor saying "This is actually very useful." The product has changed the clinical conversation.

---

## Singapore-Specific Considerations

### Multilingual Input
- All text inputs accept Unicode (CJK + Malay diacritics) natively
- Hawker search: fuzzy match across three language columns simultaneously
- AI log parser prompt explicitly instructed to handle Singlish and Chinese/Malay food names (e.g. "teh tarik", "nasi lemak", "mee goreng")
- Dish name display: always show all available language variants (EN / Malay / Chinese) together

### NEA Weather Integration
- Weather widget on Dashboard shows: temperature, humidity, PSI, UV index
- PSI displayed with contextual label: Good (0–50) / Moderate (51–100) / Unhealthy (101–200) / Hazardous (201+)
- High humidity (>85%) highlighted in amber — linked to eczema and respiratory triggers in insight explanations
- Source badge: "Live NEA data" (green) or "Simulated" (grey) — always visible, never hidden

### Cultural Sensitivity
- "High Risk Day" copy avoids alarm; uses "worth taking it easy" framing — not "danger" or "warning"
- Skincare pillar phrasing: "skincare products" not "cosmetics" — includes medicated creams, sunscreens used commonly in Singapore's climate
- Food icons use locally recognisable illustrations where possible (bowl of rice, prawn, coconut)
- Streak and milestone copy uses mild Singlish affirmations — never dialect insults or coarse language

---

## Responsive & Platform Behaviour

| Breakpoint | Width | Behaviour |
|---|---|---|
| Mobile (default) | 375–480px | Single column; bottom nav; full-width cards; floating keyboard handling |
| Phablet | 481–640px | Same as mobile; max-content-width: 480px centred |
| Tablet | 641–768px | Same layout; bottom nav persists; slightly larger card padding |
| Desktop (not targeted for MVP) | 769px+ | No layout change; centred 480px column; bottom nav visible |

**Safe area insets:** Applied via `env(safe-area-inset-*)` for notch devices (iPhone X+, recent Android).

**Keyboard avoidance:** Chat input uses `VisualViewport` API to shift content above keyboard. Fallback: `position: fixed; bottom: 0` with `padding-bottom: keyboardHeight`.

**Offline resilience:** If network drops mid-log, the confirmed form data is saved to `sessionStorage`. On reconnect, a toast prompts: "Log not saved — try again?" with a one-tap retry. No silent data loss.

---

*Visual identity: `DESIGN.md`*
*Architecture: `ClearLah-Architecture-Spine.md`*
*Product requirements: `ClearLah-PRD.md`*
*Owner: UX (bmad-ux)*
*Next: Hand to Amelia (Dev) alongside Architecture Spine for implementation*
