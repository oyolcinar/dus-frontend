module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    'nativewind/postcss': {
      // Explicitly set async to false
      async: false,
    },
  },
};
