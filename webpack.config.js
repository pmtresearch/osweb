// webpack.config.js - Common settings
var webpack = require('webpack');
var path = require('path');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

var settings = {
   devtool: 'cheap-module-source-map',
   entry: [
      path.join(__dirname, 'src', 'entry.js')
   ],
   output: {
      path: path.join(__dirname, 'osweb'),
      filename: 'js/osweb.js',
   },
   module: {
      loaders: [{
         test: /\.ts$/,
         loader: 'ts-loader'
      }, {
         test: /\.(png|jpg)$/,
         loader: 'url-loader?limit=8192&name=images/[hash].[ext]' // inline base64 URLs for <=8k images, direct URLs for the rest
      }, {
         test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
         loader: 'url-loader?limit=10000&mimetype=application/font-woff&name=fonts/[hash].[ext]'
      }, {
         test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
         loader: 'url-loader?limit=10000&mimetype=application/octet-stream&name=fonts/[hash].[ext]'
      }, {
         test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
         loader: 'file-loader?name=fonts/[hash].[ext]'
      }, {
         test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
         loader: 'url-loader?limit=10000&mimetype=image/svg+xml&name=fonts/[hash].[ext]'
      }],
   },
   plugins: [
      new HtmlWebpackPlugin({
         template: 'src/html/index.ejs',
         inject: 'head',
         title: 'OSWeb 2.0',
         favicon: './src/img/osdoc.png'
      }),
      new webpack.NamedModulesPlugin(),
      new CopyWebpackPlugin([
         { from: 'src/js/dependencies/gzip.js', to: 'js/' },
         { from: 'experiments/examples/*.osexp', to: 'osexp/', flatten: true },
         { from: 'experiments/rorschach/*.osexp', to: 'osexp/' flatten: true }
      ],{debug: 'info'})
   ],
   node: {
      fs: 'empty'
   }
};

// Change settings depending on if production or devserver flags have been
// passed.
module.exports = function(env) {
   if (!env || env.development) {
      settings.plugins.push(
         new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('development')
         }, {
            test: /\.(js|ts)$/,
            exclude: /(node_modules|bower_components)/,
            loader: 'babel-loader?cacheDirectory=true',
            query: {
               presets: ['env']
            }
         })
      );
   }
   if (!env || env.development || env.production) {
      settings.module.loaders.push({
         test: /\.css$/,
         loader: ExtractTextPlugin.extract({
            fallback: "style-loader",
            use: "css-loader"
         })
      }, {
         test: /\.scss$/,
         loader: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            //resolve-url-loader may be chained before sass-loader if necessary 
            use: ['css-loader', 'sass-loader']
         })
      });
      settings.plugins.push(new ExtractTextPlugin('css/styles.css'));
   }

   if (env && (env.devserver || env.production)) {
      if (env.devserver) {
         settings.module.loaders.push({
            test: /\.scss$/,
            loaders: 'style-loader!css-loader!sass-loader'
         }, {
            test: /\.css$/,
            loader: 'style-loader!css-loader'
         });
         settings.plugins.push(
            new webpack.DefinePlugin({
               'process.env.NODE_ENV': JSON.stringify('devserver')
            }),
            new webpack.HotModuleReplacementPlugin()
         )

         settings.devServer = {
            contentBase: './public_html',
            hot: true
         }
      } else if (env.production) {
         settings.devtool = 'source-map',
            settings.module.loaders.push({
               test: /\.(js|ts)$/,
               exclude: /(node_modules|bower_components)/,
               loader: 'babel-loader?cacheDirectory=true',
               query: {
                  presets: ['env']
               }
            });

         settings.plugins.push(
            new webpack.DefinePlugin({
               'process.env.NODE_ENV': JSON.stringify('production')
            }),
            new webpack.optimize.UglifyJsPlugin({
               compressor: {
                  warnings: false,
               },
            }),
            new webpack.optimize.OccurrenceOrderPlugin()
         );
      }
   }
   return settings;
}
