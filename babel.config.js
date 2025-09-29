module.exports = function (api) {
  api.cache(true);

  return {
    presets: [['babel-preset-expo'], 'nativewind/babel'],

    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],

          alias: {
            '@': './src',
            '@ui': './src/ui',
            '@components': ['./src/components', './components'],
            '@theme': './src/theme',
            '@context': './src/context',
            '@features': './src/features',
            '@lib': './src/lib',
            '@hooks': './src/hooks',
            '@api': './src/api',
            'tailwind.config': './tailwind.config.js',
          },
        },
      ],
      'react-native-worklets/plugin',
    ],
  };
};
