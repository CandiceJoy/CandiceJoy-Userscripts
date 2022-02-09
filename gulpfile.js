let gulp = require('gulp');
let preprocess = require('gulp-preprocess');
let rename = require('gulp-rename');
let source = "src/*";
let prod = ".";
let dev = "dev/";

gulp.task('Build - Dev (Mac)', function()
{
	return gulp.src(source)
	           .pipe(preprocess({context:{DEV:true,PROD:false,DEV_TYPE:"Mac"}}))
	           .pipe(rename({
		                        extname: ".user.js"
	                        }))
		.pipe(gulp.dest(dev));
});

gulp.task('Build - Dev (PC)', function()
{
	return gulp.src(source)
	           .pipe(preprocess({context:{DEV:true,PROD:false,DEV_TYPE:"PC"}}))
	           .pipe(rename({
		                        extname: ".user.js"
	                        }))
	           .pipe(gulp.dest(dev));
});

gulp.task('Build - Prod', function()
{
	return gulp.src(source)
	           .pipe(preprocess({context:{DEV:false,PROD:true,DEV_TYPE:"None"}}))
	           .pipe(rename({
		                        extname: ".user.js"
	                        }))
	           .pipe(gulp.dest(prod));
});