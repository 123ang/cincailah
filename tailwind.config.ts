import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sambal: {
          DEFAULT: '#FF5A00',
          dark: '#E64000',
          soft: '#FFE1CC',
        },
        mamak: {
          DEFAULT: '#FFC233',
          dark: '#F59E0B',
        },
        pandan: {
          DEFAULT: '#45B619',
          dark: '#2F8F0B',
        },
        ocean: {
          DEFAULT: '#078BCE',
          dark: '#056DA3',
        },
        terung: {
          DEFAULT: '#6D2CB7',
          dark: '#4B1889',
        },
        slate: {
          DEFAULT: '#26140B',
        },
        cream: {
          DEFAULT: '#FFF7EB',
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
