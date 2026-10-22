import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#060812",
        surface: "#0e121d",
        "surface-card": "#131826",
        "surface-hover": "#1c2336",
        border: "#232c40",
        // Primary brand — Discord Blurple
        "brand-blue": "#5865F2",
        // Aliases kept so existing class references compile without breakage
        "brand-purple": "#5865F2",
        "brand-violet": "#5865F2",
        "brand-indigo": "#6366f1",
        "brand-lilac": "#5865F2",
        // Functional accents
        "brand-red": "#e74c3c",
        "brand-crimson": "#ff4757",
        "accent-cyan": "#00d4ff",
        "accent-emerald": "#10b981",
        "accent-amber": "#f59e0b",
      },
      boxShadow: {
        // Single restrained elevation shadow — replaces all glow variants
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.3)",
        card: "0 4px 16px -4px rgba(0, 0, 0, 0.5)",
        elevated: "0 8px 30px -8px rgba(0, 0, 0, 0.6)",
        // Keep legacy names so existing pages compile — point to subtle values
        glow: "0 4px 16px -4px rgba(0, 0, 0, 0.5)",
        "glow-lg": "0 8px 30px -8px rgba(0, 0, 0, 0.6)",
        "glow-purple": "0 4px 16px -4px rgba(0, 0, 0, 0.5)",
        "glow-cyan": "0 4px 16px -4px rgba(0, 0, 0, 0.5)",
        "glow-green": "0 4px 16px -4px rgba(0, 0, 0, 0.5)",
      },
    },
  },
  plugins: [],
};
export default config;
