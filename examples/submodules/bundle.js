(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

require('./app.css');
var foo = require('./modules/foo');
var bar = require('./modules/bar');

foo.init();
bar.init();

},{"./app.css":3,"./modules/bar":4,"./modules/foo":5}],2:[function(require,module,exports){
'use strict';
// For more information about browser field, check out the browser field at https://github.com/substack/browserify-handbook#browser-field.

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
        
        if (style.sheet) { // for jsdom and IE9+
            style.innerHTML = cssText;
            style.sheet.cssText = cssText;
            head.appendChild(style);
        } else if (style.styleSheet) { // for IE8 and below
            head.appendChild(style);
            style.styleSheet.cssText = cssText;
        } else { // for Chrome, Firefox, and Safari
            style.appendChild(document.createTextNode(cssText));
            head.appendChild(style);
        }
    }
};

},{}],3:[function(require,module,exports){
var css = "body .foo{background-color:#ccc;height:100px;line-height:100px;font-size:20px;text-align:center;background-image:url(modules/foo/images/foo.png)}body .bar{background-color:#eee;height:100px;line-height:100px;font-size:20px;text-align:center;background-image:url(modules/bar/images/bar.png)}body{font-family:Arial,Helvetica,sans-serif;background-color:#fff;font-size:12px}"; (require("/home/cheton/github/browserify-css").createStyle(css, { "href": "app.css"})); module.exports = css;
},{"/home/cheton/github/browserify-css":2}],4:[function(require,module,exports){
'use strict';

module.exports = {
    init: function() {
        var container = document.getElementById('container');
        var bar = document.createElement('div');
        bar.setAttribute('class', 'bar');
        bar.innerHTML = 'bar module';
        container.appendChild(bar);
    }
};

},{}],5:[function(require,module,exports){
'use strict';

module.exports = {
    init: function() {
        var container = document.getElementById('container');
        var foo = document.createElement('div');
        foo.setAttribute('class', 'foo');
        foo.innerHTML = 'foo module';
        container.appendChild(foo);
    }
};

},{}]},{},[1])


//# sourceMappingURL=bundle.js.map