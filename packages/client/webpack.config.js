const path = require("path");

const webpack = require("webpack");
const Copy = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const nodeEnv = process.env.NODE_ENV || "development";
const isProd = nodeEnv === "production";

module.exports = [
  {
    mode: "none",
    name: "vpnht-app",
    resolve: {
      extensions: [".js", ".jsx", ".json"]
    },
    entry: "./app/index.js",
    output: {
      path: path.join(__dirname, "target"),
      filename: "index.js"
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          loader: "babel-loader"
        }
      ]
    },
    plugins: [
      new Copy([
        {
          from: "./app/*.html",
          exclude: /node_modules/,
          to: ".",
          flatten: true
        },
        {
          from: "./app/*.json",
          exclude: /node_modules/,
          to: ".",
          flatten: true
        },
        {
          from: "./app/static",
          to: "./static"
        }
      ])
    ],
    target: "electron-main"
  },
  {
    mode: "none",
    name: "vpnht",
    resolve: {
      extensions: [".js", ".jsx"]
    },
    devtool: isProd ? "hidden-source-map" : "cheap-module-source-map",
    entry: "./lib/index.js",
    output: {
      path: path.join(__dirname, "target", "renderer"),
      filename: "bundle.js"
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          loader: "babel-loader"
        },
        // Extract all .global.css to style.css as is
        {
          test: /\.global\.css$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                publicPath: "./"
              }
            },
            {
              loader: "css-loader",
              options: {
                sourceMap: true
              }
            },
            {
              loader: "postcss-loader"
            }
          ]
        },
        // Pipe other styles through css modules and append to style.css
        {
          test: /^((?!\.global).)*\.css$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader
            },
            {
              loader: "css-loader",
              options: {
                modules: true,
                importLoaders: 1
              }
            }
          ]
        }
      ]
    },
    optimization: {
      minimizer: [new OptimizeCSSAssetsPlugin()]
    },
    plugins: [
      new webpack.IgnorePlugin(/.*\.js.map$/i),

      new webpack.DefinePlugin({
        "process.env": {
          NODE_ENV: JSON.stringify(nodeEnv)
        }
      }),
      new Copy([
        {
          from: "./assets",
          to: "./assets"
        }
      ]),
      new MiniCssExtractPlugin({
        filename: "style.css"
      })
    ],
    target: "electron-renderer"
  }
];
