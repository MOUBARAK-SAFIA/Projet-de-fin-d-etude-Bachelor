/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      colors: {
        theme: {
          navy: '#0b1a26',
          darkTeal: '#0f3c3d',
          midTeal: '#2b7875',
          cyan: '#3ad9ca',
          lightCyan: '#7af3e7'
        }
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
        'soft': '0 20px 40px -15px rgba(0,0,0,0.05)',
        'cyan': '0 0 20px rgba(58, 217, 202, 0.4)',
      }
    },
  },
  plugins: [],
}
