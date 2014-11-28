(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var css = "body .foo {\n  background-color: #ccc;\n  height: 100px;\n  line-height: 100px;\n  font-size: 20px;\n  text-align: center;\n}\nbody .bar {\n  background-color: #eee;\n  height: 100px;\n  line-height: 100px;\n  font-size: 20px;\n  text-align: center;\n}\nbody {\n  font-family: Arial, Helvetica, sans-serif;\n  background-color: #fff;\n  font-size: 12px;\n}\n"; (require("/home/cheton/gitlab/browserify-css/examples/node_modules/browserify-css").createStyle(css, { "href": "app.css"})); module.exports = css;
},{"/home/cheton/gitlab/browserify-css/examples/node_modules/browserify-css":5}],2:[function(require,module,exports){
require('./app.css');
var foo = require('./modules/foo');
var bar = require('./modules/bar');

foo.init();
bar.init();

},{"./app.css":1,"./modules/bar":3,"./modules/foo":4}],3:[function(require,module,exports){
module.exports = {
    init: function() {
        var container = document.getElementById('container');
        var bar = document.createElement('div');
        bar.setAttribute('class', 'bar');
        bar.innerHTML = 'bar module';
        container.appendChild(bar);
    }
};

},{}],4:[function(require,module,exports){
module.exports = {
    init: function() {
        var container = document.getElementById('container');
        var foo = document.createElement('div');
        foo.setAttribute('class', 'foo');
        foo.innerHTML = 'foo module';
        container.appendChild(foo);
    }
};

},{}],5:[function(require,module,exports){
//
// For more information about browser field, check out the browser field at https://github.com/substack/browserify-handbook#browser-field.
//

module.exports = {
    // Create a <link> tag with optional data attributes
    createLink: function(href, attributes) {
        var head = document.head || document.getElementsByTagName('head')[0];
        var link = document.createElement('link');

        link.href = href;
        link.rel = 'stylesheet';

        for (var key in attributes) {
            if ( ! attributes.hasOwnProperty(key)) {
                continue;
            }
            var value = attributes[key];
            link.setAttribute('data-' + key, value);
        }

        head.appendChild(link);
    },
    // Create a <style> tag with optional data attributes
    createStyle: function(cssText, attributes) {
        var head = document.head || document.getElementsByTagName('head')[0],
            style = document.createElement('style');

        style.type = 'text/css';
        for (var key in attributes) {
            if ( ! attributes.hasOwnProperty(key)) {
                continue;
            }
            var value = attributes[key];
            style.setAttribute('data-' + key, value);
        }

        if (style.sheet) {
            style.sheet.cssText = cssText;
        } else if (style.styleSheet) {
            style.styleSheet.cssText = cssText;
        } else {
            style.appendChild(document.createTextNode(cssText));
        }

        head.appendChild(style);
    }
};

},{}]},{},[2]);
