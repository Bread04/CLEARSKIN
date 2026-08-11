---
status: final
updated: 2026-08-07
product: ClearLah
version: "1.1"
platform: web-responsive

colors:
  primary: "#5B7F6E"          # Muted sage — calm, clinical, health-positive
  primary-dark: "#3D6B57"     # Hover / active states
  primary-light: "#EAF0ED"    # Tinted backgrounds, success surfaces
  secondary: "#C0583A"        # Muted terracotta — urgency, High Risk Day alerts
  secondary-light: "#F5EAE6"  # Alert tint backgrounds
  neutral-900: "#1C1C1A"      # Primary text (warm near-black)
  neutral-700: "#3D3D39"      # Secondary text
  neutral-500: "#7A7A74"      # Placeholder, captions
  neutral-300: "#D4D2CC"      # Dividers, borders
  neutral-100: "#EFEDE8"      # Card backgrounds, input fills (warm grey)
  neutral-50:  "#F8F7F4"      # Page background (warm white)
  white: "#FFFFFF"
  risk-high: "#C0583A"        # Avoid dishes, severe symptoms (muted terracotta)
  risk-medium: "#B07D2A"      # Risky dishes, moderate symptoms (muted amber)
  risk-low: "#5B7F6E"         # Safe dishes, mild/no symptoms
  surface-glass: "rgba(248,247,244,0.90)"  # Frosted card overlays

typography:
  font-family: "'Inter', 'Helvetica Neue', sans-serif"   # Single font — weight drives all hierarchy
  font-family-mono: "'JetBrains Mono', 'Fira Code', monospace"

  scale:
    display:     { size: "2rem",     weight: 700, line-height: 1.2 }   # Hero headlines
    h1:          { size: "1.75rem",  weight: 700, line-height: 1.25 }
    h2:          { size: "1.375rem", weight: 600, line-height: 1.3 }
    h3:          { size: "1.125rem", weight: 600, line-height: 1.35 }
    body-lg:     { size: "1rem",     weight: 400, line-height: 1.6 }
    body:        { size: "0.9375rem",weight: 400, line-height: 1.55 }
    body-sm:     { size: "0.875rem", weight: 400, line-height: 1.5 }
    caption:     { size: "0.75rem",  weight: 400, line-height: 1.4 }
    label:       { size: "0.75rem",  weight: 600, line-height: 1.0, letter-spacing: "0.06em", text-transform: "uppercase" }
    numeric:     { size: "2.5rem",   weight: 700, line-height: 1.0, letter-spacing: "-0.02em" }  # Dashboard stats, confidence %

motion:
  easing: "ease-in-out"
  duration-transition: "180ms"   # Screen/element transitions
  duration-micro: "120ms"        # Button press, badge pop, streak increment
  duration-none: "0ms"           # For users with prefers-reduced-motion

rounded:
  none: "0"
  sm:   "0.375rem"    # Input fields, chips
  md:   "0.75rem"     # Cards, modals
  lg:   "1rem"        # Feature cards
  xl:   "1.5rem"      # Bottom sheets, hero sections
  full: "9999px"      # Pills, avatars, streak badges

spacing:
  base: "0.25rem"     # 4px grid
  xs:   "0.25rem"     # 4px
  sm:   "0.5rem"      # 8px
  md:   "1rem"        # 16px
  lg:   "1.5rem"      # 24px
  xl:   "2rem"        # 32px
  2xl:  "3rem"        # 48px
  page-x: "1rem"      # Horizontal page padding (mobile)
  page-x-md: "1.5rem" # Horizontal page padding (tablet+)

