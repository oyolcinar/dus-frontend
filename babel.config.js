// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      // For Expo SDK 50+, the expo-router/babel plugin is replaced by this configuration
      'expo-router/babel',
      'react-native-reanimated/plugin',
    ],
  };
};
