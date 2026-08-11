# ClearLah

> Track your triggers. Live with less flare.

ClearLah is an **AI health detective agent** for Singaporeans living with eczema, IBS, food allergies, and asthma. The AI agent parses natural language logs (food, lifestyle habits, symptoms), detects trigger patterns with temporal reasoning, learns from user feedback, and answers free-form questions by cross-referencing personal data against live NEA weather and 147 dishes (hawker centres, restaurant chains, international cuisine) — all citing specific evidence from your own history.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=REPO_URL_HERE)

---

## Local Development

### Prerequisites
- Node.js 18.17+
- A [Supabase](https://supabase.com) project (free tier works)

### Setup

```bash
# 1. Clone & install
git clone REPO_URL_HERE
cd clearlah
npm install

# 2. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and fill in the values (see Environment Variables below)

# 3. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js development server on port 3000 |
| `npm run build` | Production build (`next build` — includes type checking) |
| `npm start` | Start production server (after `npm run build`) |
| `npm run lint` | Run ESLint across all source files |
| `npm run type-check` | Run `tsc --noEmit` for strict TypeScript validation |

---

## Environment Variables

All variables must be set in `.env.local` for local dev, and in your Vercel project dashboard for production.

| Variable | Required | Description |
|---|---|---|
| `CODEBUDDY_API_KEY` | Yes (prod) | LLM API key for AI log parsing and insight narration |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (exposed to browser — `NEXT_PUBLIC_` prefix) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key — safe to expose to browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Supabase service-role key — **never expose to client** (bypasses RLS in demo mode) |
| `USE_MOCK_WEATHER` | No | `"true"` to use mock weather data instead of live NEA API (default for dev/CI) |
| `NEXT_PUBLIC_DEMO_MODE` | No | `"true"` to enable demo mode — bypasses auth, uses pre-seeded demo account |

### Vercel Deployment

When deploying to Vercel, set these in **Project Settings → Environment Variables**:

- `NEXT_PUBLIC_DEMO_MODE=true` (for hackathon demo)
- `USE_MOCK_WEATHER=true`
- Plus all `Yes`-required variables with actual values

---

## Demo Mode (no auth required)

ClearLah includes a pre-seeded demo account with 14 days of realistic eczema tracking data. To use it:

1. Set `NEXT_PUBLIC_DEMO_MODE=true` and `USE_MOCK_WEATHER=true` in `.env.local`
2. Start the dev server: `npm run dev`
3. Visit `http://localhost:3000` — the landing page shows a "Demo Mode" badge
4. Click **Load Demo Data** to seed the demo account into Supabase
5. You'll be taken to the Dashboard with 14 days of pre-logged data

Or seed directly via API:

```bash
curl -X POST http://localhost:3000/api/demo/seed
```

---

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript strict mode)
- **Styling**: Tailwind CSS with ClearLah design token system
- **Database**: Supabase (PostgreSQL + Row Level Security)
- **AI**: CodeBuddy LLM API — 4 AI agent endpoints: `/api/ai/parse-log` (NL parsing with feedback learning), `/api/ai/narrate-insights` (temporal reasoning), `/api/ai/ask` (conversational agent Q&A), `/api/ai/feedback` (correction learning loop)
- **Deployment**: Vercel

---

## Project Structure

```
clearlah/
├── app/                   # Next.js App Router pages & API routes
│   ├── api/               # API routes
│   │   ├── ai/
│   │   │   ├── parse-log/      # POST — natural language → structured log (with feedback learning)
│   │   │   ├── narrate-insights/ # POST — correlations → plain-English insights (temporal reasoning)
│   │   │   ├── ask/            # POST — free-text Q&A (cross-references logs + weather + hawker DB)
│   │   │   └── feedback/       # POST — stores user corrections for AI learning
│   │   ├── weather/       # Singapore weather (NEA API + mock fallback)
│   │   ├── demo/seed/     # POST — seed 14 days of demo data (idempotent)
│   │   ├── hawker/        # GET/POST/DELETE — hawker dish search + food guide
│   │   ├── insights/      # GET — trigger pattern detection
│   │   └── logs/          # GET/POST — daily log CRUD
│   ├── dashboard/         # Dashboard page (streak, weather, Ask ClearLah, High Risk Day)
│   ├── log/               # Conversational daily log entry
│   ├── insights/          # Trigger insights + pattern cards
│   ├── hawker/            # Hawker food safety checker
│   └── onboarding/        # Onboarding (steps 1–3)
├── components/            # Shared React components
├── lib/
│   ├── supabase/          # Supabase client helpers (server.ts, client.ts)
│   ├── types/             # TypeScript type definitions (database.ts)
│   └── utils/             # Utility functions (demo.ts, cn.ts)
├── data/                  # Static data & demo seed JSON
└── supabase/
    ├── migrations/        # SQL migration files (3 migrations)
    └── seed.sql           # Seed data (147 dishes across 19 categories)
```

---

## Troubleshooting

### Build fails with TypeScript errors

Run `npm run type-check` to see all type errors. Fix any in source files (not `node_modules` or `.next`). If errors come from `lib/supabase/server.ts`, ensure you've run `npm install` and the `@supabase/ssr` package is installed.

### Vercel deploy fails

1. Check **Vercel Dashboard → Deployments → Logs** for the specific error
2. Common issues:
   - Missing env vars: ensure all required env vars are set in Vercel Project Settings
   - Build cache: try **Redeploy without cache** from the Vercel dashboard
   - Supabase connection: verify `NEXT_PUBLIC_SUPABASE_URL` is correct and the project is active

### Demo mode not working

- Verify `NEXT_PUBLIC_DEMO_MODE=true` is set (restart dev server after changing .env.local)
- Check that `SUPABASE_SERVICE_ROLE_KEY` is set and valid
- Run `curl -X POST http://localhost:3000/api/demo/seed` to seed data manually
- Check browser console for any fetch errors

### Weather shows mock data

This is expected in development! `USE_MOCK_WEATHER=true` is the default. Set it to `false` (or remove it) to use live NEA data — note that NEA API may not be accessible outside Singapore.

---

## Architecture & Design

- **Architecture decisions**: [ClearLah-Architecture-Spine.md](../ClearLah-Architecture-Spine.md)
- **Design system**: [DESIGN.md](../DESIGN.md)
- **Product requirements**: [ClearLah-PRD.md](../ClearLah-PRD.md)
- **Epics & stories**: [epics.md](../epics.md)

---

## Hackathon Notes

- **Event**: Tencent Hackathon 2026
- **Team**: ClearLah
- **Demo URL**: https://clearlah.vercel.app
- **Submission**: `ClearLah-Submission.md`
