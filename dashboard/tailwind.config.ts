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
        "brand-purple": "#9d7cff",
        "brand-violet": "#8b5cf6",
        "brand-indigo": "#6366f1",
        "brand-lilac": "#c084fc",
        "brand-red": "#e74c3c",
        "brand-crimson": "#ff4757",
        "brand-glow": "rgba(157, 124, 255, 0.2)",
        "accent-cyan": "#00d2d3",
        "accent-emerald": "#10b981",
        "accent-amber": "#f59e0b",
      },
      boxShadow: {
        glow: "0 0 25px -4px rgba(157, 124, 255, 0.35)",
        "glow-lg": "0 0 35px -5px rgba(139, 92, 246, 0.5)",
        "glow-purple": "0 0 30px -4px rgba(157, 124, 255, 0.45)",
        "glow-cyan": "0 0 20px -5px rgba(0, 210, 211, 0.3)",
        "glow-green": "0 0 20px -5px rgba(16, 185, 129, 0.3)",
      },
    },
  },
  plugins: [],
};
export default config;
