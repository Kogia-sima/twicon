var path = require('path');
var HardSourceWebpackPlugin = require('hard-source-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    library: 'main',
    libraryTarget: 'global'
  },
  target: 'node',
  module: {
    rules: [
      {
        test: /\.node$/,
        use: 'node-loader'
      }
    ]
  },
  plugins: [
    new HardSourceWebpackPlugin()
  ]
};
