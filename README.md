PHP-Javascript-Spell-Checker
============================

### Javascript/PHP Spell Checker ###
v1.0.0

Drop-in spell check functionality for web applications.

<strong><a href="http://www.lpology.com/code/spellcheck/">Try a Demo</a></strong>

### Features ###
* Designed to mimic the appearance and feel of desktop word processor spell checkers.
* Provides suggestions for misspelled words.
* Pure Javascript -- requires no external libraries.
* Fast and lightweight - only 2.9KB minified and gzipped.
* Tested in IE7+, Firefox 4+, Safari 4+, and Chrome.

### Requirements ###
* PHP 5 with Pspell extension installed
* Pspell extension

### Getting Started ###
Copy `spellcheck.php` to your web directory. Include `spellcheck-1.0.0.min.css` and `spellcheck-1.0.0.min.js` into your page:

```html
<head>
	<link rel="stylesheet" href="spellcheck-1.0.0.min.css">
	<script type="text/javascript" src="spellcheck-1.0.0.min.js"></script>
</head>
```

Initialize the spell checker when the DOM is ready. There are three required parameters:


```javascript
var checker = new sc.SpellChecker(
	'spellcheck_button', // HTML element that will open the spell checker when clicked
	'text_box', // HTML field containing the text to spell check
	'/spell.php' // URL of the server side script 
);
```

```html
<textarea id="text_box"></textarea>
<input type="button" id="spellcheck_button" value="Check Spelling">
```

### License ###
Released under the MIT license.