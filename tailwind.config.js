/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#d9c5e9',
          DEFAULT: '#722ea5',
          dark: '#5e2587',
        },
        secondary: {
          light: '#ffd580',
          DEFAULT: '#f8a100',
          dark: '#cc8400',
        },
        success: '#21b958',
        error: '#ec1c24',
        info: '#00b7ef',
        warning: '#fbd000',
      },
    },
  },
  plugins: [],
};
