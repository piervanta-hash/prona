import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        petrol: {
          DEFAULT: "#0E2A33",
          900: "#0A1F26",
          800: "#0E2A33",
          700: "#164050",
          600: "#1F5566",
          200: "#C6D6DC",
          100: "#E3ECEF",
          50: "#F2F6F8",
        },
        accent: {
          DEFAULT: "#C8102E",
          700: "#A00D25",
          50: "#FBEAED",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
