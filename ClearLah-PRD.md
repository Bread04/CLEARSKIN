# ClearLah — Product Requirements Document (PRD)

**Version:** 2.0
**Date:** 7 August 2026
**Deadline:** 14 August 2026, 6:00 PM
**Platform:** CodeBuddy
**Track:** Life Agent — Tencent Hackathon Singapore
**Last Updated:** Advanced Elicitation v2 — Pre-mortem, Shark Tank, Focus Group, First Principles, Assumption Audit

---

## 1. Product Overview

### Vision
ClearLah is an AI-powered allergy and intolerance trigger detection agent for Singaporeans — the first tool that correlates food, lifestyle, skincare, auto-pulled Singapore weather data, and symptoms together to surface personalised trigger insights through a conversational AI interface.

### Tagline
> *"Know your triggers. Live without limits, lah."*

### Problem Statement
Singaporeans suffering from eczema, food allergies, IBS, and asthma spend months or years identifying their triggers through guesswork. Existing apps are Western-centric, track food only, and lack AI pattern detection. ClearLah solves this by capturing all five trigger pillars and letting AI do the correlation work — through a conversational interface that feels like talking to a personal health detective, not filling in a form.

### Core Job To Be Done
> *"Help me stop suffering without needing to become a medical expert."*

### Target Users
- **Primary:** Adults 20–40 in Singapore with eczema, food allergies, or IBS
- **Secondary:** Parents managing allergic children; asthma sufferers

### Medical Disclaimer *(visible in UI and all reports)*
> ClearLah identifies patterns from self-reported data. It does not provide medical diagnoses. Always consult a qualified doctor before making health decisions.

---

## 2. Goals & Success Metrics

| Goal | Metric | Target |
|---|---|---|
| Reduce trigger ID time | Weeks to first insight | < 3 weeks (vs 12–36 months baseline) |
| Reduce logging friction | Daily log completion time | < 3 minutes/day |
| Improve doctor visits | % users who generate report | > 70% of active users |
| Drive retention | 7-day logging streak rate | > 60% of users |
| Demo impact | Judges score UX dimension | 9/10 target |

---

## 3. Scope — MVP vs Out of Scope

### ✅ IN SCOPE (Must ship by 14 Aug)

| # | Feature | Priority |
|---|---|---|
| 1 | Personalised onboarding flow (with "tracking for" selector) | P0 |
| 2 | Conversational AI logging ("tell me how you feel today") | P0 |
| 3 | Daily log dashboard — 5 pillars: Food + Lifestyle + Skincare + Symptoms + Weather | P0 |
| 4 | Auto NEA weather integration (with mock fallback) | P0 |
| 5 | AI multi-variable pattern detection engine | P0 |
| 6 | Hawker Dish Risk Scorer (80+ dishes, multilingual search) | P0 |
| 7 | Progressive insights from Day 1 | P0 |
| 8 | Medical disclaimer throughout UI | P0 |
| 9 | Pre-seeded demo account (14 days realistic data) | P0 |
| 10 | "High Risk Day" proactive alert | P1 |
| 11 | Doctor-ready trigger summary report | P1 |
| 12 | Smart meal suggestions + logging streak | P1 |

### ❌ OUT OF SCOPE (Post-hackathon)
- Native mobile app (iOS/Android)
- Community trigger crowd-sourcing
- Photo-based ingredient scanner
- Clinic API integration
- Multi-profile management (family accounts)

---

## 4. User Personas

### Persona 1 — "Struggling Sarah"
- 28-year-old marketing exec in Singapore
- Has had eczema since childhood, flares unpredictably
- Eats hawker food 2x daily, works long stressful hours
- Has tried elimination diets but gave up — too unstructured
- Changed skincare products recently, unsure if that's a factor
- **Goal:** Finally understand what's causing her flares — without becoming a medical expert

### Persona 2 — "Worried Parent Wei Ming"
- 38-year-old father, son has food allergies
- Anxious every time they eat out at hawker centres
- Searches hawker dishes in Chinese and Malay, not just English
- **Goal:** Know which dishes are safe for his son, tracked separately

