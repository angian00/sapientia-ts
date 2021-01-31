const path = require('path');

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
		]
	}
};
