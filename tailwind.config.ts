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
        orbitron: ['Orbitron', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
      },
      animation: {
        'glitch': 'glitch 3s infinite',
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'line-flow': 'line-flow 2s ease-in-out infinite',
        'grid-move': 'grid-move 20s linear infinite',
        'shine': 'shine 3s infinite',
      },
      keyframes: {
        glitch: {
          '0%, 100%': { opacity: '0' },
          '50%': { opacity: '1' },
        },
        'pulse-neon': {
          '0%, 100%': { 
            transform: 'scale(1)',
            filter: 'drop-shadow(0 0 20px #00FFFF)',
          },
          '50%': { 
            transform: 'scale(1.05)',
            filter: 'drop-shadow(0 0 30px #00FFFF)',
          },
        },
        'line-flow': {
          '0%, 100%': { 
            opacity: '0.5',
            transform: 'scaleX(0.8)',
          },
          '50%': { 
            opacity: '1',
            transform: 'scaleX(1)',
          },
        },
        'grid-move': {
          '0%': { transform: 'translate(0, 0)' },
          '100%': { transform: 'translate(50px, 50px)' },
        },
        'shine': {
          '0%': { left: '-100%' },
          '100%': { left: '100%' },
        },
      },
    },
  },
  plugins: [],
}
export default config


