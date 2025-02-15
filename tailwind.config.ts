import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          DEFAULT: "#025392",
          light: "#0271bb",
        },
      },
      dropShadow: {
        primary: "0 0 10px rgba(99, 99, 99, 0.8)",
      },
    },
  },
  plugins: [],
} satisfies Config;
