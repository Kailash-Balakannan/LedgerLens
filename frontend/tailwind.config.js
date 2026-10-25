/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#070A0F",
          900: "#0D121D",
          850: "#121A2A",
          800: "#182337",
          700: "#22314D",
          600: "#314468",
          500: "#4D638B",
          400: "#8295B5",
          300: "#CBD5E1",
          200: "#E2E8F0",
          100: "#F8FAFC"
        },
        cobalt: {
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#2563EB",
          600: "#1D4ED8",
          700: "#1E40AF"
        },
        tealmatch: {
          DEFAULT: "#0D9488",
          light: "#14B8A6",
          dark: "#0F766E",
          bg: "rgba(13, 148, 136, 0.12)",
          border: "rgba(20, 184, 166, 0.35)"
        },
        amberalert: {
          DEFAULT: "#D97706",
          light: "#F59E0B",
          dark: "#B45309",
          bg: "rgba(245, 158, 11, 0.12)",
          border: "rgba(245, 158, 11, 0.35)"
        },
        redcrit: {
          DEFAULT: "#DC2626",
          light: "#EF4444",
          dark: "#B91C1C",
          bg: "rgba(239, 68, 68, 0.12)",
          border: "rgba(239, 68, 68, 0.35)"
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Space Grotesk", "Plus Jakarta Sans", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "Menlo", "Consolas", "monospace"]
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.3)",
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.45)",
        glow: "0 0 25px -5px rgba(37, 99, 235, 0.25)"
      }
    },
  },
  plugins: [],
}
