# ClearLah — Architecture Explainer

**Audience:** Hackathon judges, team members, and stakeholders
**Date:** 7 August 2026

---

## What We Built and Why

ClearLah is a personal eczema trigger tracker for Singapore. It helps users discover what causes their flare-ups by logging food, lifestyle, skincare, and symptoms daily — then using AI to surface the patterns.

The architecture is designed around three constraints:
1. **7 days to build** — every decision favours speed and reliability over sophistication
2. **Live demo on Day 7** — the system must not fail publicly; every external dependency has a fallback
3. **Built on CodeBuddy AI** — AI is a first-class citizen: the AI agent parses, reasons, learns from feedback, explains with evidence, and answers free-form questions

The AI agent is not a feature layer — it **is** the product. Four AI endpoints work together as an intelligent system: parsing natural language logs, narrating pattern insights with temporal reasoning, learning from user corrections via feedback, and answering free-text questions by cross-referencing personal data, live weather, and hawker dish knowledge.

---

## System Overview

At the highest level, ClearLah is a **Next.js full-stack application** deployed on Vercel, backed by a **Supabase database**, with two external integrations: the **CodeBuddy AI API** and the **NEA weather API**.

```mermaid
graph TB
    subgraph Browser["🌐 Browser"]
        UI["React UI\n(Next.js App Router)"]
    end

    subgraph Vercel["☁️ Vercel — Next.js Server"]
        API_AI["/api/ai/*\nAI Routes"]
        API_WEATHER["/api/weather\nWeather Proxy"]
        API_LOGS["/api/logs\nLog Routes"]
        API_INSIGHTS["/api/insights/*\nInsight Routes"]
        API_DEMO["/api/demo/seed\nDemo Seeder"]
        PATTERN["lib/pattern-engine.ts\nCorrelation Engine"]
    end

    subgraph External["🔌 External Services"]
        CODEBUDDY["CodeBuddy AI API"]
        NEA["NEA Weather API\n(or Mock)"]
        SUPABASE["Supabase\nPostgres DB"]
    end

    UI -->|"HTTP calls only"| API_AI
    UI -->|"HTTP calls only"| API_WEATHER
    UI -->|"HTTP calls only"| API_LOGS
    UI -->|"HTTP calls only"| API_INSIGHTS
    UI -->|"HTTP calls only"| API_DEMO

    API_AI --> CODEBUDDY
    API_WEATHER --> NEA
    API_LOGS --> SUPABASE
    API_INSIGHTS --> PATTERN
    PATTERN --> API_AI
    API_INSIGHTS --> SUPABASE
    API_DEMO --> SUPABASE
```

**The golden rule:** The browser never talks to external services directly. Every API key stays on the server.

---

## The Five Core Flows

### 1. Daily Log Entry

The most common user action — logging today's food, mood, skin state, and skincare products.

```mermaid
sequenceDiagram
    participant U as User
    participant UI as React UI
    participant Parse as /api/ai/parse-log
    participant CB as CodeBuddy AI
    participant Weather as /api/weather
    participant NEA as NEA API
    participant DB as Supabase

    U->>UI: Types "had laksa, stressed, skin itchy"
    UI->>Parse: POST {raw_text}
    Parse->>CB: Prompt: extract structured log entry
    CB-->>Parse: {food: ["laksa"], stress_level: 4, symptoms: {skin: 7}}
    Parse-->>UI: Structured LogEntry (pre-filled form)
    UI->>U: Shows pre-filled form for confirmation

    U->>UI: Confirms / edits and submits
    UI->>Weather: GET /api/weather
    Weather->>NEA: Fetch today's Singapore data
    NEA-->>Weather: {temp, humidity, psi, uv}
    Weather-->>UI: WeatherSnapshot

    UI->>DB: POST /api/logs {LogEntry + WeatherSnapshot}
    DB-->>UI: Saved confirmation
    UI->>U: "Log saved ✓"
```

**Key design choice:** AI parses the free-text input into a structured form, and the user confirms accuracy with thumbs-up/down feedback. Corrections are stored and fed back as few-shot examples — the AI agent **learns** from every user interaction and improves over time.

---

### 2. Pattern Detection & Insight Generation

Run after 7+ days of data. This is the core intelligence of ClearLah.

```mermaid
sequenceDiagram
    participant U as User
    participant UI as React UI
    participant Insights as /api/insights/correlate
    participant Engine as pattern-engine.ts
    participant Narrate as /api/ai/narrate-insights
    participant CB as CodeBuddy AI
    participant DB as Supabase

    U->>UI: Taps "Discover My Triggers"
    UI->>Insights: GET /api/insights/correlate
    Insights->>DB: Fetch all LogEntry[] for user
    DB-->>Insights: LogEntry[] (14+ days)

    Insights->>Engine: compute(LogEntry[])
    Note over Engine: Frequency analysis across<br/>food × lifestyle × skincare × weather × symptoms
    Engine-->>Insights: CorrelationResult[]

    Insights->>Narrate: POST {CorrelationResult[]}
    Narrate->>CB: Prompt: write plain-English insight cards
    CB-->>Narrate: Insight narrative strings
    Narrate-->>Insights: EnrichedInsight[]

    Insights-->>UI: EnrichedInsight[]
    UI->>U: Shows trigger insight cards
```

