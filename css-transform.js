'use strict';

var css = require('css');
var url = require('url');
var _ = require('lodash');
var _str = require('underscore.string');
var fs = require('fs');
var path = require('path');
var concat = require('concat-stream');

var isExternalURL = function(path) {
    return !! url.parse(path).protocol;
};

var isRelativePath = function(path) {
    return /^[^\/]/.test(path);
};

var cssTransform = function(options, filename, callback) {
    var externalURLs = [];
    var cssStream = concat({ encoding: 'string' }, function(data) {
        var result = _.reduce(externalURLs, function(result, url) {
            return result + '@import url("' + url + '");\n';
        }, '');
        result = result + data;
        callback(result);
    });

    var rootDir = options.rootDir || '';
    if (isRelativePath(rootDir)) {
        rootDir = path.join(process.cwd(), rootDir);
    }

    var parseCSSFile = function(filename) {

        var rebase = function(source) {
            var absUrlRegEx = /^(\/|data:)/;
            var protocolRegEx = /[^\:\/]*:\/\/([^\/])*/;
            var urlRegEx = /url\s*\((?!#)\s*(\s*"([^"]*)"|'([^']*)'|[^\)]*\s*)\s*\)/ig;
            var r;
            while ((r = urlRegEx.exec(source))) {
                var url = r[2] || // url("path/to/foo.css");
                          r[3] || // url('path/to/foo.css');
                          r[1] || // url(path/to/foo.css)
                          '';
                var quoteLen = ((r[2] || r[3]) && r[1]) ? 1 : 0;
                var newUrl = url;

                if ( ! url.match(absUrlRegEx) && ! url.match(protocolRegEx)) {
                    // if both r[2] and r[3] are undefined, but r[1] is a string, it will be the case of url(path/to/foo.css)
                    quoteLen = ((r[2] || r[3]) && r[1]) ? 1 : 0;

                    var dirname = path.dirname(filename);
                    var from = rootDir,
                        to = path.resolve(dirname, url);

                    newUrl = path.relative(from, to);
                    source = source.substr(0, urlRegEx.lastIndex - url.length - quoteLen - 1) + newUrl + source.substr(urlRegEx.lastIndex - quoteLen - 1);
                }

                urlRegEx.lastIndex = urlRegEx.lastIndex + (newUrl.length - url.length);
            }

            return source;
        };

        var data = fs.readFileSync(filename, 'utf8');
        if ( ! data) {
            return;
        }

        var rules = css.parse(data).stylesheet.rules;

        _.each(rules, function(rule) {
            if (rule.type === 'import') {
                //
                // @import 'path/to/foo.css';
                // @import "path/to/foo.css" screen, projection
                // @import url(path/to/foo.css)
                // @import url('path/to/foo.css') screen and (orientation:landscape)
                // @import url("path/to/foo.css") print;
                // @import url("path/to/foo.css ") projection, tv;
                // @import url("chrome://communicator/skin/")
                //
                var importRegEx = /(url)?\s*(('([^']*)'|"([^"]*)")|\(('([^']*)'|"([^"]*)"|([^\)]*))\))\s*;?/;
                var result = importRegEx.exec(rule['import']);

                                       // rule.import             result array
                                       // =======================================
                var url = result[7] || // url('path/to/foo.css')  result[7] = path/to/foo.css
                          result[8] || // url("path/to/foo.css")  result[8] = path/to/foo.css
                          result[9] || // url(path/to/foo.css)    result[9] = path/to/foo.css
                          result[4] || // 'path/to/foo.css'       result[4] = path/to/foo.css
                          result[5];   // "path/to/foo.css"       result[5] = path/to/foo.css

                url = _str.trim(url);

                if (isExternalURL(url)) {
                    externalURLs.push(url);
                    return;
                }

                var dirname = path.dirname(filename);
                var absFilename;
                
                if (isRelativePath(url)) { // relative path
                    absFilename = path.resolve(dirname, url);
                } else { // absolute path
                    absFilename = path.join(rootDir, url);
                }

                parseCSSFile(absFilename);

            } else {
                _.each(rule.declarations, function(declaration) {
                    declaration.value = rebase(declaration.value);
                });

                var cssText = css.stringify({
                    stylesheet: {
                        rules: [ rule ]
                    }
                });
                cssStream.write(cssText + '\n');
            }
        });
    };

    parseCSSFile(filename);

    cssStream.end();
};

var defaults = {
};

module.exports = function(options, filename, callback) {
    if (typeof options === 'string') {
        callback = filename;
        filename = options;
        options = {};
    }

    if (typeof callback !== 'function') {
        callback = function noop() {};
    }

    options = _.defaults(options || {}, defaults);

    cssTransform(options, filename, callback);
};
