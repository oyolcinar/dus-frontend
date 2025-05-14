const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname, { isCSSEnabled: true });

config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'mjs',
  'cjs',
  'jsx',
  'ts',
  'tsx',
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  try {
    const defaultResult = null;

    return defaultResult;
  } catch (error) {
    console.warn('Metro resolver error:', error);
    return null;
  }
};

module.exports = withNativeWind(config, { input: './global.css' });
