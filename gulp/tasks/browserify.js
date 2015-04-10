var gulp = require('gulp');
var path = require('path');
var browserify = require('browserify');
var sourceStream = require('vinyl-source-stream');
var exorcist = require('exorcist');

module.exports = function(options) {
    gulp.task('browserify', ['jshint'], function() {
        var browserifyConfig = options.config.browserify || {};
        var browserifyTransform = browserifyConfig.transform;
        var bundleFile = 'bundle.js';
        var bundleMapFile = path.join(browserifyConfig.dest, 'bundle.js.map');

        return browserify(browserifyConfig.options)
            .add(browserifyConfig.src)
            .transform(require('../../index'), browserifyTransform['browserify-css'])
            .bundle()
            .pipe(exorcist(bundleMapFile))
            .pipe(sourceStream(bundleFile))
            .pipe(gulp.dest(browserifyConfig.dest));
    });
};
