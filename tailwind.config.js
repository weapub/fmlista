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
          50: '#fef2f2',
          100: '#ffe1e1',
          200: '#ffc8c8',
          300: '#ffa2a2',
          400: '#fc7474',
          500: '#f26968',
          600: '#db4b4b',
          700: '#b93232',
          800: '#962525',
          900: '#7a1d1d',
        },
        secondary: {
          50: '#fef2f2',
          100: '#ffe1e1',
          200: '#ffc8c8',
          300: '#ffa2a2',
          400: '#fc7474',
          500: '#f26968',
          600: '#db4b4b',
          700: '#b93232',
          800: '#962525',
          900: '#7a1d1d',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
