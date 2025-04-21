const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');
/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    assetExts: ['bin', 'txt', 'jpg', 'png', 'ttf'],
    sourceExts: ['js', 'json', 'ts', 'tsx', 'jsx'],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
    // ปรับแต่ง transformer ให้รองรับไฟล์ TensorFlow.js
    babelTransformerPath: require.resolve('react-native-css-transformer'),
  },
  // ปรับแต่ง watchFolders ให้รองรับโมดูลของ TensorFlow.js
  watchFolders: [path.resolve(__dirname, 'node_modules')],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
