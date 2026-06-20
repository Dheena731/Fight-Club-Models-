/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        arena: {
          bg: '#0a0a0f',
          card: '#13131a',
          border: '#1e1e2e',
        },
        claude: { DEFAULT: '#D97757', dim: '#a05a3f' },
        gpt:    { DEFAULT: '#10A37F', dim: '#0a7359' },
        gemini: { DEFAULT: '#4285F4', dim: '#2a5fbe' },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
      },
      keyframes: {
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-6px)' },
          '75%': { transform: 'translateX(6px)' },
        },
        'slide-up': {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%,100%': { opacity: 0.7 },
          '50%': { opacity: 1 },
        },
      },
      animation: {
        shake: 'shake 0.35s ease-in-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