**Key design choice:** JavaScript computes the maths; CodeBuddy AI writes the words. If AI is unavailable, the computed `CorrelationResult[]` is displayed using template strings — the demo never breaks.

---

### 3. Hawker Safety Check

User searches for a dish before ordering.

```mermaid
sequenceDiagram
    participant U as User
    participant UI as React UI
    participant DB as Supabase

    U->>UI: Types "char kway teow" (EN/Malay/Chinese)
    UI->>DB: GET /api/hawker?q=char+kway+teow
    Note over DB: Fuzzy search across<br/>dish names + multilingual aliases
    DB-->>UI: {dish, allergens, risk_level}

    UI->>U: Shows allergen card + risk level
    Note over UI: Compares against user's known triggers<br/>(from CorrelationResult cache)
    UI->>U: "⚠️ Contains shellfish — a confirmed trigger for you"
```

---

### 4. Demo Seeding

One-click demo setup for live presentations.

```mermaid
sequenceDiagram
    participant P as Presenter
    participant UI as React UI
    participant Seed as /api/demo/seed
    participant DB as Supabase

    P->>UI: Clicks "Load Demo Mode"
    UI->>Seed: POST /api/demo/seed
    Seed->>DB: Upsert 14-day fixture rows (idempotent)
    DB-->>Seed: Confirmed
    Seed-->>UI: {user_id: "demo-user"}
    UI->>P: App loads with 14 days of realistic data
    Note over P: Safe to run multiple times<br/>Resets to clean demo state every time
```

---

### 5. Weather Proxy with Fallback

```mermaid
flowchart TD
    A["/api/weather called"] --> B{USE_MOCK_WEATHER\n= 'true'?}
    B -->|Yes| C["Return static\nSingapore mock data\n{source: 'mock'}"]
    B -->|No| D["Call NEA API"]
    D --> E{NEA responded\nsuccessfully?}
    E -->|Yes| F["Return live data\n{source: 'nea_live'}"]
    E -->|No| C
```

The client always gets a `WeatherSnapshot` — it never knows whether the data is live or mocked.

---

### 6. Ask ClearLah — Conversational Agent Q&A

User asks free-text questions; the AI cross-references personal data, triggers, weather, and hawker knowledge:

```mermaid
sequenceDiagram
    participant U as User
    participant UI as React UI (AskClearLah card)
    participant Ask as /api/ai/ask
    participant DB as Supabase
    participant Engine as pattern-engine.ts
    participant Weather as /api/weather
    participant CB as CodeBuddy AI

    U->>UI: Types "Can I eat laksa today?"
    UI->>Ask: POST {question: "Can I eat laksa today?"}
    Ask->>DB: Fetch 30 log entries + profile + triggers
    Ask->>Engine: detectCorrelations(logEntries)
    Ask->>Weather: Fetch live NEA weather
    par Build system prompt
        Ask->>Ask: Compile: conditions, allergens, trigger patterns,<br/>14-day detailed evidence (dates + scores + weather),<br/>today's weather, recent foods
    end
    Ask->>CB: System prompt with full context + user question
    CB-->>Ask: Personalised answer citing specific dates and mechanisms
    Ask-->>UI: {answer: "Today's humidity is 88%..."}
    UI->>U: Shows answer card with cited evidence
```

**Key design choice:** The AI receives the user's actual 14-day log data (dates, foods, symptom scores, weather) so it can cite specific evidence rather than giving generic advice. This is what makes the agent feel intelligent — it references the user's real history.

---

### 7. AI Feedback Learning Loop

Every AI parse is rated; corrections feed back into future prompts:

```mermaid
sequenceDiagram
    participant U as User
    participant PreFill as PreFillCard
    participant Feedback as /api/ai/feedback
    participant DB as Supabase
    participant Parse as /api/ai/parse-log
    participant CB as CodeBuddy AI

    Note over U,CB: Day 1 — User logs food, AI parses incorrectly
    U->>PreFill: AI says "chicken rice" but user ate "laksa"
    PreFill->>U: Shows parsed result with "Fix it" button
    U->>PreFill: Taps "Fix it", corrects to "laksa"
    PreFill->>Feedback: POST {rating: "inaccurate", corrections: {...}}
    Feedback->>DB: Store correction in user_profiles.ai_feedback_log

    Note over U,CB: Day 5 — User logs similar meal
    U->>Parse: "Had laksa again today"
    Parse->>DB: Fetch recent inaccurate corrections
    DB-->>Parse: [{message: "had laksa", corrections: {food: ["laksa"]}}]
    Parse->>CB: System prompt includes few-shot correction examples
    CB-->>Parse: Correctly parses "laksa"
    Parse-->>U: Accurate pre-fill — AI has learned
```

