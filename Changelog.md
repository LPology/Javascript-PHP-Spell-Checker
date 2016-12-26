Change Log 
============================
### Version 1.6.1 ###
spellcheck.js:
* Updated `sc.trim()` method to use native trim if available
* Clicking background overlay will now close the spell check window

### Version 1.5.3 ###
spellcheck.css:
* Added `box-sizing: content-box;` rule to elements within spell check box

### Version 1.5.2 ###
spellcheck.js:
* Overhauled undo functionality for improved performance and support for reversal of multiple, consecutive changes
* Combined `_showReviewer()` with `_begin()` to eliminate an unnecessary function call
* Removed some unnecessary variable copying

### Version 1.5.1 ###
spellcheck.js:
* Added `debug` option to view progress messages and server response in the console
* Switched to a better method of handling server responses -- more reliable, improved error handling
* XHR responses are now only handled if the spell checker is open -- closing before a request is completed effectively abandons the request

spellcheck.css:
* Added 1px #AAA border to spell check box

### Version 1.5 ###
spellcheck.js:
* Added `onOpen()` and `onClose()` callback methods
* Added `destroy()` method for removing spell check functionality
* The `name` option is now properly URI encoded prior to server request
* Event message "OK" button is now given focus when displayed to allow closing with "Enter" button

spellcheck.css:
* Cleaned up formatting and organization, removed duplicate and unnecessary CSS styles
* Added several IE7-specific enhancements

spellcheck.php:
* Added `/u` modifier to `preg_split()` regex pattern to properly handle words with accents - <a href="https://github.com/LPology/Javascript-PHP-Spell-Checker/pull/1">#1</a> (special thanks to <a href="https://github.com/tssk">tssk</a> for this)

### Version 1.4 ###
* Plugin is now wrapped in an IIFE
* Regular expressions are now pre-compiled and cached for better performance
* Made several IE-specific CSS fixes (for IE7-IE9)
* Cleaned up CSS and removed a number of duplicate/redundant rules
* Switched to a unique ID function that is RFC 4122 version 4 compliant
* Any 2xx status code is now handled as a successful response (previously, only `200` was successful)
* Added `"use strict";` to every function
* Cleaned up some messy code -- organization, unnecessary variable copying, etc.