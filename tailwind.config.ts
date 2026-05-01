import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "serif"],
      },
      colors: {
        derby: {
          rose: "#b91c4c",
          gold: "#c8a04b",
          ink: "#1a1208",
          cream: "#f7f2e7",
        },
      },
    },
  },
  plugins: [],
};
export default config;
