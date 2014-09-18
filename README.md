# wd-android
==========

A wrapper for wd node package optimized for Android.


## Install

```
npm install wd-android
```


## Usage

How to instantiate:

```
var wd = require('wd'),
	WdAndroid = require('wd-android');
	
var wdAndroid = new WdAdndroid(wd);
```


## Mocha Integration

```
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