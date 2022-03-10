const path = require("path");
const pkg = require('./package.json');
const WebpackUserscript = require('webpack-userscript');
const RemovePlugin = require('remove-files-webpack-plugin');
const lodashClonedeep = require('lodash.clonedeep');
const dev = false;
const scripts = [];
const exportList = [];
const rules = [{
	test: /\.ts$/, use: ["ts-loader"]
}, {
	test: /\.d\.ts$/, loader: 'ignore-loader'
}];

// -----===== Edit Me Begin =====-----
const namespace = "https://candicejoy.com";
const publicBaseUrl = "https://cdn.jsdelivr.net/gh/CandiceJoy/CandiceJoy-Userscripts/";

scripts.push({
	             file: "./src/AmiAmi-SearchFilter.ts", header: {
		name       : "Ami Ami Search Filter",
		version    : "1.2",
		match      : ["https://www.amiami.com/eng/search/list/*"],
		grant      : ["GM_getValue", "GM_setValue"],
		description: "Search assistant for AmiAmi",
		'run-at'   : 'document-end'
	}
             });

scripts.push({
	             file: "./src/AmiAmi-Refresher.ts", header: {
		name       : "Ami Ami Refresher",
		version    : "1.3",
		match      : ["https://www.amiami.com/eng/detail/*"],
		description: "AmiAmi Refresher / Auto-Add-To-Cart",
		icon       : "https://www.google.com/s2/favicons?domain=amiami.com",
		'run-at'   : 'document-end'
	}
             });

scripts.push({
	             file: "./src/BuyfriendRedirect.ts", header: {
		name       : "BuyFriend Redirect",
		version    : "1.2",
		match      : ["https://buyfriend.moe/search?search=https://www.amiami.com/eng/detail/?*"],
		description: "Auto-clicker for Buyfriend.Moe notifications",
		icon       : "https://www.google.com/s2/favicons?sz=64&domain=buyfriend.moe",
		'run-at'   : 'document-end'
	}
             });

scripts.push({
	             file: "./src/MFC-MarkAllRead.ts", header: {
		name       : "MFC Mark All As Read",
		version    : "1.2",
		match      : ["https://myfigurecollection.net/notifications/*"],
		description: "Adds a Mark All Read button to MFC Notifications Page",
		icon       : "https://static.myfigurecollection.net/ressources/assets/webicon.png",
		'run-at'   : 'document-end'
	}
             });

scripts.push({
	             file: "./src/AmiAmi-CartNotifier.ts", header: {
		name       : "AmiAmi Cart Notifier",
		version    : "1.0",
		match      : ["https://www.amiami.com/eng/cart*"],
		description: "Notify you when something is added to your cart",
		icon       : "https://www.google.com/s2/favicons?domain=amiami.com",
		'run-at'   : 'document-end'
	}
             });

// -----===== Edit Me End =====-----

const configTemplate = {
	mode      : dev ? "development" : "production", devtool: dev ? 'source-map' : 'eval', name: "", entry: {}, module: {
		rules: rules
	}, output : {
		filename: "", path: __dirname + "/", publicPath: publicBaseUrl + "[name].user.js"
	}, resolve: {
		modules:["node_modules","src/libs"],extensions: ['.js', '.jsx', '.ts', '.tsx']
	}
};

for(let i = 0; i < scripts.length; i++)
{
	const sourceFile = scripts[i].file;
	const baseFile = path.basename(sourceFile, ".ts");
	const destinationFile = baseFile + ".user.js";
	const header = scripts[i].header;

	header.namespace = namespace;
	header.author = pkg.author;
	header.source = pkg.repository.url;
	header.supportURL = pkg.bugs.url;

	const options = {
		headers: header, downloadBaseUrl: publicBaseUrl + destinationFile, renameExt: true, pretty: true, metajs: true
	};

	options["proxyScript"] = {
		baseUrl: "file://"+__dirname, filename: '[basename].dev.user.js', enable: true
	};

	let plugins = [];

	plugins.push(new WebpackUserscript(options));

	let myConfig = lodashClonedeep(configTemplate);

	myConfig.name = baseFile;
	myConfig.entry[baseFile] = sourceFile;
	myConfig.plugins = plugins;
	myConfig.output.filename = "[name].user.js";
	exportList.push(myConfig);
}

module.exports = exportList;