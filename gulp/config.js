var gutil = require('gulp-util');
var banner = [
    '/**',
    ' * <%= pkg.name %> - <%= pkg.description %>',
    ' * <%= pkg.author %>',
    ' * Version <%= pkg.version %>',
    ' * <%= pkg.license %> Licensed',
    ' */',
    ''].join('\n');

module.exports = {
    banner: banner,
    clean: {
        examples: [
            'examples/submodules/bundle.js'
        ]
    },
    jshint: {
        src: [
            '*.js',
            '*.json',
            'examples/**/*.js',
            '!examples/**/bundle.js'
        ],
        options: require('../config/jshint')
    },
    browserify: {
        src: './examples/submodules/index.js',
        dest: './examples/submodules/',
        options: {
            debug: true
        },
        transform: {
            'browserify-css': {
                'autoInject': true,
                'autoInjectOptions': {
                    'verbose': true
                },
                'rootDir': 'examples/submodules',
                'minify': true,
                'processRelativeUrl': function(url) {
                    return url;
                }
            }
        }
    }
};