---

## 5. User Journeys

### Journey 1 — First-Time Setup
```
Land on ClearLah
    → Onboarding: "Who are you tracking for?" (Yourself / Child / Someone else)
    → Select conditions (eczema / IBS / food allergy / asthma / other)
    → ClearLah personalises tracking pillars based on condition
    → Grant location for auto weather pull
    → See brief explainer: "A trigger is anything that causes
      your symptoms to flare"
    → Complete first log entry
    → Dashboard ready with Day 1 encouragement message
```

### Journey 2 — Daily Logging via Conversational AI (< 3 min)
```
Open ClearLah
    → Conversational prompt: "Hey Sarah, how are you feeling today?
      What did you eat?"
    → User types naturally: "Had laksa for lunch, quite stressed
      from work, skin a bit itchy tonight"
    → AI parses and auto-fills: Food ✅ Stress ✅ Symptoms ✅
    → User confirms/edits pre-filled form
    → Weather auto-filled from NEA API
    → Smart suggestion: "You usually log Chicken Rice on weekdays
      — add it?"
    → Submit → AI processes in background
    → Streak counter updated: "🔥 3 days in a row!"
```

### Journey 3 — Progressive Insights (Day 1 onwards)
```
Day 1–6:
    → Encouraging messages: "3 days logged! Early patterns
      forming — keep going to unlock your first insight"
    → Partial signals shown where data allows

Day 7+:
    → AI surfaces: "Top 3 suspected triggers"
    → Multi-variable correlation: "Flares occur most often
      when humidity > 85% AND shellfish logged within 8hrs
      AND sleep < 6hrs — any 2 of these 3 together
      increases flare risk by 73%"
    → Confidence level per trigger
    → "High Risk Day" banner: live weather matches profile
```

### Journey 4 — Hawker Dish Check
```
User types dish name (English / Malay / Chinese)
    → ClearLah shows common allergens in dish
    → Personal risk score based on user's trigger profile
    → User saves dish as Safe / Risky / Avoid
    → Saved list builds into personal Safe Food guide
```

### Journey 5 — Doctor Visit Prep
```
User requests report
    → ClearLah generates summary:
      top triggers, confidence levels,
      symptom trend chart, evidence timeline
    → Labelled: "Patient-reported data summary —
      not a medical diagnosis"
    → Exportable as PDF / shareable link
```

---

## 6. Epics & User Stories

### Epic 1: Onboarding

| ID | User Story | Acceptance Criteria |
|---|---|---|
| E1-1 | As a new user, I select who I am tracking for | Options: Myself / My child / Someone else |
| E1-2 | As a new user, I declare my conditions to personalise tracking | Conditions: eczema, IBS, food allergy, asthma, other. Completion < 2 min |
| E1-3 | As a new user, I grant location access for auto weather | NEA API pulls on grant; mock/manual fallback if denied |
| E1-4 | As a new user, I see a plain-English explainer of what a "trigger" is | Single screen; skippable |
| E1-5 | As a new user, I see the medical disclaimer before first log | Cannot be skipped; must acknowledge |

### Epic 2: Daily Logging

| ID | User Story | Acceptance Criteria |
|---|---|---|
| E2-1 | As a user, I can describe my day in natural language and AI auto-fills my log | AI parses food, mood, symptoms from free text; user confirms |
| E2-2 | As a user, I can log meals with hawker shortcuts or manual entry | 80+ dishes pre-loaded; multilingual search (EN/Malay/Chinese) |
| E2-3 | As a user, I can log sleep, stress type and level in < 30 seconds | Sleep: numeric; Stress: 1–5 + type tag (Work/Relationship/Physical/Financial/Other) |
| E2-4 | As a user, I can log skincare products and topical applications | Free-text + common product suggestions |
| E2-5 | As a user, I can log symptom severity per body system | Skin, gut, respiratory each rated 1–10 |
| E2-6 | As a user, weather is automatically logged for my location | NEA API: temp, humidity, PSI, UV; mock data fallback if API unavailable |
| E2-7 | As a user, I see smart meal suggestions based on past logs | "You usually eat X on weekdays — log it?" |
| E2-8 | As a user, I see my logging streak and a motivational message | Streak counter; Day 1 encouragement; milestone messages |

