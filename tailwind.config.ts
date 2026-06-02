import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f5f7fa",
          100: "#e4e8ee",
          200: "#c6cdd8",
          300: "#9ba6b7",
          400: "#6f7d92",
          500: "#4f5d72",
          600: "#3c485c",
          700: "#2f3a4b",
          800: "#1f2735",
          900: "#131923",
        },
        accent: {
          50: "#eff8ff",
          100: "#daeefe",
          200: "#bee0fd",
          300: "#92cbfb",
          400: "#5fadf7",
          500: "#398df2",
          600: "#2371e6",
          700: "#1c5cd3",
          800: "#1e4caa",
          900: "#1e4286",
        },
        good: { 500: "#10b981", 600: "#059669" },
        warn: { 500: "#f59e0b", 600: "#d97706" },
        bad: { 500: "#ef4444", 600: "#dc2626" },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
