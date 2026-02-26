import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["IBM Plex Mono", "monospace"],
      },
      screens: {
        xs: "500px",
        sm: "640px",
        mm: "750px",
        md: "900px",
        lg: "1200px",
        xl: "1440px",
        "2xl": "1536px",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "my-grey": "#9FA493",
        primary: "#057C7C",
      },
    },
  },
  plugins: [],
};
export default config;
