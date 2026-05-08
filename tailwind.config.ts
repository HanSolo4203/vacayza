import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "vacayza-black": "#0A0A0A",
        "vacayza-amber": "#C9903A",
        "vacayza-muted": "#666666",
        "vacayza-off-white": "#C8C0B0",
      },
    },
  },
  plugins: [],
};

export default config;
