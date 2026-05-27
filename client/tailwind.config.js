/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        smzdm: {
          red: '#FF0036',
          orange: '#FF6A00',
          bg: '#F5F5F5',
          card: '#FFFFFF',
          text: '#333333',
          secondary: '#999999',
          tag: '#FFF0F0',
        },
      },
    },
  },
  plugins: [],
};