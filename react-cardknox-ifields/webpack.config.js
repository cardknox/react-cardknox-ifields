
var path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve('./build'),
    filename: 'index.js',
    libraryTarget: 'commonjs2'
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: path.resolve(__dirname, 'src'),
        exclude: /(node_modules|bower_components|build)/,
        options: {
          presets: ['env'],
          plugins: ['transform-class-properties']
        }
      }
    ]
  },
  externals: {
    'react': 'commonjs react'
  }
};