### Epic 3: AI Pattern Detection

| ID | User Story | Acceptance Criteria |
|---|---|---|
| E3-1 | As a user, I see encouraging progress messages from Day 1 | "X days logged — keep going!" with partial early signals |
| E3-2 | As a user, I can view my top suspected triggers after 7 days | Ranked list with confidence %; multi-variable correlations shown |
| E3-3 | As a user, I see correlations explained in plain English | e.g. "Flares peak when humidity > 85% + shellfish + sleep < 6hrs" |
| E3-4 | As a user, I receive a "High Risk Day" alert when live conditions match my profile | Banner/notification; based on NEA live data + trigger profile |

### Epic 4: Hawker Dish Risk Scorer

| ID | User Story | Acceptance Criteria |
|---|---|---|
| E4-1 | As a user, I search hawker dishes in English, Malay, or Chinese | 80+ dishes; multilingual aliases (e.g. Char Kway Teow / 炒粿条) |
| E4-2 | As a user, I see common allergens for each dish | Allergen tags per dish (shellfish, gluten, nuts, dairy, eggs, etc.) |
| E4-3 | As a user, I see a personalised risk score per dish | Score derived from my confirmed trigger profile |
| E4-4 | As a user, I save dishes as Safe / Risky / Avoid | Persisted to profile; shown on future searches |

### Epic 5: Trigger Report

| ID | User Story | Acceptance Criteria |
|---|---|---|
| E5-1 | As a user, I generate a trigger summary report | Top 5 triggers, confidence levels, symptom trend, evidence timeline |
| E5-2 | As a user, the report includes the medical disclaimer | "Patient-reported data summary — not a medical diagnosis" |
| E5-3 | As a user, I can export or share the report | PDF export or shareable URL |

---

## 7. Technical Requirements

| Requirement | Detail |
|---|---|
| Platform | Web app (mobile-responsive) — no install required for demo |
| AI Engine | CodeBuddy AI — conversational logging parser + pattern detection |
| Weather API | NEA Singapore (free, public API) — humidity, temp, PSI, UV. **Verify access on Day 1. Build mock fallback.** |
| Hawker DB | Pre-seeded dataset of 80+ Singapore hawker dishes + allergens + multilingual aliases |
| Demo Data | Pre-seeded demo account with 14 days of realistic log data for demo purposes |
| Data Storage | Local/session storage sufficient for MVP demo |
| Auth | Optional for MVP — demo without login |

---

## 8. Risk Register & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| NEA API inaccessible during demo | Medium | High | Build mock weather fallback on Day 2; test API Day 1 |
| Demo shows empty insights screen | High (without prep) | High | Pre-seed demo account with 14 days realistic data — non-negotiable |
| Hawker DB too thin for demo | Medium | Medium | Expand to 80+ dishes; cover all major hawker categories |
| AI pattern detection underwhelms | Medium | High | Test AI logic on Day 3; have rule-based fallback detection |
| Demo crashes live | Low | High | Feature freeze Day 6 (12 Aug); record backup screen recording |
| Judges see it as "just a logging app" | Medium | High | Demo script rule: lead with AI multi-variable insight, not logging |
| Logging fatigue kills retention story | Medium | Medium | Conversational AI input + streak gamification reduces friction |

---

## 9. Demo Script (for judging)

> **Recommended 5-minute demo flow:**

