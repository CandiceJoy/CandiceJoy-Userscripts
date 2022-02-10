/* eslint-env node */
"use strict";
const gulp = require('gulp');
const preprocess = require('gulp-preprocess');
const rename = require('gulp-rename');
const jshint = require('gulp-jshint');
const ts = require('gulp-typescript');
//const gulpESLintNew = require('gulp-eslint-new');
const debug = require('gulp-debug');
const js_source = "src/*.js";
const ts_source = "src/*.ts";
const prod = ".";
const dev_mac = "dev-mac/";
const dev_pc = "dev-pc/";

function lint(callback)
{
	gulp.src(js_source)
	    .pipe(jshint())
	    .pipe(jshint.reporter('jshint-stylish'));

	/*gulp.src(ts_source)
	 .pipe(gulpESLintNew())
	 .pipe(gulpESLintNew.format())
	 .pipe(gulpESLintNew.failAfterError());*/
	callback();
}

function doBuild(dest, buildType, callback)
{
	gulp.src(js_source)
	    .pipe(debug({title: "JS In", showCount: false}))
	    .pipe(preprocess({context: {BUILD_TYPE: buildType}}))
	    .pipe(rename({
		                 extname: ".user.js"
	                 }))
	    .pipe(gulp.dest(dest))
	    .pipe(debug({title: "JS Out", showCount: false}));

	gulp.src(ts_source)
	    .pipe(debug({title: "TS In", showCount: false}))
	    .pipe(preprocess({context: {BUILD_TYPE: "Prod"}}))
	    .pipe(ts({
		             noImplicitAny: true
	             }))
	    .pipe(rename({
		                 extname: ".user.js"
	                 }))
	    .pipe(gulp.dest(dest))
	    .pipe(debug({title: "TS Out", showCount: false}));

	callback();
}

function buildDevPC(callback)
{
	doBuild(dev_pc, "PC", callback);
}

function buildDevMac(callback)
{
	doBuild(dev_mac, "Mac", callback);
}

function buildProd(callback)
{
	doBuild(prod, "Prod", callback);
}

exports.build = gulp.series(lint, buildDevMac, buildDevPC, buildProd);