// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname, { isCSSSEnabled: true });

// Expo router setup
const {
  resolver: { sourceExts, assetExts },
} = config;

// Add support for importing specific file types
config.resolver.sourceExts = [...sourceExts, 'mjs', 'cjs'];

// Configure NativeWind
module.exports = withNativeWind(config, { input: './global.css' });
