/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        red: {
          500: '#ff3c3c',
          600: '#e53535',
          700: '#cc0000',
        }
      }
    },
  },
  plugins: [],
}