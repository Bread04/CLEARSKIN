# ClearLah — Implementation Readiness Assessment Report

**Date:** 7 August 2026
**Project:** ClearLah — AI Trigger Detection for Singapore
**Scope:** PRD v2.0 + Architecture Spine (partial IR — no Epics/Stories doc, no UX doc)
**Assessor:** Winston (Architect Agent)

---

## Executive Summary

| Dimension | Status | Score |
|---|---|---|
| PRD Completeness | ✅ READY | 9/10 |
| Architecture Completeness | ✅ READY | 8/10 |
| PRD ↔ Architecture Alignment | ⚠️ GAPS | 6/10 |
| Story Coverage | ❌ NOT ASSESSED | — |
| UX / Design Coverage | ❌ NOT ASSESSED | — |

**Overall: CONDITIONALLY READY** — clear to begin implementation with 4 items that must be resolved before or during Day 2. No blockers that prevent starting. All gaps are bridgeable within the build plan.

---

## Dimension 1: PRD Completeness

**Score: 9/10 — READY**

### What's solid
- Vision, problem statement, and JTBD are crisp and unambiguous
- All 12 MVP features are listed with P0/P1 priority
- 5 user journeys are fully narrated with step-by-step flows
- 23 user stories across 5 epics with acceptance criteria
- Risk register with mitigations present
- Demo script with timestamps — directly usable on Day 7
- Success metrics are defined and measurable
- 7-day build plan with daily focus areas and critical actions

### Gaps found

