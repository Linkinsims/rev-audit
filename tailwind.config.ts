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
        background: {
          primary: "#0a0a0f",
          secondary: "#12121a",
          tertiary: "#1a1a24",
          hover: "#22222e",
        },
        border: {
          DEFAULT: "#2a2a36",
          active: "#3d3d4d",
        },
        text: {
          primary: "#f0f0f5",
          secondary: "#a0a0b0",
          tertiary: "#606070",
        },
        accent: {
          primary: "#3b82f6",
          success: "#10b981",
          warning: "#f59e0b",
          error: "#ef4444",
          purple: "#8b5cf6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;