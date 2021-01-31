const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");


module.exports = {
	// bundling mode
	//mode: 'production',
	mode: 'development',

	// entry files
	entry: './src/index.ts',

	// output bundles (location)
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'main.js',
		pathinfo: false
	},

	devtool: 'source-map',  // generate source map

	optimization: {
		removeAvailableModules: false,
		removeEmptyChunks: false,
		splitChunks: false,
	},

	// file resolutions
	resolve: {
		extensions: ['.ts', '.js'],
	},

	// loaders
	module: {
		rules: [
			{
				test: /\.tsx?/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'ts-loader',
						options: {
							transpileOnly: true,
							experimentalWatchApi: true,
						},
					},
  				],
			}
		],
	},

	plugins: [
		new CopyPlugin({
			patterns: [
				{ from: "html" },
				{ from: "media", to: "media" },
				{ from: "data", to: "data" },
			],
			options: {
				concurrency: 100,
			},
		}),
	],
};