**Key design choice:** Feedback is non-blocking — if the feedback API fails, the log save still proceeds. The AI improves passively over time, never breaking the core logging flow.

---

## Data Model

```mermaid
erDiagram
    USERS {
        uuid id PK
        string email
        string display_name
        timestamp created_at
    }

    USER_PROFILES {
        uuid id PK
        uuid user_id FK
        jsonb known_allergens
        jsonb trigger_cache
        boolean is_demo
        timestamp updated_at
    }

    LOG_ENTRIES {
        uuid id PK
        uuid user_id FK
        date date
        jsonb food
        jsonb lifestyle
        jsonb skincare
        jsonb symptoms
        jsonb weather
        timestamp created_at
    }

    HAWKER_DISHES {
        uuid id PK
        string name_en
        string name_ms
        string name_zh
        jsonb allergen_tags
        string risk_level
    }

    SAVED_DISHES {
        uuid id PK
        uuid user_id FK
        uuid dish_id FK
        string note
        timestamp saved_at
    }

    USERS ||--o{ LOG_ENTRIES : "has"
    USERS ||--|| USER_PROFILES : "has"
    USERS ||--o{ SAVED_DISHES : "saves"
    HAWKER_DISHES ||--o{ SAVED_DISHES : "referenced by"
```

---

## Folder Structure

```
clearlah/
├── app/
│   ├── (app)/                    # Authenticated app shell
│   │   ├── dashboard/            # Home — streak, quick log, weather
│   │   ├── log/                  # Daily log entry flow
│   │   ├── insights/             # Trigger insights + correlation cards
│   │   ├── hawker/               # Hawker safety checker
│   │   └── export/               # PDF export
│   ├── api/
│   │   ├── ai/
│   │   │   ├── parse-log/        # POST — free-text → structured LogEntry (with feedback few-shot learning)
│   │   │   ├── narrate-insights/ # POST — CorrelationResult[] → insight text (with temporal reasoning)
│   │   │   ├── ask/              # POST — free-text Q&A cross-referencing logs + weather + hawker DB
│   │   │   └── feedback/         # POST — stores user corrections for AI learning
│   │   ├── weather/              # GET — NEA proxy with mock fallback
│   │   ├── logs/                 # GET/POST — log CRUD
│   │   ├── insights/
│   │   │   └── correlate/        # GET — run pattern engine
│   │   └── demo/
│   │       └── seed/             # POST — upsert 14-day fixture
│   └── layout.tsx
├── lib/
│   ├── pattern-engine.ts         # Pure TS — correlation logic, no I/O
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   └── server.ts             # Server Supabase client
│   └── types.ts                  # Shared type definitions
├── data/
│   └── demo-data.json            # 14-day realistic fixture
├── supabase/
│   ├── schema.sql                # Table definitions
│   └── seed.sql                  # 80+ hawker dishes
└── public/
```

---

## Technology Choices

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack in one repo; API routes solve proxy + AI calls; Vercel-native |
| Language | TypeScript (strict) | Catches data contract mismatches at compile time — critical with complex nested JSON |
| Styling | Tailwind CSS | Fast, consistent, no custom CSS to maintain |
| Database | Supabase (Postgres) | Free tier, instant setup, typed client, Auth built-in |
| AI | CodeBuddy AI API | Hackathon track requirement; server-side only |
| Deployment | Vercel | Zero-config Next.js; live HTTPS URL for demo |
| Pattern Detection | Custom TypeScript | Deterministic, testable, zero latency, no AI dependency for core logic |

---

## What Could Go Wrong (and What We Did About It)

| Risk | Mitigation |
|---|---|
| CodeBuddy AI is slow during demo | Pattern engine produces results independently; AI narration has a template fallback; Ask endpoint returns friendly degradation message |
| NEA API is unavailable | `USE_MOCK_WEATHER=true` env flag — flip it before the demo |
| Supabase free tier rate limits | Demo uses a single demo user; load is minimal |
| AI parses log entry incorrectly | User always sees and confirms the pre-filled form before saving; feedback learning improves accuracy over time |
| Demo data is corrupted | `/api/demo/seed` is idempotent — reset takes 2 seconds |
| AI answers feel generic, not personal | Ask endpoint pushes 14-day detailed evidence (dates, scores, weather) so AI cites specific user history |

---

## What's Not in MVP (and Why)

| Feature | Status | Reason |
|---|---|---|
| Multi-profile / family accounts | Post-hackathon | Complex auth + data isolation; not needed for demo |
| Wearable / passive data | Post-hackathon | Requires device APIs; out of 7-day scope |
| PDF export | Day 5 decision | Implement with `window.print()` CSS first; upgrade to `react-pdf` if time allows |
| Rate limiting on AI routes | Post-hackathon | Cost concern only; not a demo risk |

---

*Owner: Winston (Architect)*
*For implementation, see: `ClearLah-Architecture-Spine.md`*
*For product requirements, see: `ClearLah-PRD.md`*
