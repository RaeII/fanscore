/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2a1b49',
        secondary: '#f24952',
        'background-dark': '#0d0117',
        'background-light': '#fafafa'
      }
    },
  },
  darkMode: 'class',
  plugins: [],
} 