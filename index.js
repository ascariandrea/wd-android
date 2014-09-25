(function() {
    "use strict";

    var _ = require('underscore'),
        __slice = Array.prototype.slice,
        xpath = require('xpath'),
        dom = require('xmldom').DOMParser,
        Q = require('q');

    var originalWd = null,
        allElements = {};

    var actionBarElements = {
        'ActionBarTab': 'android.app.ActionBar.Tab',
    };

    var buttonsElements = {
        'Button': 'android.widget.Button',
        'ImageButton': 'android.widget.ImageButton'
    };

    var layoutElements = {
        'FrameLayout': 'android.widget.FrameLayout',
        'LinearLayout': 'android.widget.LinearLayout',
        'RelativeLayout': 'android.widget.RelativeLayout'
    };

    var listElements = {
        'ListView': 'android.widget.ListView',
    };

    var viewPagerElements = {
        'ViewPager': 'android.support.v4.view.ViewPager'
    };

    var webElements = {
        'WebView': 'android.webkit.WebView'
    };

    var textElements = {
        'EditTextView': 'android.widget.EditTextView',
        'TextView': 'android.widget.TextView',
    };

    var buildArgs = function(path, args) {
        var args = __slice.call(args);
        var buildPath = '//'.concat(path);
        args[0] = buildPath;

        return args;
    };

    var buildMethod = function(path) {
        return (function() {
            return this.elementByXPath.apply(this, buildArgs(path, arguments));
        });
    };

    var buildElementsMethod = function(path) {
        return (function() {
            return this.elementsByXPath.apply(this, buildArgs(path, arguments));
        });
    };

    var buildWaitForElementMethod = function(path) {
        return (function() {
            return this.waitForElementByXPath.apply(this, buildArgs(path, arguments));
        });
    };

    var buildShoulBeMethod = function(path) {
        return (function() {
            return this.getTagName(function(err, name) {
                return name;
            }).then(function(name) {
                return name.should.be.eql(path);
            });
        });
    };

    var buildChildrenElementsMethod = function(path) {
        return (function() {

            var args = __slice.call(arguments);

            return this.source(function(err, source) {
                return source;
            }).then(function(source) {
                var childrenPath = xmlProcessor(source, args[0]) + '/' + path;
                return this.elementsByXPath(childrenPath);
            }.bind(this));
        });
    };

    function capitalizeString(s, cap) {
        var firstChar;
        cap = cap || false;

        if (cap === false)
            firstChar = s.charAt(0).toLowerCase();
        else
            firstChar = s.charAt(0).toUpperCase();

        return firstChar.concat(s.slice(1));
    }

    function buildElementMethodName(m, cap) {
        return capitalizeString(m, cap).concat('Element');
    }

    function buildElementsMethodName(m) {
        return buildElementMethodName(m, false).concat('s');
    }

    function buildWaitForElementMethodName(m) {
        return "waitFor".concat(buildElementMethodName(m, true));
    }

    function buildShouldBeElementMethodName(m) {
        return "shouldBe".concat(buildElementMethodName(m, true));
    }

    function buildChildrenElementsMethodName(m) {
        return "element".concat(capitalizeString(m, true)).concat('Children');
    }

    var __xPath = '';

    function __xPathParser(el, elIndex, id) {
        var childIndex = null;

        if (el.parentNode && el.tagName != 'hierarchy') {
            var parent = el.parentNode;


            if (!elIndex && typeof elIndex !== 'number') {

                _.each(parent.childNodes, function(c, i) {

                    var resourceIdAttr = __slice.call(c.attributes).filter(function(a) {
                        return (a.localName == 'resource-id' && a.value == id);
                    });

                    if (resourceIdAttr && resourceIdAttr.length) {
                        childIndex = i;
                        return;
                    }
                });

            } else {
                var parentChildrenCount = __slice.call(el.parentNode.childNodes).length;
                var nextItemsCount = nextCounter(el);
                var childIndex = parentChildrenCount - nextItemsCount - 1;
            }


            __xPath = '/' + el.tagName + '[' + (childIndex + 1) + ']' + __xPath;

            __xPathParser(el.parentNode, childIndex);
        }


        return '/' + __xPath;
    }

    var nextCount = 0;
    var nextCounter = function(el) {
        if (el.nextSibling) {
            nextCount++;
            return nextCounter(el.nextSibling);
        } else {
            return nextCount;
        }
    };



    function xmlProcessor(source, id) {
        var __xTotalPath = '';
        var found = false;
        var index = 0;

        source = source.replace(/>\s*/g, '>');
        source = source.replace(/\s*</g, '<');

        id = id.trim();

        var doc = new dom().parseFromString(source);
        var nodes = xpath.select('//*/@resource-id', doc);

        _.each(nodes, function(n, i) {
            if (n.value == id) {
                index = i;
                found = true;
            }
        });

        if (found) {
            __xTotalPath = __xPathParser(nodes[index].ownerElement, null, id);
        }

        return __xTotalPath;
    }


    var swipe = (function() {
        return function(opts) {
            var action = new originalWd.TouchAction(this);
            action
                .press({
                    x: opts.startX,
                    y: opts.startY
                })
                .wait(opts.duration)
                .moveTo({
                    x: opts.endX,
                    y: opts.endY
                })
                .release();

            return action.perform();
        }
    });

    var calculateCoords = function(opts, location, size) {

        opts.startX = opts.startX || 0.5;
        if (!opts.endX)
            opts.endX = opts.startX;

        opts.startY = opts.startY || 0.5;
        if (!opts.endY)
            opts.endY = opts.startY;


        opts.startX = opts.startX <= 1 ? location.x + size.width * opts.startX : opts.startX;
        opts.startY = opts.startY <= 1 ? location.y + size.height * opts.startY : opts.startY;
        opts.endX = opts.endX <= 1 ? location.x + size.width * opts.endX : opts.endX;
        opts.endY = opts.endY <= 1 ? location.y + size.height * opts.endY : opts.endY;

        return opts;
    };

    var tapElement = (function() {
        return function() {
            var opts = __slice.call(arguments)[0];
            var action = new originalWd.TouchAction(this.browser);

            opts.duration = opts.duration || 100;

            return Q.all([
                this.getLocation(),
                this.getSize()
            ]).then(function(result) {
                var location = result[0],
                    size = result[1];

                opts.x = opts.x <= 1 ? location.x + size.width * opts.x : opts.x;
                opts.y = opts.y <= 1 ? location.y + size.height * opts.y : opts.y;

                action
                    .press({
                        x: opts.x,
                        y: opts.y
                    })
                    .wait(opts.duration)
                    .release();

                return action.perform();
            });
        }
    });

    var swipeElement = (function() {
        return function() {
            var opts = __slice.call(arguments)[0];
            var action = new originalWd.TouchAction(this.browser);

            opts.duration = opts.duration || 800;

            return Q.all([
                this.getLocation(),
                this.getSize()
            ]).then(function(result) {

                // adjust coords to perform swipe on element area
                opts = calculateCoords(opts, result[0], result[1]);

                action
                    .press({
                        x: opts.startX,
                        y: opts.startY
                    })
                    .wait(opts.duration)
                    .moveTo({
                        x: opts.endX,
                        y: opts.endY
                    })
                    .release();

                return action.perform();
            });
        }
    });

    var pinch = (function() {
        return function(el) {
            return Q.all([
                el.getSize(),
                el.getLocation(),
            ]).then(function(res) {
                var size = res[0];
                var loc = res[1];
                var center = {
                    x: loc.x + size.width / 2,
                    y: loc.y + size.height / 2
                };
                var a1 = new wd.TouchAction(this);
                a1.press({
                    el: el,
                    x: center.x,
                    y: center.y - 100
                }).moveTo({
                    el: el
                }).release();
                var a2 = new wd.TouchAction(this);
                a2.press({
                    el: el,
                    x: center.x,
                    y: center.y + 100
                }).moveTo({
                    el: el
                }).release();
                var m = new wd.MultiAction(this);
                m.add(a1, a2);
                return m.perform();
            }.bind(this));
        }
    });

    var zoom = (function() {
        return function(el) {
            return Q.all([
                this.getWindowSize(),
                this.getLocation(el),
            ]).then(function(res) {
                var size = res[0];
                var loc = res[1];
                var center = {
                    x: loc.x + size.width / 2,
                    y: loc.y + size.height / 2
                };
                var a1 = new wd.TouchAction(this);
                a1.press({
                    el: el
                }).moveTo({
                    el: el,
                    x: center.x,
                    y: center.y - 100
                }).release();
                var a2 = new wd.TouchAction(this);
                a2.press({
                    el: el
                }).moveTo({
                    el: el,
                    x: center.x,
                    y: center.y + 100
                }).release();
                var m = new wd.MultiAction(this);
                m.add(a1, a2);
                return m.perform();
            }.bind(this));
        }
    });


    function WdAndroid(wd, pckg) {
        if (!(this instanceof WdAndroid))
            return new WdAndroid(opts);

        // merge all android elements
        _.extend(
            allElements,
            actionBarElements,
            buttonsElements,
            layoutElements,
            listElements,
            viewPagerElements,
            textElements);

        _.extend(this, wd);

        originalWd = wd;

        for (var m in allElements) {
            // ??Element(cb)
            this.addPromiseChainMethod(buildElementMethodName(m), buildMethod(allElements[m]));
            // ??Elements(cb)
            this.addPromiseChainMethod(buildElementsMethodName(m), buildElementsMethod(allElements[m]));
            // waitFor??Element(cb)
            this.addPromiseChainMethod(buildWaitForElementMethodName(m), buildWaitForElementMethod(allElements[m]));
            // shoudBe??Element()
            this.addElementPromiseChainMethod(buildShouldBeElementMethodName(m), buildShoulBeMethod(allElements[m]));
            /** the dream start here
                ??Children()
             **/

            this.addPromiseChainMethod(buildChildrenElementsMethodName(m), buildChildrenElementsMethod(allElements[m]));
            /** stop dreaming **/
        }

        this.addPromiseChainMethod('pinch', pinch());
        this.addPromiseChainMethod('swipe', swipe());

        this.addElementPromiseChainMethod('swipeElement', swipeElement());
        this.addElementPromiseChainMethod('tapElement', tapElement());

        this.addPromiseChainMethod('zoom', zoom());

    }

    // CommonJS module
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = WdAndroid;
        }
        exports.WdAndroid = WdAndroid;
    }

    // Register as an anonymous AMD module
    if (typeof define === 'function' && define.amd) {
        define([], function() {
            return WdAndroid;
        });
    }

})();