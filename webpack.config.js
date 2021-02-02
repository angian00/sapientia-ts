const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");


module.exports = env => {
	let bundlingMode = process.env.NODE_ENV || 'development'
	console.log(`building mode: ${bundlingMode}`)

	return {
		mode: bundlingMode,

		entry: './src/index.ts',

		output: {
			path: path.resolve(__dirname, 'dist'),
			filename: 'main.js',
			pathinfo: false
		},

		devtool: 'source-map',

		optimization: {
			removeAvailableModules: false,
			removeEmptyChunks: false,
			splitChunks: false,
		},

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
	}
};