components:
  button-primary:
    background: "{colors.primary}"
    color: "{colors.white}"
    border-radius: "{rounded.full}"
    padding: "0.75rem 1.5rem"
    font-weight: 600
    font-size: "0.9375rem"
    hover-background: "{colors.primary-dark}"
    disabled-opacity: 0.45
    min-height: "44px"

  button-secondary:
    background: "transparent"
    color: "{colors.primary}"
    border: "1.5px solid {colors.primary}"
    border-radius: "{rounded.full}"
    padding: "0.75rem 1.5rem"
    font-weight: 600
    hover-background: "{colors.primary-light}"
    min-height: "44px"

  button-ghost:
    background: "transparent"
    color: "{colors.neutral-700}"
    border-radius: "{rounded.full}"
    padding: "0.75rem 1.25rem"
    hover-background: "{colors.neutral-100}"
    min-height: "44px"

  card:
    background: "{colors.neutral-50}"     # Warm white on warm-grey page — tonal separation only
    border-radius: "{rounded.lg}"
    border: "none"
    box-shadow: "none"
    padding: "{spacing.lg}"

  card-elevated:
    background: "{colors.neutral-50}"
    border-radius: "{rounded.xl}"
    border: "none"
    box-shadow: "0 2px 8px rgba(0,0,0,0.06)"   # Minimal lift for modals/sheets only
    padding: "{spacing.lg}"

  card-on-white:
    background: "{colors.white}"
    border-radius: "{rounded.lg}"
    border: "1px solid {colors.neutral-300}"    # Border-only fallback when card sits on white surface
    box-shadow: "none"
    padding: "{spacing.lg}"

  input:
    background: "{colors.neutral-100}"
    border: "1.5px solid transparent"
    border-radius: "{rounded.sm}"
    focus-border: "{colors.primary}"
    font-size: "1rem"
    padding: "0.75rem 1rem"
    min-height: "44px"
    placeholder-color: "{colors.neutral-500}"

  chat-bubble-user:
    background: "{colors.primary}"
    color: "{colors.white}"
    border-radius: "1.25rem 1.25rem 0.25rem 1.25rem"
    padding: "0.75rem 1rem"
    max-width: "80%"
    align: "right"

  chat-bubble-ai:
    background: "{colors.neutral-100}"
    color: "{colors.neutral-900}"
    border-radius: "1.25rem 1.25rem 1.25rem 0.25rem"
    padding: "0.75rem 1rem"
    max-width: "80%"
    align: "left"

  badge-risk-high:
    background: "#F5EAE6"
    color: "{colors.risk-high}"
    border-radius: "{rounded.full}"
    font: "{typography.scale.label}"
    padding: "0.25rem 0.625rem"

  badge-risk-medium:
    background: "#F5EDDC"
    color: "{colors.risk-medium}"
    border-radius: "{rounded.full}"
    font: "{typography.scale.label}"
    padding: "0.25rem 0.625rem"

  badge-risk-safe:
    background: "{colors.primary-light}"
    color: "{colors.primary-dark}"
    border-radius: "{rounded.full}"
    font: "{typography.scale.label}"
    padding: "0.25rem 0.625rem"

  streak-badge:
    background: "{colors.secondary}"
    color: "{colors.white}"
    border-radius: "{rounded.full}"
    font-weight: 700
    padding: "0.25rem 0.75rem"

  insight-card:
    background: "{colors.primary-light}"
    border-left: "4px solid {colors.primary}"
    border-radius: "{rounded.md}"
    padding: "{spacing.lg}"

  alert-high-risk:
    background: "{colors.secondary-light}"
    border: "1.5px solid {colors.secondary}"
    border-radius: "{rounded.lg}"
    padding: "{spacing.md}"

  nav-bottom:
    background: "{colors.neutral-50}"       # Flush with page surface — nav recedes into layout
    border-top: "1px solid {colors.neutral-300}"
    height: "64px"
    icon-active-color: "{colors.primary}"
    icon-inactive-color: "{colors.neutral-500}"
    label-size: "0.6875rem"

  progress-ring:
    track-color: "{colors.neutral-200}"
    fill-color: "{colors.primary}"
    size: "48px"
    stroke-width: "4px"

  pillar-tag:
    border-radius: "{rounded.sm}"
    font: "{typography.scale.caption}"
    font-weight: 600
    padding: "0.2rem 0.5rem"
    variants:
      food:      { background: "#F2EDD9", color: "#7A5C1E" }
      lifestyle: { background: "#DCE5F0", color: "#2D4E7A" }
      skincare:  { background: "#EDE5F0", color: "#5E3A7A" }
      symptoms:  { background: "#F0E5E5", color: "#7A2D2D" }
      weather:   { background: "#DCF0F0", color: "#1E6060" }
---

# ClearLah — Design Identity

## Brand & Style

ClearLah is a **trusted personal health companion** for Singaporeans. The visual language balances:

