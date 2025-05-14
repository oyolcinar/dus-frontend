module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      // Remove expo-router/babel since it's deprecated in SDK 50
      // 'expo-router/babel',
      'react-native-reanimated/plugin',
    ],
  };
};
