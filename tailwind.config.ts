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
        'cyber-yellow': '#FFD700',
        'cyber-yellow-dark': '#FFC700',
        'cyber-black': '#000000',
        'cyber-dark': '#0A0A0A',
        'cyber-gray': '#1A1A1A',
        'cyber-neon-pink': '#FF00FF',
        'cyber-neon-blue': '#00FFFF',
        'cyber-neon-red': '#FF0040',
        'cyber-text': '#FFFFFF',
        'cyber-text-gray': '#CCCCCC',
      },
      fontFamily: {
        'orbitron': ['Orbitron', 'sans-serif'],
        'roboto': ['Roboto', 'sans-serif'],
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
};
export default config;

