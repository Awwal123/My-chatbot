import { Configuration } from "webpack";

const webpack = require('webpack');

module.exports = function override(config: Configuration, env: string): Configuration {
  // Ensure that config.resolve exists before assigning fallback
  if (!config.resolve) {
    config.resolve = {}; // Initialize if undefined
  }
  config.resolve.fallback = {
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "util": require.resolve("util/"),
    "buffer": require.resolve("buffer/"),
    "assert": require.resolve("assert/"),
  };

  // Ensure that config.plugins exists before pushing to it
  if (!config.plugins) {
    config.plugins = []; // Initialize if undefined
  }
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  );

  return config;
};
