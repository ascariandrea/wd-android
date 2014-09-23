# wd-android
==========

A wrapper for `wd` node package optimized for Android to work with [appium.io](http://appium.io).

## Install

```js
npm install wd-android
```

## Prerequisites
You need to install **Appium** and then check if your `ANDROID_HOME` and `JAVA_HOME` are correctly.

You can achieve this by running:

```
$ appium-doctor --android
	Running Android Checks
	✔ ANDROID_HOME is set to "/path/to/android/sdk"
	✔ JAVA_HOME is set to "/path/to/java/sdk"
	✔ ADB exists at /sdk/platform-tools/adb
	✔ Android exists at /sdk/tools/android
	✔ Emulator exists at /sdk/tools/emulator
	✔ Android Checks were successful.

	✔ All Checks were successful
```

If you're usigin Android Studio and you have installed the sdk in Android Studio folder, may you need to run:

```
$ ln -s /path/to/Android Studio.app /path/to/AndroidStudioApp
$ export ANDROID_HOME=/path/to/AndroidStudioApp/sdk
```

Cause [Appium](http://appium.io) doesn't work with spaces in `ANDROID_HOME` or `JAVA_HOME` paths.


## Usage

How to instantiate:

```js
var wd = require('wd'),	
	WdAndroid = require('wd-android');

var wdAndroid = new WdAdndroid(wd);

var driver = wdAndroid.promiseChainRemote();

driver.init().setImplicitWaitTimeout(10000);
driver
	.viewPagerElement()
	.swipe({
   		"startX": 0.9,
       "startY": 0.5,
       "endX": 0.1,
       "endY": 0.5,
       "duration": 800
	})
   .waitForLinearLayout()
   .click();

```



## Api 

More friendly methods to referer to Android Elements than by XPath are provided.

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

#### Mobile Gestures
Built in methods to perform mobile gestures.

```js
// perform swipe from 90% of the screen width to 10%

driver.swipe({
	"startX": 0.9,
	"startY": 0.5,
	"endX": 0.1,
	"endY": 0.5,
	"duration": 800
});
```

#### Should integration


```js

// wd way
driver.
	.elementById('com.example.app:id/loginButton')
	.then(function(el) {
		return el.getTagName(function(err, name) {
			return name;
		});
	}).then(function(name){
		return name.should.be.eql('android.widget.Button')
	});

// wd-android way
driver
	.elementById('com.example.app:id/loginButton')
	.shouldBeButtonElement()
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
            .waitForLinearLayout()
            .click();

    });
});
```



