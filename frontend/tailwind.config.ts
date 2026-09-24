import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'story-progress': {
          from: { width: '0%' },
          to: { width: '100%' },
        },
        'heart-pop': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '15%': { transform: 'scale(1.2)', opacity: '1' },
          '30%': { transform: 'scale(1)' },
          '80%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        'story-progress': 'story-progress 5s linear forwards',
        'heart-pop': 'heart-pop 900ms ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;
