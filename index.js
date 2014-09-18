(function() {
    "use strict";

    var _ = require('underscore'),
        __slice = Array.prototype.slice;

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

    var buildArgs = function(path, args) {
        var args = __slice.call(arguments);
        args[0] = '//'.concat(path);
        return args;
    }

    WdAndroid.prototype.buildMethod = function(path) {
        return (function() {
            console.log(buildArgs(path, arguments));

            return this.elementByXPath.apply(this, buildArgs(path, arguments));
        });
    };

    WdAndroid.prototype.buildWaitForElementMethodName = function(path) {
        return (function() {
            return this.waitForElementByXPath.apply(this, buildArgs(path, arguments));
        });
    };

    function buildElementMethodName(m) {
        return m.substring(0, 1).toLowerCase().concat(m.substring(1)).concat('Element');
    }

    function buildWaitForElementMethodName(m) {
        return "waitFor".concat(buildElementMethodName(m));
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


    function WdAndroid(wd) {
        if (!(this instanceof WdAndroid))
            return new WdAndroid(opts);

        _.extend(allElements, buttonsElements, layoutElements, listElements, viewPagerElements);

        _.extend(this, wd);

        originalWd = wd;

        for (var m in allElements) {
            this.addPromiseChainMethod(buildElementMethodName(m), this.buildMethod(allElements[m]));
            this.addPromiseChainMethod(buildWaitForElementMethodName(m), this.buildWaitForElementMethodName(allElements[m]));
        }

        this.addPromiseChainMethod('swipe', swipe());

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