| ID | Gap | Severity | Recommendation |
|---|---|---|---|
| PRD-G1 | Auth is listed as "optional for MVP — demo without login" but Supabase (AD-3) requires a `user_id` for every log entry. Who is the demo user? How is `user_id` assigned without auth? | 🔴 HIGH | Define a fixed demo `user_id` constant (e.g. `DEMO_USER_ID = "demo-user-001"`). Clarify in PRD whether real users need auth before the hackathon deadline or not. |
| PRD-G2 | E2-7 "Smart meal suggestions based on past logs" — the acceptance criteria is vague. What does "suggest" mean technically? A prompt, a pre-filled form field, a dedicated screen? | 🟡 MEDIUM | Clarify AC: "If same day-of-week food detected in past 3 logs, show a confirmation chip pre-filled with that dish." |
| PRD-G3 | E5-3 "Export or share the report" — both PDF export and shareable URL are listed. These are very different in complexity (PDF = Day 5 risk; shareable URL = requires either public routes or auth tokens). | 🟡 MEDIUM | Per the architecture's deferred decision, commit to `window.print()` CSS for MVP. Strike "shareable URL" from MVP scope entirely or de-risk it to P2. |
| PRD-G4 | "Progressive insights from Day 1" (P0, feature #7) is described in Journey 3 but there is no user story in Epic 3 that covers the Day 1–6 encouragement state. E3-1 touches it but the AC only says "X days logged" message — not what the partial signals look like. | 🟡 MEDIUM | Add an acceptance criterion to E3-1: "Days 1–6: show streak counter + earliest available single-pillar signal if ≥ 2 data points exist (e.g. 'You logged shellfish on both days your skin flared.')" |
| PRD-G5 | Technical requirement says "Local/session storage sufficient for MVP demo" but architecture chose Supabase (AD-3). PRD is now outdated. | 🟡 MEDIUM | Update PRD Section 7 Technical Requirements to reflect Supabase as data store. One-line fix. |

---

## Dimension 2: Architecture Completeness

**Score: 8/10 — READY**

### What's solid
- All 6 architecture decisions are documented with binding rules and prevention statements
- Boundary and dependency rules are explicit — no ambiguity about what can call what
- State mutation rules prevent dual-write bugs
- 3 shared data contracts (`LogEntry`, `CorrelationResult`, `WeatherSnapshot`) are typed
- Deferred decisions are tracked with revisit conditions
- Open questions are flagged as blockers

### Gaps found

| ID | Gap | Severity | Recommendation |
|---|---|---|---|
| ARCH-G1 | `FoodItem` and `LifestyleEntry` type definitions are referenced in `LogEntry` but not defined in the spine. Amelia will make these up inconsistently across components. | 🔴 HIGH | Add to spine immediately: `type FoodItem = { dish_id?: string; name: string; quantity?: string; allergen_tags: string[] }` and `type LifestyleEntry = { sleep_hours: number; stress_level: 1\|2\|3\|4\|5; stress_type: 'Work'\|'Relationship'\|'Physical'\|'Financial'\|'Other' }` |
| ARCH-G2 | `SymptomEntry` is referenced in `LogEntry` but not defined. | 🔴 HIGH | Add: `type SymptomEntry = { skin: number; gut: number; respiratory: number }` (each 1–10, matching PRD E2-5). |
| ARCH-G3 | Auth strategy is deferred but a `user_id` appears in every data contract. If auth is absent at demo time, nothing can be read or written without a hardcoded user. The deferred decision needs a concrete fallback rule. | 🔴 HIGH | Add to spine: "If `NEXT_PUBLIC_DEMO_MODE=true`, all API routes use `DEMO_USER_ID='demo-user-001'` and skip auth checks. This is the default state for the hackathon demo." |
| ARCH-G4 | The pattern engine's minimum data threshold (7 days per PRD Journey 3) is not defined in the spine. Amelia will guess. | 🟡 MEDIUM | Add to AD-4: "Pattern engine requires minimum 7 `LogEntry` rows before producing `CorrelationResult[]`. Below threshold, return `{ insufficient_data: true, days_remaining: N }`." |
| ARCH-G5 | High Risk Day alert (PRD E3-4, P1) has no architectural definition. Which route produces it? How is it triggered? Is it computed on page load or on a schedule? | 🟡 MEDIUM | Add route: `GET /api/insights/risk-today` — fetches today's `WeatherSnapshot` + cached `trigger_cache`, checks if conditions match ≥1 confirmed trigger. Returns `{ high_risk: boolean, matched_triggers: string[] }`. Called on dashboard page load. |
| ARCH-G6 | Supabase Auth is deferred but `users` table is in the seed. If the demo runs without auth, the `users` table is unused and may confuse Amelia. | 🟠 LOW | Clarify in spine: for MVP demo, the `users` table is pre-populated with a single demo user row. No auth flow is implemented. Users table exists for post-hackathon auth integration only. |

---

## Dimension 3: PRD ↔ Architecture Alignment

**Score: 6/10 — GAPS**

This is the most important section — these are places where the PRD requires something that the architecture does not yet address.

| ID | PRD Requirement | Architecture Coverage | Gap |
|---|---|---|---|
| ALN-1 | E3-4: "High Risk Day" proactive alert | ❌ No route defined | See ARCH-G5 — needs `/api/insights/risk-today` |
| ALN-2 | E2-7: Smart meal suggestions | ❌ No architectural definition | Needs a `GET /api/logs/suggestions?day_of_week=X` route that returns past dishes logged on the same day of week |
| ALN-3 | E1-1 to E1-5: Onboarding flow — conditions selector, location grant, disclaimer acknowledgement | ⚠️ Partially covered | `user_profiles` table exists but no onboarding API routes or state machine defined. Add `POST /api/onboarding` that creates the user profile with conditions and triggers the first weather pull. |
| ALN-4 | E2-8: Logging streak + motivational messages | ❌ No architectural definition | Streak count needs to be a derived field. Add `streak_count` to `user_profiles` or compute it in `GET /api/logs/streak` from the log entry dates. |
| ALN-5 | PRD Section 9 Demo Script requires a live Hawker Decoder at demo time with personalised risk score | ⚠️ Architecture defines hawker tables and `/api/hawker` route — but no personalised risk score computation is defined | Risk score = cross-reference dish `allergen_tags` against `user_profiles.trigger_cache`. Define this computation rule in the spine. |
| ALN-6 | PRD requires "multilingual search (EN/Malay/Chinese)" for hawker dishes | ⚠️ Spine mentions multilingual aliases in seed.sql but no search strategy defined | Define: `GET /api/hawker?q=` uses Supabase `ilike` across `name_en`, `name_ms`, `name_zh` columns. Document this in the spine. |
| ALN-7 | PRD requires PDF export (P1, E5-3) | ⚠️ Deferred in architecture with a conditional — but no fallback is committed | Per deferred table: commit to `window.print()` CSS approach for MVP. Add print-specific CSS stylesheet to the folder structure. |
| ALN-8 | PRD technical requirement: "Auth optional for MVP — demo without login" | ❌ Architecture contradicts this — Supabase writes require user_id but no demo mode bypass is defined | Critical: resolve with ARCH-G3 fix (demo mode env flag + hardcoded demo user). |

---

## Dimension 4: Story Coverage

**❌ NOT ASSESSED — No Epics & Stories document found.**

The PRD contains epics and stories inline (Section 6), but no standalone stories document with full context, acceptance criteria, implementation notes, and test cases exists. This is the expected next step.

**Impact:** Amelia (Dev) will need to read the entire PRD to extract implementation details for each story. High risk of misinterpretation or missed acceptance criteria.

**Recommended action:** Run `bmad-create-epics-and-stories` immediately after this IR check to produce the full stories backlog.

---

## Dimension 5: UX / Design Coverage

**❌ NOT ASSESSED — No UX document found.**

No screen flows, wireframes, or UX specification document exists.

**Impact on implementation:**
- Amelia will make visual and interaction decisions ad hoc — inconsistent UI is likely
- The demo script references specific UI moments ("conversational prompt", "streak counter", "High Risk Day banner") that are not designed
- Risk of building the wrong thing for the most judge-visible moments

**Recommended action:** Before Day 3 (9 Aug — Onboarding + Conversational Logging UI), produce at minimum:
- Screen inventory (list of all screens)
- Navigation flow diagram
- Description of the 3 highest-visibility demo moments: conversational log input, trigger insight cards, High Risk Day banner

This does not need to be a full wireframe set — even a written UX spec covering these 3 moments reduces implementation risk significantly.

---

## Priority Action List

Ordered by severity and day-of-build relevance:

### 🔴 Must fix before Day 2 coding starts

| # | Action | Owner | File to update |
|---|---|---|---|
| 1 | **Resolve auth / demo user gap (PRD-G1, ARCH-G3, ALN-8)** — add `DEMO_USER_ID` constant and `NEXT_PUBLIC_DEMO_MODE` env flag to spine. Add demo user bypass to all API routes. | Winston | `ClearLah-Architecture-Spine.md` |
| 2 | **Define missing type contracts (ARCH-G1, ARCH-G2)** — add `FoodItem`, `LifestyleEntry`, `SymptomEntry` to spine's Shared Data Contracts section. | Winston | `ClearLah-Architecture-Spine.md` |
| 3 | **Define pattern engine threshold (ARCH-G4)** — minimum 7 entries, return `insufficient_data` below threshold. | Winston | `ClearLah-Architecture-Spine.md` |

### 🟡 Must fix before the relevant build day

| # | Action | Day | File to update |
|---|---|---|---|
| 4 | **Add `/api/insights/risk-today` route definition (ARCH-G5, ALN-1)** | Day 4 | `ClearLah-Architecture-Spine.md` |
| 5 | **Add `/api/logs/suggestions` route definition (ALN-2)** | Day 3 | `ClearLah-Architecture-Spine.md` |
| 6 | **Add `/api/onboarding` route definition (ALN-3)** | Day 3 | `ClearLah-Architecture-Spine.md` |
| 7 | **Add streak computation rule (ALN-4)** | Day 3 | `ClearLah-Architecture-Spine.md` |
| 8 | **Define hawker risk score computation (ALN-5)** | Day 4 | `ClearLah-Architecture-Spine.md` |
| 9 | **Define hawker multilingual search strategy (ALN-6)** | Day 4 | `ClearLah-Architecture-Spine.md` |
| 10 | **Commit PDF export approach — `window.print()` (ALN-7, PRD-G3)** | Day 5 | Both docs |
| 11 | **Update PRD Section 7 to reflect Supabase (PRD-G5)** | Before Day 2 | `ClearLah-PRD.md` |
| 12 | **Clarify E3-1 partial signals AC (PRD-G4)** | Before Day 4 | `ClearLah-PRD.md` |

### 🟠 Nice to fix

| # | Action |
|---|---|
| 13 | Clarify E2-7 smart suggestions AC (PRD-G2) |
| 14 | Clarify demo user / users table intent in spine (ARCH-G6) |

---

## Open Questions (from Architecture Spine — still unresolved)

| # | Question | Blocker? | Due |
|---|---|---|---|
| OQ-1 | CodeBuddy AI API — SDK or REST? Auth header format? | Yes | Day 2 morning |
| OQ-2 | NEA API endpoint URL — confirm and test CORS | Yes | Day 2 morning |
| OQ-3 | Supabase project created? Credentials available? | Yes | Day 2 morning |

---

## Recommended Next Steps (in order)

1. **Now (Day 1 evening):** Apply the 3 red-priority fixes to `ClearLah-Architecture-Spine.md`
2. **Day 2 morning:** Resolve OQ-1, OQ-2, OQ-3 before any coding
3. **Day 2:** Run `bmad-create-epics-and-stories` to produce the full stories backlog for Amelia
4. **Before Day 3:** Produce a minimal UX spec covering the 3 highest-visibility demo screens
5. **Day 3:** Hand off to Amelia (Dev) with: Spine + Stories + minimal UX spec

---

*Assessor: Winston (Architect Agent)*
*Scope: PRD v2.0 + Architecture Spine — partial IR (no Epics/Stories doc, no UX doc)*
*Next full IR check: recommended after stories are created*
