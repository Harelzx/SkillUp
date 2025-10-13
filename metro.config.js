const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');
const fs = require('fs');

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

// Symbolicator configuration to prevent ENOENT crashes on InternalBytecode.js
// and other non-existent files during stack trace symbolication
config.symbolicator = {
  customizeFrame: (frame) => {
    if (!frame || !frame.file) {
      return frame;
    }

    const file = frame.file;
    
    // Common crash: InternalBytecode.js (Hermes internal bytecode frames)
    const isInternalBytecode = file.endsWith('InternalBytecode.js');
    
    // ENOENT crashes occur when trying to read files that don't exist on disk
    // Only check existence for absolute paths to avoid false negatives
    const isAbsolutePath = path.isAbsolute(file);
    const fileExists = !isAbsolutePath || fs.existsSync(file);
    
    // Mark problematic frames as collapsed to prevent Metro from trying to read them
    if (isInternalBytecode || !fileExists) {
      return { ...frame, collapse: true };
    }
    
    return frame;
  },
};

module.exports = withNativeWind(config, { input: './global.css' });
