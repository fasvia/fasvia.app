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
        background: "var(--background)",
        foreground: "var(--foreground)",
        'bg-primary': '#09090F',
        'surface': '#1A1530',
        'purple-primary': '#7C3AED',
        'purple-accent': '#A855F7',
        'border-subtle': 'rgba(139, 92, 246, 0.15)',
        'text-muted': 'rgba(255, 255, 255, 0.55)',
        brand: {
          primary: '#7C3AED',
          accent: '#A855F7',
          bg: '#09090F',
          surface: '#1A1530',
        }
      },
    },
  },
  plugins: [],
};
export default config;
