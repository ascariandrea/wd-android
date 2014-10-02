(function() {
    "use strict";

    var _ = require('underscore'),
        __slice = Array.prototype.slice,
        xpath = require('xpath'),
        dom = require('xmldom').DOMParser,
        Q = require('q');


    var originalWd = null,
        allElements = {},
        defaultPckg;

    var actionBarElements = {
        'ActionBarTab': 'android.app.ActionBar.Tab',
    };

    var buttonsElements = {
        'Button': 'android.widget.Button',
        'ImageButton': 'android.widget.ImageButton',
        'MediaRouteButton': 'android.app.MediaRouteButton',
        'RadioButton': 'android.widget.RadioButton',
        'ToggleButton': 'android.widget.ToggleButton',
        'ZoomButton': 'android.widget.ZoomButton'
    };

    var layoutElements = {
        'AbsoluteLayout': 'android.widget.AbsoluteLayout',
        'DrawerLayout': 'android.support.v4.widget.DrawerLayout',
        'FrameLayout': 'android.widget.FrameLayout',
        'GridLayout': 'android.widget.GridLayout',
        'LinearLayout': 'android.widget.LinearLayout',
        'NoSaveStateFrameLayout': 'android.support.v4.widget.NoSaveStateFrameLayout',
        'RelativeLayout': 'android.widget.RelativeLayout',
        'SlidingPaneLayout': 'android.support.v4.widget.SlidingPaneLayout',
        'SwipeRefreshLayout': 'android.support.v4.widget.SwipeRefreshLayout',
        'TableLayout': 'android.widget.TableLayout'
    };

    var listElements = {
        'ExpandableListView': 'android.widget.ExpandableListView',
        'ListView': 'android.widget.ListView',
    };

    var viewPagerElements = {
        'ViewPager': 'android.support.v4.view.ViewPager'
    };

    var webElements = {
        'WebView': 'android.webkit.WebView'
    };

    var tabElements = {
        'TableRow': 'android.widget.TableRow',
        'TabHost': 'android.widget.TabHost',
        'TabWidget': 'android.widget.TabWidget'
    };

    var textElements = {
        'AutoCompleteTextView': 'android.widget.AutoCompleteTextView',
        'MultiAutoCompleteTextView': 'android.widget.MultiAutoCompleteTextView',
        'CheckedTextView': 'android.widget.CheckedTextView',
        'EditTextView': 'android.widget.EditTextView',
        'ExtractEditText': 'android.widget.ExtractEditText',
        'TextClock': 'android.widget.TextClock',
        'TextSwitcher': 'android.widget.TextSwitcher',
        'TextView': 'android.widget.TextView',
    };

    var buildArgs = function(path, args) {
        var args = __slice.call(args);
        var buildPath = ' //'.concat(path);
        args[0] = buildPath;

        return args;
    };

    var buildMethod = function(path) {
        return (function() {
            return this.elementByXPath.apply(this, buildArgs(path, arguments));
        });
    };

    var buildIdMethod = function(methodName) {
        return (function() {
            var args = __slice.call(arguments);
            args[0] = checkId(args[0]);

            return this[methodName].apply(this, args);
        });
    };

    var defaultAlertId = 'android:id/parentPanel';

    var buildAlertMethod = function() {
        return (function() {
            var args = __slice.call(arguments);

            if (typeof args[0] != 'string')
                args.unshift(defaultAlertId);

            return this.elementById.apply(this, args);
        });
    };

    var alertButton = function(buttonId) {
        return (function() {
            var args = __slice.call(arguments);

            if (typeof args[0] != 'string')
                args.unshift(buttonId);

            return this.elementById.apply(this, args);
        });
    };

    var shouldAppearAlertElement = function() {
        return (function() {
            var args = __slice.call(arguments);

            if (typeof args[0] != 'string')
                args.unshift(defaultAlertId);

            return this.elementById.apply(this, args);
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


    var checkId = function(id) {
        var idRegExp = new RegExp(/^([a-zA-Z0-9]+\.)([a-zA-Z0-9]+\.)([a-zA-Z0-9]+\:)[id]+\/([a-zA-Z0-9]+)$/);
        if (!idRegExp.test(id))
            id = defaultPckg.concat(':id/').concat(id);

        return id;
    }


    var promisesList = function() {
        var calls = [],
            args = __slice.call(arguments);

        var func = args[0],
            occurences = args[1];

        for (var i in occurences)
            calls.push(this[func](occurences[i]));

        return calls;
    };

    var buildChildrenElementsMethod = function(path) {
        return (function() {

            var args = __slice.call(arguments);

            return this.source(function(err, source) {
                return source;
            }).then(function(source) {
                var childrenPaths = xmlProcessor(source, checkId(args[0]), path);

                var result = null;
                if (childrenPaths && childrenPaths.length) {
                    result = Q.all(promisesList.call(this, 'elementByXPath', childrenPaths));
                }

                return result;

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
        return capitalizeString(m).concat('Children');
    }

    var __xPath = '',
        elementsIndexes = [];

    function __xPathParser(el, elIndex, id) {
        var childIndex = null;

        if (el.parentNode && el.tagName != 'hierarchy') {
            var parent = el.parentNode;


            if (!elIndex && typeof elIndex !== 'number') {
                var i = 0;
                _.each(parent.childNodes, function(c) {
                    if (c.tagName == el.tagName)
                        i++;

                    var resourceIdAttr = __slice.call(c.attributes).filter(function(a) {
                        return (a.localName == 'resource-id' && a.value == id);
                    });

                    if (resourceIdAttr && resourceIdAttr.length) {
                        childIndex = i - 1;
                        return;
                    }
                });

            } else {
                var parentChildrenCount = __slice.call(el.parentNode.childNodes).length;
                var nextItemsCount = nextCounter(el, el.tagName);
                var childIndex = parentChildrenCount - nextItemsCount - 1;
            }


            __xPath = '/' + el.tagName + '[' + (childIndex + 1) + ']' + __xPath;

            __xPathParser(el.parentNode, childIndex);
        }


        return '/' + __xPath;
    }

    var nextCount = 0;
    var nextCounter = function(el, tagName) {

        if (el.nextSibling) {
            if (el.tagName == tagName) nextCount++;
            return nextCounter(el.nextSibling, tagName);
        }

        return nextCount;
    };



    function xmlProcessor(source, id, tagName) {
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

        if (found)
            __xTotalPath = __xPathParser(nodes[index].ownerElement, null, id);

        // map children matching requested elements

        var matchedChildrenPaths = [];
        var childIndex = 0;

        _.each(__slice.call(nodes[index].ownerElement.childNodes), function(c) {
            console.log(c.tagName);
            if (c.tagName == tagName) {
                childIndex++;
                matchedChildrenPaths.push(__xTotalPath + '/' + tagName + '[' + childIndex + ']');
            }
        });


        return matchedChildrenPaths;
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
            // elements??Children(id, cb)
            this.addPromiseChainMethod(buildChildrenElementsMethodName(m), buildChildrenElementsMethod(allElements[m]));

        }

        defaultPckg = pckg;

        // elementBySimpleId(id, cb)
        this.addPromiseChainMethod('elementBySimpleId', buildIdMethod('elementById'));
        this.addPromiseChainMethod('waitForElementBySimpleId', buildIdMethod('waitForElementById'));


        this.addPromiseChainMethod('alertElement', buildAlertMethod());
        this.addPromiseChainMethod('shouldAppearAlertElement', shouldAppearAlertElement());
        this.addPromiseChainMethod('positiveAlertButton', alertButton('android:id/button1'));
        this.addPromiseChainMethod('negativeAlertButton', alertButton('android:id/button2'));
        this.addPromiseChainMethod('neutralAlertButton', alertButton('android:id/button3'));


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