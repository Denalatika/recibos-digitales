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
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary, #0b192c)",
          dark: "var(--primary-dark, #060d17)",
          light: "var(--primary-light, #1e293b)",
        },
        accent: {
          DEFAULT: "var(--accent, #00a8cc)",
          dark: "var(--accent-dark, #0891b2)",
          light: "var(--accent-light, #38bdf8)",
        },
      },
      screens: {
        print: { raw: "print" },
      },
    },
  },
  plugins: [],
};
export default config;
