/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bunker: {
          dark: '#0a0a0a',
          darker: '#050505',
          accent: '#ff6b35',
          accentHover: '#ff8c5a',
          safe: '#4ade80',
          danger: '#ef4444',
        },
      },
      animation: {
        'card-flip': 'flip 0.6s ease-in-out',
        'fade-in': 'fadeIn 0.3s ease-in',
      },
      keyframes: {
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(360deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

