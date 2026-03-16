import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#244019",
        leaf: "#58cc02",
        moss: "#46a302",
        yolk: "#ffd93d",
        cream: "#fbfff2",
        mist: "#eff9d9",
        mint: "#e8ffd1",
      },
      boxShadow: {
        float: "0 24px 80px rgba(73, 117, 16, 0.14)",
        bubble: "0 14px 30px rgba(88, 204, 2, 0.08)",
      },
      backgroundImage: {
        meadow:
          "radial-gradient(circle at top left, rgba(255, 244, 152, 0.95), transparent 34%), radial-gradient(circle at top right, rgba(166, 235, 91, 0.65), transparent 28%), linear-gradient(180deg, #faffec 0%, #eff9d9 54%, #f7ffe8 100%)",
      },
      fontFamily: {
        display: ['Georgia', '"Iowan Old Style"', '"Palatino Linotype"', "serif"],
        body: ['"Avenir Next"', "Avenir", "ui-rounded", '"Trebuchet MS"', "sans-serif"],
      },
      animation: {
        pulseSoft: "pulseSoft 1.4s infinite",
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.04)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
