import type { Config } from "tailwindcss";

/**
 * Peak Signal design system (spec §7) on an Apple-minimalist foundation:
 * SF system fonts, generous whitespace, restrained colour, soft radii.
 * Two modes — dark "intelligence" (Phase 1) and light "planning" (Phase 2).
 */
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        signal: {
          buy: "#10B981",
          wait: "#F59E0B",
          peak: "#EF4444",
        },
        intelligence: {
          bg: "#0D1117",
          surface: "#161B22",
          hairline: "#222B35",
          muted: "#8B98A5",
        },
        planning: {
          bg: "#FAFAFA",
          surface: "#FFFFFF",
          hairline: "#ECECEC",
          muted: "#6E6E73",
        },
        accent: {
          // Brand green — matches the logo (public/icon.svg) and the buy signal.
          DEFAULT: "#10B981",
          soft: "#34D399",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system", "BlinkMacSystemFont", "SF Pro Text", "SF Pro Display",
          "Inter", "system-ui", "Segoe UI", "sans-serif",
        ],
        mono: [
          "SF Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco",
          "Cascadia Code", "monospace",
        ],
      },
      maxWidth: {
        content: "1280px",
      },
      borderRadius: {
        xl: "16px",
        "2xl": "24px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px -12px rgba(0,0,0,0.12)",
        float: "0 8px 40px -12px rgba(0,0,0,0.18)",
      },
      letterSpacing: {
        tightish: "-0.01em",
        tighter2: "-0.02em",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