- **Calm clinical credibility** — warm whites, generous white space, data-forward layouts — so users trust the insights without feeling like they're in a hospital portal
- **Minimalist restraint** — colour is accent only; UI chrome disappears so numbers and insights come forward
- **Accessibility-first** — all colour pairings meet WCAG AA; touch targets ≥ 44px; readable at small sizes

**Personality:** Focused and warm. Smart but never cold. Encouraging, never alarmist. The "lah" lives in copy tone, not in visual noise.

**Visual reference:** Muted sage palette on warm-white surfaces. Heavy white space. Weight-driven typographic hierarchy. No gradients on primary surfaces. Data is the hero.

**Motion principle:** Purposeful and calm. `ease-in-out` at `180ms` for screen/element transitions; `120ms` for micro-interactions (button press, badge pop, streak increment). No gratuitous animation that competes with health data.

**Illustration style:** Flat, geometric, warm. Food icons should look appetising but diagrammatic. Avoid medical cross/red imagery in non-alert contexts — keep health associations positive.

---

## Colors

### Primary Palette

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#5B7F6E` | CTAs, active nav, positive states, streak rings |
| `primary-dark` | `#3D6B57` | Hover, pressed, high-contrast text on light |
| `primary-light` | `#EAF0ED` | Success tints, insight card fills, onboarding highlights |

### Semantic / Functional

| Token | Hex | Usage |
|---|---|---|
| `secondary` | `#C0583A` | High Risk Day banner, urgent alerts only |
| `risk-high` | `#C0583A` | "Avoid" dish badge, severe symptom indicators |
| `risk-medium` | `#B07D2A` | "Risky" dish badge, moderate symptoms |
| `risk-low` | `#5B7F6E` | "Safe" dish badge, mild/no symptoms |

### Neutrals

| Token | Hex | Usage |
|---|---|---|
| `neutral-900` | `#1C1C1A` | Primary body text (warm near-black) |
| `neutral-700` | `#3D3D39` | Secondary text, captions |
| `neutral-500` | `#7A7A74` | Placeholder text, disabled labels |
| `neutral-300` | `#D4D2CC` | Dividers, input borders (default) |
| `neutral-100` | `#EFEDE8` | Input fill backgrounds, chip backgrounds (warm grey) |
| `neutral-50`  | `#F8F7F4` | Page background (warm white) |

**Palette rationale:** Muted sage `#5B7F6E` reads as health-positive without clinical sterility. The warm-white neutral stack (`#F8F7F4` → `#EFEDE8`) removes the cold brightness of pure white, reducing eye strain for evening use. Terracotta `#C0583A` replaces vivid coral for alerts — same urgency signal, significantly lower visual noise.

---

## Typography

**Single font: Inter** — weight drives all hierarchy. No font switching; zero visual noise from mixed typefaces. Geometric neutrality keeps data in focus.

| Weight | Usage |
|---|---|
| 700 | `display`, `h1` — hero numbers, page titles |
| 600 | `h2`, `h3`, `label` — section headers, card titles, pill labels |
| 400 | `body-lg`, `body`, `body-sm`, `caption` — all reading text |

### Scale Application

| Style | Where used |
|---|---|
| `display` | Onboarding hero, empty-state headlines |
| `h1` | Page titles (Dashboard, Insights) |
| `h2` | Section headers within pages |
| `h3` | Card titles, insight headings |
| `body-lg` | AI chat responses, insight narrative text |
| `body` | Form labels, list items |
| `body-sm` | Secondary metadata, timestamps |
| `caption` | Legal disclaimers, data sources |
| `label` | All-caps pill labels (RISK: HIGH), column headers |
| `numeric` | Dashboard stats, confidence %, streak counts — tabular figures at 2.5rem/700 with tight tracking |

**Hierarchy rule:** Never use font family or colour to differentiate levels — use weight and size only. Colour on text is reserved for interactive links and risk labels.

**Localisation note:** Inter handles Latin, Malay, and basic CJK adequately for MVP. Post-hackathon: add `Noto Sans SC` to the font stack for Chinese polish.

---

## Layout & Spacing

**4px base grid** throughout. Mobile-first; single-column up to 640px, max-width 480px centred for core app flows.

