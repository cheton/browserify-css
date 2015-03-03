'use strict';

var gulp = require('gulp');
var jshint = require('gulp-jshint');

var tasks = {
    lintjs: function() {
        var jshintConfig = require('./config/jshint');
        return gulp.src([
            '*.js',
            '*.json',
            'examples/**/*.js',
            '!examples/**/bundle.js'
        ])
        .pipe(jshint(jshintConfig))
        .pipe(jshint.reporter());
    }
};

gulp.task('lint:js', tasks.lintjs);

gulp.task('default', [
    'lint:js'
]);
