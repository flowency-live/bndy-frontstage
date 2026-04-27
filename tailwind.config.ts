import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Preserve map tile CSS class applied dynamically in MapContainer
    'map-tiles-blue',
  ],
  theme: {
    extend: {
      fontFamily: {
        // New list view fonts
        anton: ["var(--font-anton)", "Impact", "sans-serif"],
        archivo: ["var(--font-archivo)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "Courier New", "monospace"],
        // Legacy support
        display: ["var(--font-anton)", "Impact", "sans-serif"],
        body: ["var(--font-archivo)", "system-ui", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        "card-bg": "var(--card-bg)",
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        // List view colors
        lv: {
          bg: "var(--lv-bg)",
          "bg-2": "var(--lv-bg-2)",
          surface: "var(--lv-surface)",
          "surface-2": "var(--lv-surface-2)",
          rule: "var(--lv-rule)",
          "rule-strong": "var(--lv-rule-strong)",
          text: "var(--lv-text)",
          "text-2": "var(--lv-text-2)",
          "text-3": "var(--lv-text-3)",
          orange: "var(--lv-orange)",
          "orange-soft": "var(--lv-orange-soft)",
          cyan: "var(--lv-cyan)",
          "cyan-soft": "var(--lv-cyan-soft)",
          green: "var(--lv-green)",
          "green-soft": "var(--lv-green-soft)",
        },
      },
      borderRadius: {
        sm: "0.25rem",
        md: "0.5rem",
        lg: "0.75rem",
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(0,0,0,0.05)",
        card: "0 4px 12px rgba(0,0,0,0.08)",
        elevated: "0 8px 24px rgba(0,0,0,0.12)",
      },
    },
  },
  plugins: [],
} satisfies Config;
