/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    // Add other paths if you have UI components elsewhere
  ],
  presets: [require('nativewind/preset')], // Essential for NativeWind
  theme: {
    extend: {
      colors: {
        // Your main brand colors
        primary: {
          light: '#d9c5e9', // For classes like text-primary-light, bg-primary-light
          DEFAULT: '#722ea5', // For classes like text-primary, bg-primary, border-primary
          dark: '#5e2587', // For classes like text-primary-dark, bg-primary-dark
        },
        // Your secondary colors
        secondary: {
          light: '#ffd580',
          DEFAULT: '#f8a100',
          dark: '#cc8400',
        },
        // Status colors
        success: '#21b958',
        error: '#ec1c24',
        info: '#00b7ef',
        warning: '#fbd000',

        // Background and text colors (using more descriptive names)
        // Tailwind already provides `bg-white`, `bg-black`, `text-white`, `text-black`,
        // and a wide range of grays (e.g., `bg-gray-100`, `text-gray-700`).
        // You typically only need to add these if you want to *override* Tailwind's defaults
        // or create very specific named colors.
        // For now, I'll assume you'll use Tailwind's built-in grays for general light/dark text/bg.
        // If you had specific shades for `bg-light`, `text-muted-dark` etc., you can add them here:
        // e.g.,
        // 'app-bg-light': '#ffffff', // if different from Tailwind's white
        // 'app-text-muted-dark': '#9ca3af', // if different from Tailwind's gray-400/500
      },
      // If you have custom fonts, define them here (example)
      // fontFamily: {
      //   sans: ['Poppins-Regular', 'sans-serif'], // Your default font
      //   poppinsBold: ['Poppins-Bold', 'sans-serif'], // Another font weight/style
      // },
    },
  },
  plugins: [
    // You can add Tailwind plugins here if needed, e.g., @tailwindcss/forms
  ],
};
