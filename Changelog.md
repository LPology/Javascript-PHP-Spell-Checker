Change Log 
============================
### Version 1.4 ###
* Plugin is now wrapped in an IIFE
* Regular expressions are now pre-compiled and cached for better performance
* Added several CSS fixes for IE7-IE9
* Cleaned up CSS and removed a number of duplicate/redundant rules
* Switched to a unique ID function that is RFC 4122 version 4 compliant
* Any 2xx status code is now handled as a successful response (previously, only `200` was successful)
* Added `"use strict";` to every function
* Cleaned up some messy code -- organization, unnecessary variable copying, etc.