/**
 * 项目名称 - 版本号
 * 类名称
 * @author : lenovo
 * 基础类
 * @description : 请添加描述信息
 * @date : 2017/3/21
 */
"use strict";
//init
const webpack = require("webpack");


//File ops
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ExtractTextWebpackPlugin = require("extract-text-webpack-plugin");

//Folder ops
const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");

//Constants
const SRC = path.join(__dirname,'src');
const BUILD = path.join(__dirname,'dist');
const TEMPLATES = path.join(__dirname,'src/template');
const PUBLIC = path.join(__dirname,'src/public');


module.exports={
    entry: {
        main:SRC+"/script/Chart.js",
        common:['d3']
    },
    output:{
        path:BUILD,
       // publicPath: 'http://localhost:8088',
        filename:'js/[name].js'
    },
    resolve:{
        extensions: ['.js', '.jsx', '.scss', '.css']
    },
    module:{

        noParse: /node_modules\/json-schema\/lib\/validate\.js/,
        loaders:[
            {
                /**使用ESLint
                 * npm --save-dev install eslint
                 * npm --save-dev install eslint-loader
                 * **/
                test:/\.(js|es6)$/,
                exclude: /(node_modules)/,
                loader:["babel-loader"]//, 'eslint-loader'
            },
            {
                test: /\.css$/,
                use:ExtractTextWebpackPlugin.extract({
                    use:"css-loader"
                })
            }
        ]
    },
    plugins:[
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development') // eslint-disable-line quote-props
            }
        }),
        new ExtractTextWebpackPlugin(BUILD+'/css/styles.css'),
        //将类库代码与应用代码分开的关键插件，它从根本上允许我们从不同的 bundle 中提取所有的公共模块，并且将他们加入公共 bundle 中。如果公共 bundle 不存在，那么它将会创建一个出来。
        new webpack.optimize.CommonsChunkPlugin({
            names:["common",// 指定公共 bundle 的名字。
                "manifest"]
        }),
        new CopyWebpackPlugin([
                { from: PUBLIC, to: BUILD+'/public' }
            ]
        ),
        new HtmlWebpackPlugin({
            title:"ThemeRiver",
            template: TEMPLATES+"/ThemeRiver.html",
            filename: "index.html",
            inject: true,
            hash:false,
            //chunks:['main',"common","manifest"]
        }),
        new webpack.BannerPlugin('This file is created by yyl')
    ]
};