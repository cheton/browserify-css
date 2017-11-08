(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
'use strict';

require('./app.css');
var foo = require('./modules/foo');
var bar = require('./modules/bar');

foo.init();
bar.init();

},{"./app.css":1,"./modules/bar":3,"./modules/foo":4}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
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

},{}]},{},[2]);
