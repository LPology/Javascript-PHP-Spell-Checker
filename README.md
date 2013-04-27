Javascript/PHP Spell Checker
============================

Word processor style spell check functionality for web applications.

Live Demo: http://www.lpology.com/code/spellcheck/

### Overview ###
Javascript/PHP Spell Checker makes it easy to add an MS Word-style spell checker to any web application with almost no configuration. It's fast, lightweight, and works in all major browsers.  

### Features ###

* Designed to mimic the appearance and feel of desktop word processor spell checkers.
* Provides a list of suggestions for misspelled words.
* Add spell check to any `<textarea>` or `<div contenteditable="true">`
* Pure Javascript - requires no external libraries. 
* Fast and lightweight - only 3.2KB minified and gzipped.
* Tested in IE7+, Firefox 4+, Safari 4+, and Chrome.

### Requirements ###

+ PHP 5.3+ with Pspell extension installed

### Getting Started ###
Copy `spellcheck.php` to your web directory. Include `spellcheck.css` and `spellcheck.js` into your page:

```html
<head>
	<link rel="stylesheet" href="spellcheck.css">
	<script src="spellcheck.js"></script>
</head>
```

Initialize the spell checker when the DOM is ready. There are three required parameters:


```javascript
var checker = new sc.SpellChecker(
	button: 'spellcheck_button', // HTML element that will open the spell checker when clicked
	textInput: 'text_box', // HTML field containing the text to spell check
	action: '/spellcheck.php' // URL of the server side script 
);
```

```html
<textarea id="text_box"></textarea>
<input type="button" id="spellcheck_button" value="Check Spelling">
```

### License ###
Released under the MIT license.