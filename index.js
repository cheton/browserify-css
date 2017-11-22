'use strict';

var _ = require('lodash');
var through = require('through2');
var fs = require('fs');
var path = require('path');
var cssTransform = require('./css-transform');
var CleanCSS = require('clean-css');

var defaults = {
    autoInject: true,
    autoInjectOptions: {
        'verbose': true,
        'insertAt': 'bottom'
    },
    minify: false,
    minifyOptions: {
        // Check out a list of CSS minify options at [CleanCSS](https://github.com/jakubpawlowicz/clean-css#how-to-use-clean-css-programmatically).
    },
    inlineImages: false,
    stripComments: false,
    rootDir: process.cwd(),
    onFlush: function(options, done) {
        done();
    },
    output: ''
};

function bool(b) {
    return !(/^(false|0)$/i).test(b) && !!b;
}

try {
    var pkg = JSON.parse(fs.readFileSync(process.cwd() + '/package.json') || '{}');
    var options = pkg['browserify-css'] || defaults;
    if (typeof options === 'string') {
        var base = path.relative(__dirname, process.cwd());
        options = require(path.join(base, options)) || defaults;
    }
} catch (err) {
    options = defaults;
}
options = _.defaults(options, defaults);

module.exports = function(filename, opts) {
    if ( ! /\.css$/i.test(filename)) {
        return through();
    }

    var buffer = '';

    options = _.merge({}, options, opts);

    // Convert string to boolean when passing transform options from command line
    // https://github.com/cheton/browserify-css/issues/51
    options.autoInject = bool(options.autoInject);
    if (typeof options.autoInjectOptions === 'object') {
        options.autoInjectOptions.verbose = bool(options.autoInjectOptions.verbose);
    }
    options.minify = bool(options.minify);
    options.inlineImages = bool(options.inlineImages);
    options.stripComments = bool(options.stripComments);

    if (typeof options.output === 'string' && options.output.length > 0) {
        try {
            fs.writeFileSync(options.output, '', 'utf8');
        } catch (err) {
            options.output = '';
            console.error(err);
        }
    }

    return through(
        function transform(chunk, enc, next) {
            buffer += chunk;
            next();
        },
        function flush(done) {
            var that = this;

            cssTransform.call(this, options, filename, function(data) {
                var rootDir = path.resolve(process.cwd(), options.rootDir);
                var relativePath = path.relative(rootDir, path.dirname(filename));
                var href = path.join(relativePath, path.basename(filename));

                if (options.minify) {
                    data = new CleanCSS(options.minifyOptions).minify(data).styles;
                }

                options.onFlush({
                    filename: filename,
                    data: data,
                    rootDir: rootDir,
                    relativePath: relativePath,
                    href: href
                }, function(moduleBody) {
                    if (typeof options.output === 'string' && options.output.length > 0) {
                        try {
                            fs.appendFileSync(options.output, data, 'utf8');
                        } catch (err) {
                            console.error(err);
                        }

                        done();
                        return;
                    }

                    if (moduleBody === undefined) {
                        if ( ! options.autoInject) {
                            moduleBody = 'module.exports = ' + JSON.stringify(data) + ';';
                        } else {
                            if (options.autoInjectOptions.verbose) {
                                moduleBody = 'var css = ' + JSON.stringify(data) + '; (require(' + JSON.stringify('browserify-css') + ').createStyle(css, { "href": ' + JSON.stringify(href) + ' }, { "insertAt": ' + JSON.stringify(options.autoInjectOptions.insertAt) + ' })); module.exports = css;';
                            } else {
                                moduleBody = 'var css = ' + JSON.stringify(data) + '; (require(' + JSON.stringify('browserify-css') + ').createStyle(css, {}, { "insertAt": ' + JSON.stringify(options.autoInjectOptions.insertAt) + ' })); module.exports = css;';
                            }
                        }
                    }

                    if (moduleBody) {
                        that.push(moduleBody);
                    } else {
                        that.push(null);
                    }

                    done();
                });
            });
        }
    );
};
