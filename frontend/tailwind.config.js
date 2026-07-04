import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(214 32% 18%)',
        background: 'hsl(222 47% 6%)',
        foreground: 'hsl(210 40% 96%)',
        muted: 'hsl(217 32% 14%)',
        primary: 'hsl(168 76% 42%)',
        danger: 'hsl(0 84% 60%)',
        warning: 'hsl(38 92% 50%)'
      }
    }
  },
  plugins: [animate]
};
