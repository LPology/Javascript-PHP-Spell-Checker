Change Log 
============================
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