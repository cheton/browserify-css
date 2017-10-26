'use strict';

var css = require('css');
var url = require('url');
var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var concat = require('concat-stream');
var findNodeModules = require('find-node-modules');
var mime = require('mime');

var isExternalURL = function(path) {
    return !! url.parse(path).protocol;
};

var isRelativePath = function(path) {
    return /^[^\/]/.test(path);
};

var isNodeModulePath = function(path) {
    return /^node_modules/.test(path);
};

// Finds the the import path from parent node_modules.
// @see {@link https://github.com/cheton/browserify-css/pull/21} for further information.
var findImportPathInNodeModules = function(baseDir, importPath) {
    var parts = importPath.split('/');
    var pathname = path.join(baseDir, importPath);

    if (parts[0] === 'node_modules') {
        // Gets all but the first element of array (i.e. node_modules).
        importPath = parts.slice(1).join('/');
    }

    // Returns an array of all parent node_modules directories.
    var dirs = findNodeModules({
        cwd: baseDir,
        relative: false
    });

    _.each(dirs, function(dir) {
        if (fs.existsSync(path.join(dir, importPath))) {
            pathname = path.join(dir, importPath);
            return false; // Exits iteration by returning false.
        }
    });

    return pathname;
};

var cssTransform = function(options, filename, callback) {
    var that = this;
    var externalURLs = [];
    var cssStream = concat({ encoding: 'string' }, function(data) {
        var result = _.reduce(externalURLs, function(result, url) {
            return result + '@import url("' + url + '");\n';
        }, '');
        result = result + data;
        callback(result);
    });
    
    // If inlineImages is not an object but evaluates to true
    // create object with default options
    // if(options.inlineImages && typeof options.inlineImages !== 'object') {
    //     options.inlineImages = {
    //         options: {
    //             limit: 0
    //         }
    //     };
    // }
    if(options.inlineImages && typeof options.inlineImagesOptions !== 'object'){
        options.inlineImagesOptions = {
            limit: 0
        }
    }
    
    var rebaseUrls = options.rebaseUrls;
    var inlineImages = options.inlineImages;
    var rootDir = options.rootDir || '';
    if (isRelativePath(rootDir)) {
        rootDir = path.join(process.cwd(), rootDir);
    }
    var processRelativeUrl = function(relativeUrl) {
        return relativeUrl;
    };
    if (_.isFunction(options.processRelativeUrl)) {
        processRelativeUrl = options.processRelativeUrl;
    }

    var parsedFiles = new Set();
    var parseCSSFile = function(filename) {
        if(parsedFiles.has(filename)){
            return;
        }
        parsedFiles.add(filename);
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
                    // If both r[2] and r[3] are undefined, but r[1] is a string, it will be the case of url(path/to/foo.css).
                    quoteLen = ((r[2] || r[3]) && r[1]) ? 1 : 0;

                    var dirname = path.dirname(filename);
                    var from = rootDir,
                        to = path.resolve(dirname, url);

                    newUrl = processRelativeUrl(path.relative(from, to));
                    newUrl = newUrl.replace(/\\/g, '/'); // All URLs must use forward slashes

                    source = source.substr(0, urlRegEx.lastIndex - url.length - quoteLen - 1) + newUrl + source.substr(urlRegEx.lastIndex - quoteLen - 1);
                }

                urlRegEx.lastIndex = urlRegEx.lastIndex + (newUrl.length - url.length);
            }

            return source;
        };

        var inline = function(source) {
            /**
             * Given the contents for an image, returns a data URI string
             * representing the data in that image.
             * Adapted from:
             * https://github.com/jbkirby/css-img-datauri-stream/blob/master/index.js
             */
            var getDataURI = function(imageFile,mimeType) {
                // Convert it.
                var ret = 'data:';
                ret += mimeType;
                ret += ';base64,';
                ret += imageFile.toString('base64');
                return ret;
            };

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
                    // If both r[2] and r[3] are undefined, but r[1] is a string, it will be the case of url(path/to/foo.png).
                    quoteLen = ((r[2] || r[3]) && r[1]) ? 1 : 0;

                    var dirname = path.dirname(filename);
                    var localImagePath = path.resolve(dirname, url);

                    // Read the file in and convert it if its an image
                    var mimeType = mime.lookup(localImagePath);
                    if (mimeType.startsWith('image')) {
                        // If a size limit given skip if file larger than limit
                        if(options.inlineImagesOptions.limit > 0) {
                            var stat = fs.statSync(localImagePath);
                            if(stat.size > options.inlineImagesOptions.limit) {
                                continue;
                            }
                        }
                        var image = fs.readFileSync(localImagePath);
                        newUrl = getDataURI(image,mimeType);
    
                        source = source.substr(0, urlRegEx.lastIndex - url.length - quoteLen - 1) + newUrl + source.substr(urlRegEx.lastIndex - quoteLen - 1);
                    }
                }

                urlRegEx.lastIndex = urlRegEx.lastIndex + (newUrl.length - url.length);
            }

            return source;
        };
        
        var processRule = function (rule) {
            if (inlineImages) {
                _.each(rule.declarations, function(declaration) {
                    declaration.value = inline(declaration.value);
                });
            }
            
            if (rebaseUrls) {
                _.each(rule.declarations, function(declaration) {
                    declaration.value = rebase(declaration.value);
                });
            }
        };

        var data = fs.readFileSync(filename, 'utf8');
        if ( ! data) {
            return;
        }

        var rules = css.parse(data, { source: filename }).stylesheet.rules;

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

                url = _.trim(url);

                if (isExternalURL(url)) {
                    externalURLs.push(url);
                    return;
                }

                var dirname = path.dirname(filename);
                var pathname;
                
                // if the path starts with node_modules, search up the tree to find the module
                // in case it was deduped to a higher location in the tree
                if (isNodeModulePath(url)) {
                    pathname = findImportPathInNodeModules(dirname, url);
                } else if (isRelativePath(url)) { // relative path
                    pathname = path.resolve(dirname, url);
                } else { // absolute path
                    pathname = path.join(rootDir, url);
                }

                if (that && typeof that.emit === 'function') {
                    that.emit('file', pathname);
                }

                parseCSSFile(pathname);

            } else {
                if (rule.type === 'media') {
                    // handle rules in media query
                    _.each(rule.rules, processRule);
                } else {
                    // handle normal rules
                    processRule(rule);
                }

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
    rebaseUrls: true,
    rootDir: process.cwd(),
    processRelativeUrl: null
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

    try {
        cssTransform.call(this, options, filename, callback);
    } catch(err) {
        this.emit('error', err);
    }
};
