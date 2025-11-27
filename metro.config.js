const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver = {
  ...defaultConfig.resolver,
  sourceExts: [...defaultConfig.resolver.sourceExts, 'cjs'],
};

module.exports = mergeConfig(defaultConfig, {});
