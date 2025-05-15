// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
let config = getDefaultConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true, // Often recommended for web support, good to have
});

config = withNativeWind(config, {
  input: './global.css', // Make sure this path is correct
  // Can try adding outputDir if issues persist, though often not needed
  // outputDir: "./node_modules/.cache/nativewind",
});

module.exports = config;
