/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
       colors: {
      emerald: {
        500: '#10b981',
        600: '#059669',
        700: '#047857',
      },
    },
    },
  },
  plugins: [],
}

