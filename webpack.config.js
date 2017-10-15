module.exports = {
  module: {
    rules: [{
      test: /\.js$/,
      exclude: function (modulePath) {
        return /node_modules/.test(modulePath) &&
           !/src.node_modules/.test(modulePath)
      },
      use: [
        {
          loader: 'babel-loader'
        }
      ]
    }]
  }
}
