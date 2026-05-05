import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff7f2",
          100: "#ffeadd",
          200: "#fdd1b5",
          300: "#fbb085",
          400: "#f78a52",
          500: "#ef6a2b",
          600: "#d8501a",
          700: "#b13d14",
          800: "#8a3010",
          900: "#65240c"
        },
        ink: {
          50: "#f7f7f8",
          100: "#eceef1",
          200: "#d3d7de",
          300: "#a8b0bd",
          400: "#7a8497",
          500: "#566073",
          600: "#3f4757",
          700: "#2e3543",
          800: "#1f2531",
          900: "#11151c"
        },
        cream: "#fbf7f2"
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Georgia", "Cambria", "Times New Roman", "serif"]
      },
      boxShadow: {
        soft: "0 8px 24px -8px rgba(17, 21, 28, 0.12)",
        card: "0 12px 32px -12px rgba(17, 21, 28, 0.18)"
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem"
      }
    }
  },
  plugins: []
};

export default config;
