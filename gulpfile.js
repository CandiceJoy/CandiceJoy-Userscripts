/* eslint-env node */
"use strict";
const gulp = require("gulp");
const preprocess = require("gulp-preprocess");
const rename = require("gulp-rename");
const ts = require("gulp-typescript");
const debug = require("gulp-debug");
const gulpESLintNew = require("gulp-eslint-new");
const clean = require('gulp-clean');
const project = ts.createProject("tsconfig.json");
const libs = ts.createProject("src/libs/tsconfig.json");

gulp.task( "clean",function(callback){
	gulp.src(["libs","dev","*.user.js","maps","src/*.js","src/*.jsx","src/libs/*.js","src/libs/*.jsx","src/libs/*.map","src/libs/*.d.ts"],{allowEmpty:true})
	    .pipe(debug({title:"Deleting"}))
	    .pipe(clean({force: true}));
	callback();
});

gulp.task("build", function(callback)
{
	project.src()
	       .pipe(debug({title: "Build In"}))
	       .pipe(preprocess({context: {BUILD_TYPE: "Prod", PATH: process.cwd() + "/"}, showCount: false}))
	       .pipe(gulpESLintNew({fix: true}))
	       .pipe(gulpESLintNew.fix())
	       .pipe(gulpESLintNew.format())
	       .pipe(gulpESLintNew.failAfterError())
	       .pipe(project(ts.reporter.fullReporter()).on("error", function(err)
	       {
		       console.log(err.message);
	       }))
	       .pipe(rename({
		                    extname: ".user.js"
	                    }))
	       .pipe(gulp.dest("./"))
	       .pipe(debug({title: "Build Out"}));
	callback();
});

gulp.task("headers", function(callback)
{
	project.src()
	       .pipe(debug({title: "Header"}))
	       .pipe(preprocess({context: {BUILD_TYPE: "Dev", PATH: process.cwd() + "/"}, showCount: false}))
	       .pipe(rename({
		                    extname: ".user.js"
	                    }))
	       .pipe(gulp.dest("dev/"));
	callback();
});

gulp.task("build-libs", function(callback)
{
	libs.src()
	       .pipe(debug({title: "Lib In"}))
	       .pipe(preprocess({context: {BUILD_TYPE: "Prod", PATH: process.cwd() + "/"}, showCount: false}))
	       .pipe(gulpESLintNew({fix: true}))
	       .pipe(gulpESLintNew.fix())
	       .pipe(gulpESLintNew.format())
	       .pipe(gulpESLintNew.failAfterError())
	       .pipe(libs(ts.reporter.fullReporter()).on("error", function(err)
	       {
		       console.log(err.message);
	       }))
	       .pipe(gulp.dest("src/libs"))
	       .pipe(debug({title: "Lib Out"}));
	callback();
});