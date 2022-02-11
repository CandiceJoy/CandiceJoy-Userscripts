/* eslint-env node */
/* eslint "@typescript-eslint/no-var-requires": "off" */
"use strict";
const gulp = require('gulp');
const preprocess = require('gulp-preprocess');
const rename = require('gulp-rename');
const ts = require('gulp-typescript');
const debug = require('gulp-debug');
const sourcemaps = require('gulp-sourcemaps');
const tsConfigs = ["src/js/tsconfig.json", "src/ts/tsconfig.json"];
const prod = ".";
const dev_mac = "dev-mac/";
const dev_pc = "dev-pc/";

function build(project, dest, buildType)
{
	project.src()
	       .pipe(debug({title: "In"}))
	       .pipe(preprocess({context: {BUILD_TYPE: buildType, showCount: false}}))
	       .pipe(sourcemaps.init())
	       .pipe(project(ts.reporter.fullReporter()).on("error", function(err)
	       {
		       console.log(err.message);
	       }))
	       .pipe(sourcemaps.write('maps/'))
	       .pipe(rename({
		                    extname: ".user.js"
	                    }))
	       .pipe(gulp.dest(dest))
	       .pipe(debug({title: "Out"}));
}

function doBuild(dest, buildType)
{
	for(let i in tsConfigs)
	{
		let tsConfig = tsConfigs[i];
		let project = ts.createProject(tsConfig);
		build(project, dest, buildType);
	}
}

function buildDevPC()
{
	doBuild(dev_pc, "PC");
}

function buildDevMac(callback)
{
	doBuild(dev_mac, "Mac");
}

gulp.task("headers", function(callback)
{
	buildDevPC();
	buildDevMac();
	callback();
});

function buildProd(callback)
{
	doBuild(prod, "Prod", callback);
	callback();
}

exports.build = buildProd;