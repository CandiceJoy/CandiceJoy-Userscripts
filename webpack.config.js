module.exports = {
	mode:"development",
	entry : {
		"AmiAmi-Refresher": "./src/AmiAmi-Refresher.ts",
		"AmiAmi-SearchFilter"   : "./src/AmiAmi-SearchFilter.ts",
		"BuyfriendRedirect" : "./src/BuyfriendRedirect.ts",
		"MFC-MarkAllRead"     : "./src/MFC-MarkAllRead.ts"
	},
	output: {
		filename  : "[name].user.js",
		path      : __dirname + "/",
		publicPath: "https://cdn.jsdelivr.net/gh/CandiceJoy/CandiceJoy-Userscripts/[name]"
	},
	module: {
		rules: [{
			test: /\.ts$/,
			use : ["ts-loader"]
		}]
	}
};