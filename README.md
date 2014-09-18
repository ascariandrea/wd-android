# wd-android
==========

A wrapper for wd node package optimized for Android.


## Install

```js
npm install wd-android
```


## Usage

How to instantiate:

```js
var wd = require('wd'),	
WdAndroid = require('wd-android');

var wdAndroid = new WdAdndroid(wd);
```


## Mocha Integration

```js
describe("Using Appium and WdAndroid to test Android App.", function(){
	this.timeout(300000);
    var driver,
   		allPassed = true;

    before(function() {

        var wdAndroid = new WdAndroid(wd);

        driver = wdAndroid.promiseChainRemote();

        return driver.init().setImplicitWaitTimeout(10000);

    });


    after(function() {
        return driver.quit();
    });


    afterEach(function() {
        allPassed = allPassed && this.currentTest.state === 'passed';
    });


    it("shoul find an element", function() {
        return driver
            .viewPagerElement()
            .swipe({
                "startX": 0.9,
                "startY": 0.5,
                "endX": 0.1,
                "endY": 0.5,
                "duration": 800
            })
            .swipe({
                "startX": 0.9,
                "startY": 0.5,
                "endX": 0.1,
                "endY": 0.5,
                "duration": 800
            })
            .swipe({
                "startX": 0.9,
                "startY": 0.5,
                "endX": 0.1,
                "endY": 0.5,
                "duration": 800
            })
            .waitForLinearLayout()
            .click();

    });
});
```


## Api 

More friendly method to referer to Android Element by XPath are provided.

```js
// driver.elementByXPath('//android.widget.FrameLayout')
driver.frameLayoutElement();

// driver.elementByXPath('//android.widget.LinearLayout')
driver.linearLayoutElement();

// driver.elementByXPath('//android.widget.ListView')
driver.listViewElement();

// driver.elementByXPath('//android.view.support.v4.ViewPager)
driver.viewPagerElement();

// driver.elementByXPath('//android.view.)
driver.webViewElement();

```

Built method to perform mobile gestures.

````js

// perform swipe from 90% of the screen width to 10%

driver.swipe({
	"startX": 0.9,
	"startY": 0.5,
	"endX": 0.1,
	"endY": 0.5,
	"duration": 800
});
```



