import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080808",
        surface: "#111111",
        card: "#161616",
        border: "#222222",
        primary: {
          DEFAULT: "#22c55e",
          dark: "#16a34a",
          light: "#4ade80",
        },
        gold: "#f59e0b",
        danger: "#ef4444",
        muted: "#606060",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-mesh": "radial-gradient(at 40% 20%, hsla(136,60%,40%,0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,70%,30%,0.05) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355,70%,40%,0.05) 0px, transparent 50%)",
      },
      boxShadow: {
        "glow-sm": "0 0 12px rgba(34, 197, 94, 0.2)",
        "glow":    "0 0 24px rgba(34, 197, 94, 0.3)",
        "glow-lg": "0 0 40px rgba(34, 197, 94, 0.35)",
        "card":    "0 4px 24px rgba(0, 0, 0, 0.4)",
        "card-lg": "0 8px 40px rgba(0, 0, 0, 0.6)",
      },
      animation: {
        "fade-in":    "fadeIn 0.3s ease-out",
        "slide-up":   "slideUp 0.4s ease-out",
        "scale-in":   "scaleIn 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float":      "float 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { transform: "translateY(16px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        scaleIn: { "0%": { transform: "scale(0.95)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
        float:   { "0%, 100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-6px)" } },
      },
    },
  },
  plugins: [],
};

export default config;
