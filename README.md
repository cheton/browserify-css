# browserify-css an amazing node package [![build status](https://travis-ci.org/cheton/browserify-css.svg?branch=master)](https://travis-ci.org/cheton/browserify-css) [![Coverage Status](https://coveralls.io/repos/cheton/browserify-css/badge.svg?branch=master&service=github)](https://coveralls.io/github/cheton/browserify-css?branch=master)

[![NPM](https://nodei.co/npm/browserify-css.png?downloads=true&stars=true)](https://www.npmjs.com/package/browserify-css)

A Browserify transform for bundling, rebasing, inlining, and minifying CSS files. It's useful for CSS modularization where styles are scoped to their related bundles.

## Getting Started

If you're new to browserify, check out the [browserify handbook](https://github.com/substack/browserify-handbook) and the resources on [browserify.org](http://browserify.org/).

## Installation

`npm install --save-dev browserify-css`

## Usage

app.css:
``` css
@import url("modules/foo/index.css");
@import url("modules/bar/index.css");
body {
    background-color: #fff;
}
```

app.js:
``` js
var css = require('./app.css');
console.log(css);
```

You can compile your app by passing -t browserify-css to browserify:
``` bash
$ browserify -t browserify-css app.js > bundle.js
```

Each `require('./path/to/file.css')` call will concatenate CSS files with @import statements, rebasing urls, inlining @import, and minifying CSS. It will add a style tag with an optional data-href attribute to the head section of the document during runtime:

``` html
<html>
<head>
    <style type="text/css" data-href="app.css">...</style>
</head>
</html>
```

## Configuration setting

You can set configuration to your package.json file as follows:
``` json
{
    "browserify-css": {
        "autoInject": true,
        "minify": true,
        "rootDir": "."
    }
}
```

or use an external configuration file like given below:
``` json
{
    "browserify-css": "./config/browserify-css.js"
}
```

config/browserify-css.js:
``` js
module.exports = {
    "autoInject": true,
    "minify": true,
    "rootDir": "."
};
```

Furthermore, browserify-css transform can obtain options from the command-line with subarg syntax:
```
$ browserify -t [ browserify-css --minify=true --output bundle.css ] -o bundle.js app.js
```
or from the api:
```
b.transform('browserify-css', {
    minify: true,
    output: 'bundle.css'
});
```

## Options

### autoInject

Type: `Boolean`
Default: `true`

If true, each `require('path/to/file.css')` call will add a style tag to the head section of the document.

### autoInjectOptions

Type: `Object`
Default: 
```js
{
    "verbose": true,
    "insertAt": "bottom" // or "top"
}
```

#### `verbose`

If verbose is set to true, the path to CSS will be specified in the data-href attribute inside the style tag

#### `insertAt`

By default, browserify-css transform appends &lt;style&gt; elements to the end of the &lt;head&gt; tag of the page. This will cause CSS created by browserify-css transform to take priority over CSS already present in the document head. To insert style elements at the beginning of the head, set the insertAt parameter to 'top'.

### inlineImages

Type: `Boolean` or `Object`
Default: `false`

If true, each required css file will have image `url()` replaced with data urls. For example from:

```css
  background-image: url("background.png");
```

to:

```css
  background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAVQAAAHgCAYAAAD6yZXWAAAABmJLR0QA");
```

### inlineImagesOptions

Type: `Object`
Default:

```js
{
    // maximum size (in bytes) of image file that will be inlined into css file
    "limit": 0 // 0 means no limit - inline all images
}
```

If a limit is set, then only files that are smaller than the number of bytes given will be inlined into the css file.

### minify

Type: `Boolean`
Default: `false`

### minifyOptions

Type: `Object`
Default: `{}`

Check out a list of CSS minify options at [CleanCSS](https://github.com/jakubpawlowicz/clean-css#how-to-use-clean-css-programmatically).

### onFlush

Type: `Function`

The `onFlush` option accepts a function which takes two arguments: (options, done).
```js
// @param {object} options The options object
// @param {string} options.filename The filename
// @param {string} options.data The CSS file content
// @param {string} options.rootDir The root directory
// @param {string} options.relativePath The relative path
// @param {string} options.href The href attribute
// @param {function} done The done callback
onFlush: function(options, done) {
    // Method 1:
    // This will keep original module.exports unchanged
    done();
    
    // Method 2:
    // Pass a null value to the done callback if you do not want to embed CSS into a JavaScript bundle
    done(null);
    
    // Method 3:
    // Pass a text string to the done callback to customize module.exports
    done('module.exports = ' + JSON.stringify(options.data) + ';');
}
```

You can use the `onFlush` option to output each CSS to a separate file, or append multiple CSS into one file. For example:
``` javascript
var browserify = require('browserify');
var fs = require('fs');

fs.unlinkSync('dist/assets/app.css');

browserify(options)
    .add('src/index.js')
    .transform(require('browserify-css'), {
        rootDir: 'src',
        onFlush: function(options, done) {
            fs.appendFileSync('dist/assets/app.css', options.data);
            
            // Do not embed CSS into a JavaScript bundle
            done(null);
        }
    })
    .bundle();
```

### output

Type: `String`
Default: ''

The output path of the CSS file. When using this option, browserify-css will not embed stylesheets into a JavaScript bundle.

```bash
browserify -t [ browserify-css --minify=true --output bundle.css ] -o bundle.js index.js
```

### processRelativeUrl

Type: `Function`

The `processRelativeUrl` option accepts a function which takes one argument (the relative url) and returns the original `relativeUrl` string or the converted result. For example:
``` javascript
var browserify = require('browserify');

browserify(options)
    .add('src/index.js')
    .transform(require('browserify-css'), {
        rootDir: 'src',
        processRelativeUrl: function(relativeUrl) {
            return relativeUrl;
        }
    })
    .bundle();
```

You can embed the image data directly into the CSS file with data URI, like so:
``` javascript
var _ = require('lodash');
var path = require('path');
var browserify = require('browserify');

browserify(options)
    .add('src/index.js')
    .transform(require('browserify-css'), {
        rootDir: 'src',
        processRelativeUrl: function(relativeUrl) {
            if (_.contains(['.jpg','.png','.gif'], path.extname(relativeUrl))) {
                // Embed image data with data URI
                var DataUri = require('datauri');
                var dUri = new DataUri(relativeUrl);
                return dUri.content;
            }
            return relativeUrl;
        }
    })
    .bundle();
```

You may also want to check out the  [FAQ](https://github.com/cheton/browserify-css#2-how-do-i-load-font-and-image-files-from-node_modules) for advanced usage.

### rebaseUrls

Type: `Boolean`
Default: `true`

If true, relative paths will be rebased in css files; if false, paths will be unchanged.

### rootDir

Type: `String`
Default: `./`

An absolute path to resolve relative paths against the project's base directory.

### stripComments

Type: `Boolean`
Default: `false`

Strip comments from CSS. Defaults to false.


## FAQ 
### 1. How do I include CSS files located inside the node_modules folder?
You can browse one of the following methods to include CSS files located inside the node_modules folder:

1. The easiest way to do this is using the `@import` rule. For example:

  app.js:
  ``` javascript
  require('./app.css');
  ```

  app.css:
  ``` css
  /* Use CSS from your node_modules folder */
  @import "node_modules/foo/foo.css";

  /* Or your own relative files */
  @import "styles/common.css";
  ```
  
2. Using the global transform option (i.e. `--global-transform` or `-g`) on the command line to transform all files in a node_modules directory:

  ``` bash
  $ browserify -g browserify-css app.js > bundle.js 
  ```

  or use the API directly:

  ``` javascript
  var browserify = require('browserify');
  var b = browserify('./app.js');
  b.transform('browserify-css', {global: true});
  b.bundle().pipe(process.stdout);
  ```
  See [browserify transform options](https://github.com/substack/node-browserify#btransformtr-opts) for details.
  
  Then you will be able to require CSS files from within node_modules. For example:
  ``` javascript
  require('bootstrap/dist/bootstrap.css');
  ```

3. Put browserify transform option into a submodule's package.json file inside the `node_modules` directory on a **per-module basis** like so:

  node_modules/foo/package.json:
  ``` json
  {
    "browserify": {
      "transform": ["browserify-css"]
    }
  }
  ```

  Then, run browserify transform on the command line:
  ``` bash
  $ browserify -t browserify-css app.js > bundle.js 
  ```

### 2. How do I load font and image files from node_modules?

Lets assume that you have the following directory structure:
``` bash
package.json
dist/
src/
    index.js
    index.css
node_modules/
    bootstrap/
        dist/
            css/
                bootstrap.css
```

The `index.css` uses `@import` to import external style sheets:
``` css
@import url("../node_modules/bootstrap/dist/css/bootstrap.css");
```

All output files, including the generated `bundle.js`, are created under the `dist` directory:
``` bash
dist/
    bundle.js
    vendor/
        bootstrap/
            dist/
                css/
                    bootstrap.css
```

Suppose that the `dist` directory is your web root, you might want to copy external font and images files from `../node_modules/` to `dist/vendor/`.

For example, the `@font-face` rules in `node_modules/bootstrap/dist/css/bootstrap.css`:
``` css
@font-face {
    font-family: 'Glyphicons Halflings';
    src: url('../fonts/glyphicons-halflings-regular.eot');
    src: url('../fonts/glyphicons-halflings-regular.eot?#iefix') format('embedded-opentype'),
         url('../fonts/glyphicons-halflings-regular.woff2') format('woff2'),
         url('../fonts/glyphicons-halflings-regular.woff') format('woff'),
         url('../fonts/glyphicons-halflings-regular.ttf') format('truetype'),
         url('../fonts/glyphicons-halflings-regular.svg#glyphicons_halflingsregular') format('svg');
}
```

The example below illustrates the use of the `processRelativeUrl` option:
``` javascript
var gulp = require('gulp');
var gutil = require('gulp-util');
var path = require('path');
var browserify = require('browserify');
var sourceStream = require('vinyl-source-stream');
var fse = require('fs-extra');

var bundleStream = browserify()
    .add('src/index.js')
    .transform(require('browserify-css'), {
        rootDir: 'src',
        processRelativeUrl: function(relativeUrl) {
            var stripQueryStringAndHashFromPath = function(url) {
                return url.split('?')[0].split('#')[0];
            };
            var rootDir = path.resolve(process.cwd(), 'src');
            var relativePath = stripQueryStringAndHashFromPath(relativeUrl);
            var queryStringAndHash = relativeUrl.substring(relativePath.length);

            //
            // Copying files from '../node_modules/bootstrap/' to 'dist/vendor/bootstrap/'
            //
            var prefix = '../node_modules/';
            if (_.startsWith(relativePath, prefix)) {
                var vendorPath = 'vendor/' + relativePath.substring(prefix.length);
                var source = path.join(rootDir, relativePath);
                var target = path.join(rootDir, vendorPath);

                gutil.log('Copying file from ' + JSON.stringify(source) + ' to ' + JSON.stringify(target));
                fse.copySync(source, target);

                // Returns a new path string with original query string and hash fragments
                return vendorPath + queryStringAndHash;
            }

            return relativeUrl;
        }
    })
    .bundle();

bundleStream
    .pipe(sourceStream(bundleFile))
    .pipe(gulp.dest(browserifyConfig.dest));

```

## Acknowledgements

Test Images:
- [test/fixtures/background.png](test/fixtures/background.png)<br/>
Originally by [W3C](http://www.w3.org/html/logo/) under terms of [CC-BY-3.0](http://creativecommons.org/licenses/by/3.0), via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Class-header-css3.jpg)

- [test/fixtures/background-600.png](test/fixtures/background-600.png)<br/>
Originally by Rudloff under terms of [CC-BY-3.0](http://creativecommons.org/licenses/by/3.0), via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:CSS3_logo_and_wordmark.svg)


## License

MIT
