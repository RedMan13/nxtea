const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const { IgnorePlugin, ProvidePlugin } = require('webpack');

const output = path.resolve(__dirname, './nxtea');
module.exports = {
    mode: 'development',
    devtool: 'inline-cheap-source-map',
    entry: {
        VirtualMachine: require.resolve('./src/virtual-machine.js'),
        NXTCommunication: require.resolve('./src/nxt-communication.js'),
        Renderer: require.resolve('nxtRICfileUtil'),
        JSZip: require.resolve('jszip')
    },
    resolve: {
        fallback: { stream: false }
    },
    output: {
        filename: '[name].js',
        path: output,
        library: ['NXT', '[name]']
    },
    module: {
        rules: [{
            test: /\.m?js$/,
            exclude: /node_modules/,
            use: [{
                loader: 'babel-loader',
                options: {
                    presets: [['@babel/preset-env']]
                }
            }]
        }]
    },
    plugins: [
        new IgnorePlugin({
            resourceRegExp: /^(?:usb|node-bluetooth-serial-port)$/i
        }),
        new ProvidePlugin({
            Buffer: ['buffer', 'Buffer']
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, './demo/emulator.html'),
                    to: path.resolve(__dirname, output, './index.html')
                },
                {
                    from: path.resolve(__dirname, './demo/demo.zip'),
                    to: path.resolve(__dirname, output, './demo.zip')
                },
                {
                    from: path.resolve(__dirname, './demo/assets'),
                    to: path.resolve(__dirname, output, './assets')
                }
            ]
        })
    ]
}