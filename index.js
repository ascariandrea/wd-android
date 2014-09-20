(function() {
    "use strict";

    var _ = require('underscore'),
        __slice = Array.prototype.slice,
        Q = require('q');

    var originalWd = null,
        allElements = {};

    var buttonsElements = {
        'Button': 'android.widget.Button',
        'ImageButton': 'android.widget.ImageButton'
    };

    var layoutElements = {
        'FrameLayout': 'android.widget.FrameLayout',
        'LinearLayout': 'android.widget.LineaLayout',
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

    var buildArgs = function(path, args) {

        console.log(args);
        var args = __slice.call(args);
        var buildPath = '//'.concat(path);
        args[0] = buildPath;

        return args;
    }

    WdAndroid.prototype.buildMethod = function(path) {
        return (function() {
            return this.elementByXPath.apply(this, buildArgs(path, arguments));
        });
    };

    WdAndroid.prototype.buildWaitForElementMethod = function(path) {
        return (function() {
            return this.waitForElementByXPath.apply(this, buildArgs(path, arguments));
        });
    };

    WdAndroid.prototype.buildShoulBeMethod = function(path) {
        return (function() {
            return this.getTagName(function(err, name) {
                return name;
            }).then(function(name) {
                return name.should.be.eql(path);
            });
        });
    };

    WdAndroid.prototype.isViewPager = function(tagName) {
        return (function() {
            return tagName === path;
        });
    };

    function buildElementMethodName(m, cap) {
        var firstChar;
        if (!cap)
            cap = false;

        if (cap === false)
            firstChar = m.charAt(0).toLowerCase();
        else
            firstChar = m.charAt(0).toUpperCase();

        return firstChar.concat(m.slice(1)).concat('Element');
    }

    function buildWaitForElementMethodName(m) {
        return "waitFor".concat(buildElementMethodName(m, true));
    }

    function buildShouldBeElementMethodName(m) {
        return "shouldBe".concat(buildElementMethodName(m, true));
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


    function WdAndroid(wd) {
        if (!(this instanceof WdAndroid))
            return new WdAndroid(opts);

        // merge all android elements
        _.extend(allElements, buttonsElements, layoutElements, listElements, viewPagerElements);


        _.extend(this, wd);

        originalWd = wd;

        for (var m in allElements) {
            // ??Element(cb)
            this.addPromiseChainMethod(buildElementMethodName(m), this.buildMethod(allElements[m]));
            // waitFor??Element(cb)
            this.addPromiseChainMethod(buildWaitForElementMethodName(m), this.buildWaitForElementMethod(allElements[m]));
            // // shoudBe??Element()
            this.addElementPromiseChainMethod(buildShouldBeElementMethodName(m), this.buildShoulBeMethod(allElements[m]));
        }

        this.addPromiseChainMethod('pinch', pinch());
        this.addPromiseChainMethod('swipe', swipe());
        this.addPromiseChainMethod('zoom', zoom());

        return this;
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