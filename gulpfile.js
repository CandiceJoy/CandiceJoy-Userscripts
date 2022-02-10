let gulp = require('gulp');
let preprocess = require('gulp-preprocess');
let rename = require('gulp-rename');
let source = "src/*";
let prod = ".";
let dev = "dev/";

gulp.task('Build - Dev (Mac)', function()
{
	return gulp.src(source)
	           .pipe(preprocess({context: {BUILD_TYPE: "Mac"}}))
	           .pipe(rename({
		                        extname: ".user.js"
	                        }))
	           .pipe(gulp.dest(dev));
});

gulp.task('Build - Dev (PC)', function()
{
	return gulp.src(source)
	           .pipe(preprocess({context: {BUILD_TYPE: "PC"}}))
	           .pipe(rename({
		                        extname: ".user.js"
	                        }))
	           .pipe(gulp.dest(dev));
});

gulp.task('Build - Prod', function()
{
	return gulp.src(source)
	           .pipe(preprocess({context: {BUILD_TYPE: "Prod"}}))
	           .pipe(rename({
		                        extname: ".user.js"
	                        }))
	           .pipe(gulp.dest(prod));
});