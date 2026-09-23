import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1e293b",
          dark: "#0f172a",
          light: "#334155",
        },
        action: {
          DEFAULT: "#2563eb",
          hover: "#1d4ed8",
          light: "#dbeafe",
        },
      },
    },
  },
  plugins: [],
};
export default config;
