module.exports = {
    entry: {
        AARefresher: "src/AmiAmi-Refresher.ts",
        AAFilter: "src/AmiAmi-SearchFilter.ts",
        BFRedirect: "src/BuyfriendRedirect.ts",
        MFCMAR: "src/MFC-MarkAllRead.ts"
    },
    output: {
        filename: "[name].user.js",
        path: __dirname + "./",
        publicPath: "https://cdn.jsdelivr.net/gh/CandiceJoy/CandiceJoy-Userscripts/[name]"
    },
    module: {
        rules: [{
                test: /\.ts$/,
                use: ["ts-loader"]
            }]
    }
};
