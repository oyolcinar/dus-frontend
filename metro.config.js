// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname, { isCSSEnabled: true });

// Expo router setup
const {
  resolver: { sourceExts, assetExts },
} = config;

// Add support for importing specific file types and ensure proper entry point resolution
config.resolver.sourceExts = [...sourceExts, 'mjs', 'cjs', 'js', 'jsx', 'ts', 'tsx', 'json'];
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  // Add any additional module resolutions here if needed
};

// Ensure the entry point is found
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Default resolution
  return null;
};

// Configure NativeWind
module.exports = withNativeWind(config, { input: './global.css' });
