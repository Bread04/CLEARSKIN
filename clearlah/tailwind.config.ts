import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ─── Colour Tokens ─────────────────────────────────────────────────────
      colors: {
        // Primary
        "primary-sage": "#5B7F6E",
        "primary-sage-light": "#7FA392",
        "primary-sage-dark": "#3D6B57",
        "primary-sage-50": "#EAF0ED",
        "primary-sage-100": "#D5E4DC",
        "primary-sage-200": "#ACCABA",

        // Secondary
        "secondary-terracotta": "#C0583A",
        "secondary-terracotta-light": "#D4785E",
        "secondary-terracotta-dark": "#9A3E26",
        "secondary-terracotta-50": "#F5EAE6",
        "secondary-terracotta-100": "#F4D4C8",

        // Accent
        "accent-sunshine": "#E8C547",
        "accent-sky": "#5BA3C9",
        "accent-lavender": "#9B7EC8",

        // Neutral stack (DESIGN.md spec)
        "neutral-50": "#F8F7F4",
        "neutral-100": "#EFEDE8",
        "neutral-200": "#E4E2DD",
        "neutral-300": "#D4D2CC",
        "neutral-400": "#A8A49E",
        "neutral-500": "#7A7A74",
        "neutral-600": "#595652",
        "neutral-700": "#3D3D39",
        "neutral-800": "#272623",
        "neutral-900": "#1C1C1A",

        // Risk tokens (DESIGN.md spec)
        "risk-high": "#C0583A",
        "risk-medium": "#B07D2A",
        "risk-low": "#5B7F6E",

        // Surface
        "surface-glass": "rgba(248,247,244,0.90)",

        // Status colours
        "status-success": "#3D9970",
        "status-success-bg": "#E8F5EE",
        "status-warning": "#E8A020",
        "status-warning-bg": "#FEF3DC",
        "status-error": "#D93025",
        "status-error-bg": "#FDECEA",
        "status-info": "#1A73E8",
        "status-info-bg": "#E8F0FE",

        // Severity scale (symptom logging 1-10)
        "severity-1": "#3D9970",
        "severity-2": "#52A87E",
        "severity-3": "#6DB88C",
        "severity-4": "#8EC99A",
        "severity-5": "#E8C547",
        "severity-6": "#F0A830",
        "severity-7": "#F08030",
        "severity-8": "#E06030",
        "severity-9": "#D04020",
        "severity-10": "#C0200F",
      },

      // ─── Typography ─────────────────────────────────────────────────────────
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        // DESIGN.md scale
        "display": ["2rem", { lineHeight: "1.2", fontWeight: "700" }],
        "h1": ["1.75rem", { lineHeight: "1.25", fontWeight: "700" }],
        "h2": ["1.375rem", { lineHeight: "1.3", fontWeight: "600" }],
        "h3": ["1.125rem", { lineHeight: "1.35", fontWeight: "600" }],
        "body-lg": ["1rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body": ["0.9375rem", { lineHeight: "1.55", fontWeight: "400" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }],
        "caption": ["0.75rem", { lineHeight: "1.4", fontWeight: "400" }],
        "caption-sm": ["0.6875rem", { lineHeight: "1.2", fontWeight: "400" }],
        "label": ["0.75rem", { lineHeight: "1.0", fontWeight: "600", letterSpacing: "0.06em" }],
        "numeric": ["2.5rem", { lineHeight: "1.0", fontWeight: "700", letterSpacing: "-0.02em" }],

        // Legacy aliases (for existing components)
        "display-lg": ["2.25rem", { lineHeight: "2.5rem", fontWeight: "700", letterSpacing: "-0.02em" }],
        "display-md": ["1.875rem", { lineHeight: "2.25rem", fontWeight: "700", letterSpacing: "-0.015em" }],
        "heading-xl": ["1.5rem", { lineHeight: "2rem", fontWeight: "600", letterSpacing: "-0.01em" }],
        "heading-lg": ["1.25rem", { lineHeight: "1.75rem", fontWeight: "600", letterSpacing: "-0.005em" }],
        "heading-md": ["1.125rem", { lineHeight: "1.75rem", fontWeight: "600" }],
        "body-md": ["0.875rem", { lineHeight: "1.5rem", fontWeight: "400" }],
        "label-sm": ["0.75rem", { lineHeight: "1rem", fontWeight: "500", letterSpacing: "0.01em" }],
      },

      // ─── Spacing (4px base grid) ─────────────────────────────────────────────
      spacing: {
        "0.5": "0.125rem",  // 2px
        "1": "0.25rem",     // 4px
        "1.5": "0.375rem",  // 6px
        "2": "0.5rem",      // 8px
        "2.5": "0.625rem",  // 10px
        "3": "0.75rem",     // 12px
        "4": "1rem",        // 16px
        "5": "1.25rem",     // 20px
        "6": "1.5rem",      // 24px
        "7": "1.75rem",     // 28px
        "8": "2rem",        // 32px
        "10": "2.5rem",     // 40px
        "12": "3rem",       // 48px
        "14": "3.5rem",     // 56px
        "16": "4rem",       // 64px
        "20": "5rem",       // 80px
        "24": "6rem",       // 96px
        "32": "8rem",       // 128px
      },

      // ─── Border Radius ───────────────────────────────────────────────────────
      borderRadius: {
        "none": "0",
        "sm": "0.25rem",    // 4px – tight components
        "DEFAULT": "0.5rem", // 8px – buttons, inputs
        "md": "0.5rem",
        "lg": "0.75rem",    // 12px – cards
        "xl": "1rem",       // 16px – modals
        "2xl": "1.25rem",   // 20px – chat bubbles
        "full": "9999px",   // pills, badges
      },

      // ─── Box Shadow ───────────────────────────────────────────────────────────
      boxShadow: {
        "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        "DEFAULT": "0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.06)",
        "md": "0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
        "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
        "float": "0 8px 24px rgba(0, 0, 0, 0.12)",  // FABs, bottom sheets
        "card": "0 2px 8px rgba(91, 127, 110, 0.08)",  // Cards with sage tint
      },

      // ─── Motion Tokens ────────────────────────────────────────────────────────
      transitionDuration: {
        "micro": "120ms",   // --duration-micro: micro-interactions (tap feedback)
        "ui": "180ms",      // --duration-ui: standard UI transitions
        "modal": "250ms",   // --duration-modal: modal/sheet enter/exit
        "slow": "400ms",    // --duration-slow: skeleton shimmer, emphasis
      },
      transitionTimingFunction: {
        "ui": "cubic-bezier(0.2, 0, 0, 1)",         // Material-inspired ease
        "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)", // Slight overshoot
        "decel": "cubic-bezier(0, 0, 0.2, 1)",
      },

      // ─── Animation ────────────────────────────────────────────────────────────
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        celebrationBounce: {
          "0%, 100%": { transform: "translateY(0)" },
          "30%": { transform: "translateY(-12px)" },
          "60%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.5s linear infinite",
        "fade-in-up": "fadeInUp 180ms cubic-bezier(0.2, 0, 0, 1) both",
        "fade-in": "fadeIn 180ms ease both",
        "scale-in": "scaleIn 180ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "celebration-bounce": "celebrationBounce 600ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
      },

      // ─── Background ───────────────────────────────────────────────────────────
      backgroundImage: {
        "shimmer-gradient":
          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
