/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ios: {
          50: '#e8f0fe',
          100: '#c7ddfa',
          200: '#92baf6',
          300: '#5a9cf2',
          400: '#2b82ee',
          500: '#007AFF',
          600: '#0062cc',
          700: '#004499',
          800: '#002b66',
          900: '#001433',
          bg: '#F2F2F7',
          card: '#FFFFFF',
          text: '#1C1C1E',
          secondary: '#8E8E93',
          separator: '#C6C6C8',
        },
      },
    },
  },
  plugins: [],
};