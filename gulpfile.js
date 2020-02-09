'use strict';
// - - - - - - - - - - - - - - - Create the vars
var gulp = require('gulp'),
		pug = require('gulp-pug'),
		changed = require('gulp-changed'),
		plumber = require('gulp-plumber'),
		clean = require('gulp-clean'),
		concat  = require('gulp-concat'),
		uglify = require('gulp-uglify'),
		imagemin  = require('gulp-imagemin'),
		minifyCSS = require('gulp-csso'),
		sass  = require('gulp-sass'),
		browserSync = require('browser-sync').create(),
		//Directory vars
		watch = {
			html:"./src/**/*.pug",
			css:"./src/*.scss",
			img:"./src/assets/images/*.**",
			js:"./src/assets/js/*.js",
		},
		assetFiles = Array(
			'./src/assets/**/*.*',
			'!./src/assets/images/*.*',// Prevent duplicate folders outside assets
			'!./src/assets/fonts/*.*',// Prevent duplicate folders outside assets
		),
		sourceHtmlFiles = Array(
			'./src/*.pug',
			'!./src/partials/_*.pug'
		),
		sourceJsFiles = Array(
			'./src/assets/js/*.js',
			'./node_modules/popper.js/dist/popper.min.js',
			'!./src/assets/vendor/**/*.js'
		),
		sourceImgFiles = Array(
			'./src/assets/images/**/**'
		),
		sourceCssFiles = Array(
			'./src/*.scss'
		);
// - - - - - - - - - - - - - - - - - - - - - - -
function vendorMove(name, origin, dest='undefined'){
		var fDest = (dest != 'undefined') ? dest : "./build/assets/vendor/"+name,
				nSrc=0,
				nDes=0;
		return gulp.src(origin)
			.on("data", function() { nSrc+=1;})
			.pipe(plumber())
			.pipe(changed(fDest))
			.pipe(gulp.dest(fDest))
			.on("data", function() { nDes+=1;})
			.on("finish", function() {
					console.log(name+" results");
					console.log(name+": #src files: ", nSrc);
					console.log(name+": #dest files:", nDes);
			});
}
// Task to move vendor dependencies
gulp.task('vendor', function (done) {
		vendorMove("bootstrap", "./node_modules/bootstrap/dist/**/**");
		vendorMove("popperjs", "./node_modules/popper.js/dist/**/**");
		vendorMove("jquery", "./node_modules/jquery/dist/**/**");
		done();
});
// Add the sass compiler
sass.compiler = require('node-sass');
// BrowserSync Reload
function browserSyncReload() {
		browserSync.reload();
}
// - - - - - - - - - - - - - - - TASKS
// Clean the build directory
gulp.task('clean', function () {
		return gulp.src('./build', { read: false })
				.pipe(plumber())
				.pipe(clean());
});
// Move Assets to build
gulp.task('moveassets', function () {
	var dest = './build', nSrc=0, nDes=0;
	return gulp.src(assetFiles)
		.on("data", function() { nSrc+=1;})
		.pipe(plumber())
		.pipe(changed(dest))
		.pipe(gulp.dest(dest))

		.on("data", function() { nDes+=1;})
		.on("finish", function() {
				console.log("Results for ./build");
				console.log("# src files: ", nSrc);
				console.log("# dest files:", nDes);
		});
});
// The HTML folder
gulp.task('html', function(){
	return gulp.src(sourceHtmlFiles)
		.pipe(plumber())
		.pipe(pug({pretty: true}))
		.pipe(gulp.dest('./build'));
});
// The Sass generate CSS files
gulp.task('css', function(done){
	return gulp.src(sourceCssFiles)
		.pipe(sass().on('error', sass.logError))
		.pipe(plumber())
		.pipe(minifyCSS())
		.pipe(changed('./build/css'))
		.pipe(gulp.dest('./build/css'))
		.pipe(browserSync.stream({ match: "**/*.css" }))
});
// The JS Task
gulp.task('js', function(){
	return gulp.src(sourceJsFiles)
		.pipe(plumber())
		.pipe(concat('home.min.js'))
		//.pipe(uglify())
		.pipe(gulp.dest('./build/js'))
});
// create a task that ensures the `js` task is complete before
// reloading browsers
gulp.task('js-watch', gulp.parallel('js', function (done) {
		browserSyncReload;
		done();
}));
// IMG task, move and OPTIMIZE
gulp.task('img', () =>
	gulp.src(sourceImgFiles)
		.pipe(imagemin([
				imagemin.gifsicle({ interlaced: true }),
				imagemin.mozjpeg({quality:78, progressive: true }),
				imagemin.optipng({ optimizationLevel: 5 }),
				imagemin.svgo({
					plugins: [
							{removeViewBox: true},
							{cleanupIDs: false}
					]
				})
		]))
		.pipe(gulp.dest('./build/img'))
);
// Another one if a new image its added
gulp.task('img-watch', gulp.parallel('img', function (done) {
		browserSyncReload;
		done();
}));
/** main function defatult
*/
gulp.task("default",  gulp.parallel("moveassets", "vendor", "html", "css", "js", "img",
	function() {
		// Start Browser Sync
		browserSync.init({
			server: {
				baseDir: "./build"
			}
		});
		// Check for source changes
		gulp.watch(watch.css, gulp.series("css"));
		gulp.watch(watch.html, gulp.parallel("html")).on('change', browserSyncReload);
		gulp.watch(watch.img, gulp.parallel("img-watch"));
		gulp.watch(watch.js, gulp.parallel("js-watch"));
	}
));
