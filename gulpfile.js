/* eslint-env node */
"use strict";
const gulp = require("gulp");
const preprocess = require("gulp-preprocess");
const rename = require("gulp-rename");
const ts = require("gulp-typescript");
const debug = require("gulp-debug");
const sourcemaps = require("gulp-sourcemaps");
const gulpESLintNew = require("gulp-eslint-new");
const clean = require('gulp-clean');
const tsProject = ts.createProject("src/ts/tsconfig.json");
const jsProject = ts.createProject("src/js/tsconfig.json");

gulp.task( "clean",function(callback){
	gulp.src(["*.user.js","dev","maps","src/js/*.ts","src/js/*.tsx","src/ts/*.js","src/ts/*.jsx"],{allowEmpty:true})
	    .pipe(debug({title:"Deleting"}))
	    .pipe(clean({force: true}));
	callback();
});

gulp.task("build", function(callback)
{
	prodBuild(tsProject);
	prodBuild(jsProject);
	callback();
});

gulp.task("headers", function(callback)
{
	devBuild(tsProject);
	devBuild(jsProject);
	callback();
});

function prodBuild(project)
{
	project.src()
	       .pipe(debug({title: "Prod In"}))
	       .pipe(preprocess({context: {BUILD_TYPE: "Prod", PATH: process.cwd() + "/"}, showCount: false}))
	       .pipe(gulpESLintNew({fix: true}))
	       .pipe(gulpESLintNew.fix())
	       .pipe(gulpESLintNew.format())
	       .pipe(gulpESLintNew.failAfterError())
	       .pipe(sourcemaps.init())
	       .pipe(project(ts.reporter.fullReporter()).on("error", function(err)
	       {
		       console.log(err.message);
	       }))
	       .pipe(sourcemaps.write("maps/"))
	       .pipe(rename({
		                    extname: ".user.js"
	                    }))
	       .pipe(gulp.dest("."))
	       .pipe(debug({title: "Prod Out"}));
}

function devBuild(project)
{
	project.src()
	       .pipe(preprocess({context: {BUILD_TYPE: "Dev", PATH: process.cwd() + "/"}, showCount: false}))
	       .pipe(rename({
		                    extname: ".user.js"
	                    }))
	       .pipe(gulp.dest("dev/"));
}