(function() {
    "use strict";

    var _ = require('underscore');

    var wd = null,
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

    var swipe = function(opts) {
        var action = new wd.TouchAction(this);
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

    WdAndroid.prototype.buildMethod = function(path) {
        return (function() {
            return this.elementByXPath('//'.concat(path));
        });
    };

    WdAndroid.prototype.buildWaitForElementMethodName = function(path) {
        return (function() {
            return this.waitForElementByXPath('//'.concat(path));
        });
    };

    function buildElementMethodName(m) {
        return m.substring(0, 1).toLowerCase().concat(m.substring(1)).concat('Element');
    }

    function buildWaitForElementMethodName(m) {
        return "waitFor".concat(buildElementMethodName(m));
    }


    function WdAndroid(wd) {
        if (!(this instanceof WdAndroid))
            return new WdAndroid(opts);

        _.extend(allElements, buttonsElements, layoutElements, listElements, viewPagerElements);

        _.extend(this, wd);

        var wd = wd;

        for (var m in allElements) {
            this.addPromiseChainMethod(buildElementMethodName(m), this.buildMethod(allElements[m]));
            this.addPromiseChainMethod(buildWaitForElementMethodName(m), this.buildWaitForElementMethodName(allElements[m]));
        }

        this.addPromiseChainMethod('swipe', swipe);

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