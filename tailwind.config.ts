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
        sambal: {
          DEFAULT: '#DC2626',
          dark: '#B91C1C',
        },
        mamak: {
          DEFAULT: '#FACC15',
          dark: '#EAB308',
        },
        pandan: {
          DEFAULT: '#10B981',
          dark: '#059669',
        },
        slate: {
          DEFAULT: '#0F172A',
        },
        cream: {
          DEFAULT: '#F8FAFC',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
