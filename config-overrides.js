module.exports = {
    webpack: (config) => {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        path: require.resolve('path-browserify'),
        crypto: require.resolve('crypto-browserify'),
        fs: false,  // fs is not needed in the browser environment
        stream: require.resolve('stream-browserify'),
        vm: require.resolve('vm-browserify') // Add polyfill for `vm`
      };
      return config;
    },
  };
  