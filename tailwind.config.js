/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        shopee: {
          orange: '#ee4d2d',
          orangeHover: '#d73211',
          lightOrange: '#fff5f1',
          darkOrange: '#c93414',
          bg: '#f5f5f5',
        }
      }
    },
  },
  plugins: [],
}