| Context | Spacing |
|---|---|
| Page horizontal padding (mobile) | `1rem` (16px) |
| Page horizontal padding (tablet+) | `1.5rem` (24px) |
| Card internal padding | `1.5rem` (24px) |
| Section gap (vertical) | `1.5rem–2rem` |
| Form field gap | `1rem` |
| Bottom nav height | `64px` |
| Top safe-area padding (notch) | `env(safe-area-inset-top)` |

**Max content width:** `480px` — keeps ClearLah feeling like a focused tool, not a dashboard. Wider than a phone keyboard zone at all times.

---

## Elevation & Depth

ClearLah uses **tonal separation as the primary depth cue** — cards (`#F8F7F4`) sit on a warm-grey page background (`#EFEDE8`). No borders, no shadows on standard cards.

| Level | Usage | Token |
|---|---|---|
| Tonal (default) | All standard cards, sections | Background contrast only — no shadow, no border |
| Minimal lift | Modals, bottom sheets only | `0 2px 8px rgba(0,0,0,0.06)` |
| Border fallback | Cards on white surfaces (inside sheets) | `1px solid #D4D2CC`, no shadow |
| Focus ring | Keyboard focus on interactive elements | `0 0 0 3px rgba(91,127,110,0.30)` |

No `z-index` stacking beyond: `base (0)` → `card (10)` → `sticky nav (100)` → `modal (200)` → `toast (300)`.

---

## Shapes

- **Pill buttons** (`rounded-full`) — primary actions feel approachable, modern
- **Cards** (`rounded-lg` / `rounded-xl`) — contained, swipeable on mobile
- **Input fields** (`rounded-sm`) — slightly squared; clinical precision
- **Bottom sheet** (`rounded-xl` top corners only) — native-feeling drawer pattern
- **Avatar / streak** (`rounded-full`) — circular, badge-like

---

## Components

### Insight Card
Left-bordered card (`4px {colors.primary}` left border) with a flat `primary-light` sage fill — no gradient. Contains: confidence percentage in large type, trigger label in `h3`, plain-English explanation in `body`, and pillar tags along the bottom.

### High Risk Day Alert
Full-width banner using `alert-high-risk` surface with muted terracotta border. Shows weather icon, risk statement, and "See why" CTA. Appears at the top of Dashboard only when live conditions match the user's trigger profile. Must not appear more than once per day.

### Pillar Tags
Five colour-coded tags (food / lifestyle / skincare / symptoms / weather) used across log entries, insight cards, and the hawker check. Colours are distinct enough for red-green colourblind users — not relying on hue alone; also use shape/label.

### Streak Badge
Solid muted terracotta pill (`{colors.secondary}`). Appears on Dashboard and after every successful log. Fires a 200ms scale-up animation on new streak increment.

### Chat Interface
Full-screen conversation view. AI bubbles left-aligned (neutral background); user bubbles right-aligned (primary green). Pre-filled form appears as an expandable card below the chat thread after AI parsing. Keyboard avoidance via `padding-bottom: keyboardHeight`.

---

## Do's and Don'ts

| Do | Don't |
|---|---|
| Use `primary` sage for all positive confirmations | Use vivid or saturated colours anywhere in the UI |
| Keep surfaces warm-white (`#F8F7F4`) — never pure `#FFFFFF` | Introduce cool-grey or blue-tinted neutrals |
| Show the medical disclaimer in `caption` style, always visible | Bury the disclaimer behind a "More info" toggle |
| Use pillar colour tags consistently across all views | Introduce new tag colours ad-hoc |
| Keep AI chat responses under 3 sentences per bubble | Write AI responses that feel like clinical reports |
| Show streak counter on every successful log | Show streak counter on pages unrelated to logging |
| Use `risk-high`, `risk-medium`, `risk-low` exclusively for the three-state dish rating | Use these colours for unrelated UI states |
| Apply `rounded-full` to all primary/secondary buttons | Use square or sharp-cornered buttons |
| Animate only on user-initiated actions (≤ 200ms) | Use looping or ambient animations |
| Let white space do the work — resist filling empty areas | Add decorative illustrations or background patterns |
| Include the "lah" voice in empty states and encouragement messages | Force Singlish into error states or medical copy |
