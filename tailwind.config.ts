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
        l: {
            100: "#ccc5b9",
            200: "#fffcf2",
        },
        d: {
            100: "#403d39",
            200: "#252422",
        },
        ac: "#eb5e28",
      },
    },
    container: {
      center: true,
      padding: "2rem",
    }
  },
  plugins: [],
};
export default config;
