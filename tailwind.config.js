/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: '#f0f0f5',
          100: '#e1e1eb',
          200: '#c3c3d7',
          300: '#a5a5c3',
          400: '#8787af',
          500: '#1a1a2e',
          600: '#151526',
          700: '#10101e',
          800: '#0a0a16',
          900: '#05050e',
        },
        secondary: {
          50: '#fff5f0',
          100: '#ffebe0',
          200: '#ffd6c0',
          300: '#ffc2a0',
          400: '#ffad80',
          500: '#ff6b35',
          600: '#e65f30',
          700: '#cc532b',
          800: '#b34726',
          900: '#993b21',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
