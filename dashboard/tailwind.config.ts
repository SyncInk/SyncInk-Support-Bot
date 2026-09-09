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
        background: "#0a0c10",
        surface: "#11141c",
        "surface-card": "#161b26",
        "surface-hover": "#1c2331",
        border: "#232b3b",
        "brand-red": "#e74c3c",
        "brand-crimson": "#ff4757",
        "brand-glow": "rgba(231, 76, 60, 0.15)",
        "accent-cyan": "#00d2d3",
        "accent-emerald": "#10b981",
        "accent-amber": "#f59e0b",
      },
      boxShadow: {
        glow: "0 0 20px -5px rgba(231, 76, 60, 0.3)",
        "glow-lg": "0 0 30px -5px rgba(231, 76, 60, 0.4)",
        "glow-cyan": "0 0 20px -5px rgba(0, 210, 211, 0.3)",
        "glow-green": "0 0 20px -5px rgba(16, 185, 129, 0.3)",
      },
    },
  },
  plugins: [],
};
export default config;
