const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Disable package exports for better compatibility
config.resolver.unstable_enablePackageExports = false;

// Add custom resolver aliases
config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
  '@ui': path.resolve(__dirname, 'src/ui'),
  '@components': path.resolve(__dirname, 'src/components'),
  '@theme': path.resolve(__dirname, 'src/theme'),
  '@context': path.resolve(__dirname, 'src/context'),
  '@features': path.resolve(__dirname, 'src/features'),
  '@lib': path.resolve(__dirname, 'src/lib'),
  '@hooks': path.resolve(__dirname, 'src/hooks'),
  '@api': path.resolve(__dirname, 'src/api'),
};

module.exports = withNativeWind(config, { input: './global.css' });
