/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#F5F1E8',
          dark: '#E8E4DB',
        },
        burnt: {
          DEFAULT: '#CC5500',
          dark: '#A34400',
        },
        forest: {
          DEFAULT: '#2C5530',
          light: '#3D7344',
        },
        charcoal: {
          DEFAULT: '#2B2B2B',
          light: '#4A4A4A',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