| Time | Segment | Content |
|---|---|---|
| 0:00–0:30 | Personal story | "I have eczema. I spent 3 years guessing my triggers. ClearLah found them in 3 weeks." |
| 0:30–1:00 | Onboarding | Select eczema + self-tracking; grant location; see personalised dashboard |
| 1:00–2:00 | Conversational log | Type "Had laksa, stressed from work, skin itchy tonight" — watch AI auto-fill |
| 2:00–3:00 | AI Insights | Show multi-variable insight from pre-seeded 14-day demo data |
| 3:00–4:00 | Hawker Decoder | Type "Laksa" / "拉沙" — see allergens + personal risk score + High Risk Day alert |
| 4:00–4:40 | Doctor report | Generate and show PDF export with disclaimer |
| 4:40–5:00 | Close | "Built for Singapore. Replicable across SEA. Your personal health detective — lah." |

> **Rule:** First 90 seconds must stand alone as a complete pitch if judges are pressed for time.

---

## 10. 7-Day Build Plan

| Day | Date | Focus | Critical Actions |
|---|---|---|---|
| Day 1 | 7 Aug | PRD finalised ✅ → Architecture | **Verify NEA API access today** |
| Day 2 | 8 Aug | Tech architecture + data models + NEA fallback | Build mock weather data fallback |
| Day 3 | 9 Aug | Onboarding + conversational logging UI | Time the logging flow; must be < 3 min |
| Day 4 | 10 Aug | NEA API + Hawker DB (80+ dishes) + AI pattern engine | **Test AI pattern detection with real data** |
| Day 5 | 11 Aug | High Risk Day alert + Trigger report + Pre-seed demo data | Seed 14-day demo account |
| Day 6 | 12 Aug | UI polish + UX review + bug fixes | **Feature freeze end of Day 6** |
| Day 7 | 13 Aug | Demo video + submission write-up | Record backup screen recording |
| **Deadline** | **14 Aug 6pm** | **Submit** | Submit before 5pm (1hr buffer) |

---

## 11. Judging Criteria Alignment

| Dimension | Weight | How ClearLah scores | Key proof point |
|---|---|---|---|
| AI Innovation | 30% | 9/10 | Conversational AI parser + multi-variable correlation across 5 pillars + NEA auto-integration |
| Technical Excellence | 20% | 8/10 | Live API, conversational NLP, clean architecture on CodeBuddy |
| User Experience & Demo | 25% | 9.5/10 | Personal story opener, conversational logging, Hawker Decoder wow-moment |
| Business Value & Viability | 25% | 9/10 | 1 in 5 SG residents affected; personal data moat; replicable SEA model; freemium + clinic partnerships |

---

## 12. Competitive Differentiators & Data Moat

| vs. Competitors | ClearLah Advantage |
|---|---|
| Cara Care / Ovia | Singapore hawker food DB; multi-variable AI; conversational logging |
| MyFitnessPal | Symptom correlation; allergy-first design; no calorie focus |
| Generic symptom trackers | Auto NEA weather; skincare pillar; local food context |
| Spreadsheets | Conversational AI input; automatic pattern detection |

### The Data Moat
> ClearLah's true competitive advantage is **each user's personal trigger profile** — built over weeks of logging. This data is unique, irreplaceable, and grows more valuable over time. No competitor can replicate a user's 90-day personalised trigger map.

---

## 13. Post-Hackathon Roadmap (Pitch Talking Points)

| Phase | Feature | Timeline |
|---|---|---|
| v1.1 | Multi-profile support (family accounts) | Month 1 |
| v1.2 | Passive detection via wearable integration | Month 2–3 |
| v2.0 | Clinic API — share reports directly with doctors | Month 3–6 |
| v2.1 | SEA expansion — Malaysia, Indonesia hawker DB | Month 6–12 |
| v3.0 | Community trigger map (anonymised crowd-sourcing) | Year 1 |

---

*Document Owner: John (PM Agent) v2.0*
*Requirements by: Mary (Analyst Agent)*
*Enhanced by: Advanced Elicitation — Pre-mortem, Shark Tank, User Focus Group, First Principles, Assumption Audit*
*Next Step: Hand off to Winston (Architect Agent) for technical architecture design*
