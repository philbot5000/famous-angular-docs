var SITE_DIR = './';

var EXPRESS_PORT = 4000;
var EXPRESS_DOCS_ROOT = __dirname + '/' + SITE_DIR + '_site';

console.log(EXPRESS_DOCS_ROOT);

var LIVERELOAD_PORT = 35729;


// Load plugins
var gulp = require('gulp'),
  autoprefixer = require('gulp-autoprefixer'),
  minifycss = require('gulp-minify-css'),
  jshint = require('gulp-jshint'),
  ngmin = require('gulp-ngmin'),
  uglify = require('gulp-uglify'),
  rename = require('gulp-rename'),
  clean = require('gulp-clean'),
  concat = require('gulp-concat'),
  notify = require('gulp-notify'),
  cache = require('gulp-cache'),
  livereload = require('gulp-livereload'),
  server = livereload(),
  gutil = require('gulp-util'),
  pkg = require('./package.json'),
  wait = require('gulp-wait'),
  exec = require('gulp-exec');


// Main watch task for development
gulp.task('dev', ['build-jekyll'], function() {
  var server = livereload();

  // Watch source files inside site submodule
  gulp.watch([
	      // Because .styl compiles into .css, do not watch .css, else you will
	      // an infinite loop
	      SITE_DIR + 'styl/**/*.styl',
	      SITE_DIR + '**/*.html',
	      SITE_DIR + '**/*.md',
        // Only watch the js from app/
	      SITE_DIR + 'app/*.js',
	      // Do NOT watch the compile _site directory, else the watch will create
	      // an infinite loop
	      '!' + SITE_DIR + '_site/**',
	      '!' + SITE_DIR + 'js/**',
	      '!' + SITE_DIR + 'bower_components/**',
	      '!' + SITE_DIR + 'node_modules/**'
	  ],
	  ['build-jekyll']
	).on('change',
    function(file){
      server.changed(file.path);
    }
  );

  // Start the express server
  gulp.start('site');
});


// jekyll build the docs site
gulp.task('build-jekyll', ['site-styl', 'site-js'], function() {
  var jekyllCommand = 'jekyll build --source ' + SITE_DIR +  ' --destination ' + SITE_DIR + '_site/';
  // gulp-exec bugfix:
  // Need to call gulp.src('') exactly, before using .pipe(exec())
  return gulp.src('')
    .pipe(exec(jekyllCommand))
    // This delay does not seem to be working
    .pipe(wait(1500))
    .pipe(livereload(server));
});


// First generate the docs, and then run jekyll build to create a new _site
// with the fresh docs
gulp.task('build-site', ['docs'], function(done) {
  return gulp.start('build-jekyll');
});


// Compile .styl for the site submodule
gulp.task('site-styl', function() {
  var stylus = require('gulp-stylus');

  return gulp.src(SITE_DIR + "styl/*.styl")
    .pipe(stylus())
    .pipe(minifycss())
    .pipe(concat('main.css'))
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest(SITE_DIR + "css/"));
});


// Concat all app/ js files and minify them
gulp.task('site-js', function() {
  return gulp.src([
    SITE_DIR + "app/*.js",
  ])
    .pipe(jshint())
    .pipe(concat('main.js'))
    .pipe(gulp.dest(SITE_DIR + "js/"))
    .pipe(ngmin())
    .pipe(uglify({ mangle: false }))
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest(SITE_DIR + "js/"));
});


gulp.task('site', function(done) {
	var express = require('express'),
		app = express();
	app.use(require('connect-livereload')());
	app.use(express.static(EXPRESS_DOCS_ROOT));
	app.listen(EXPRESS_PORT);
	gutil.log('Server running at Docs for', gutil.colors.cyan('http://localhost:'+EXPRESS_PORT+'/'));
});
