const moduleConfig = {
  rules: [
    {
      test: /\.pug?$/,
      exclude: /(node_modules|lib\/)/,
      use: {
        loader: 'pug-loader'
      }
    },
    {
      test: /\.(j|t)sx?$/,
      exclude: /(node_modules|lib\/)/,
      use: {
        loader: "babel-loader",
        options: {
          cacheDirectory: true,
          babelrc: false,
          
          presets: [
            [
              "@babel/preset-env",
              { targets: { electron: "5.0.1" } } // or whatever your project requires
            ],
            "@babel/preset-typescript",
            "@babel/preset-react"
          ],
          plugins: [
            // plugin-proposal-decorators is only needed if you're using experimental decorators in TypeScript
            ["@babel/plugin-syntax-dynamic-import"],
            ["@babel/plugin-proposal-decorators", { legacy: true }],
            ["@babel/plugin-proposal-class-properties", { loose: true }],
            "react-hot-loader/babel"
          ]
        }
      }
    }
  ]
}

export default moduleConfig
