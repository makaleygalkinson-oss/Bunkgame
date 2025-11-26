import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'cs-orange': '#FF6B00',
        'cs-orange-dark': '#E55A00',
        'cs-yellow': '#FFD700',
        'cs-dark': '#0A0A0A',
        'cs-dark-gray': '#1A1A1A',
        'cs-gray': '#2A2A2A',
        'cs-light-gray': '#3A3A3A',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
export default config

