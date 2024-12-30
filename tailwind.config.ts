import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji",
        ],
        head: ["Dela Gothic One", "Montserrat", "Segoe UI"],
        mono: ["Menlo-Regular", "monospace"],
      },
      backgroundImage: {
        "hero-pattern": "url('/backgroundafaq.png')",
        "crt-pattern": "url('/crt.png')",
      },
    },
  },
  plugins: [],
} satisfies Config;
