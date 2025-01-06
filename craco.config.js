module.exports = {
    webpack: {
      configure: (webpackConfig) => {
        webpackConfig.resolve.fallback = {
          ...webpackConfig.resolve.fallback,
          path: require.resolve("path-browserify"),
          crypto: require.resolve("crypto-browserify"),
          fs: false, // fs is not needed in the browser environment
          stream: require.resolve("stream-browserify"),
        };
        return webpackConfig;
      },
    },
  };
  