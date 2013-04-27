Javascript/PHP Spell Checker v. 1.3
============================

Word processor style spell check functionality for web applications.

<strong><a href="http://www.lpology.com/code/spellcheck/">Try a Demo</a></strong>

### Features ###
* Designed to mimic the appearance and feel of desktop word processor spell checkers.
* Provides suggestions for misspelled words.
* Pure Javascript -- requires no external libraries.
* Fast and lightweight - only 3.2KB minified and gzipped.
* Tested in IE7+, Firefox 4+, Safari 4+, and Chrome.

### Requirements ###
* PHP5 with Pspell extension installed

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