Javascript/PHP Spell Checker
============================

Word processor style spell check functionality for web applications.

Live Demo: https://www.lpology.com/code/spellcheck/

### Overview ###
Javascript/PHP Spell Checker makes it easy to add an MS Word-style spell checker to any web application with almost no configuration. It's fast, lightweight, and works in all major browsers.  

### Features ###

* Designed to mimic the appearance and feel of desktop word processor spell checkers.
* Provides a list of suggestions for misspelled words.
* Add spell check to any `<textarea>` or `<div contenteditable="true">`
* Pure Javascript - requires no external libraries. 
* Fast and lightweight - less than 4KB, minified and gzipped.
* Tested in IE7+, Firefox 4+, Safari 4+, and Chrome.

### Requirements ###

+ PHP 5.3+ with Pspell extension installed

### Getting Started ###
Copy `spellcheck.php` to your web directory. Include `spellcheck.min.css` and `spellcheck.min.js` into your page:

```html
<head>
	<link rel="stylesheet" href="spellcheck.min.css">
	<script src="spellcheck.min.js"></script>
</head>
```

Initialize the spell checker when the DOM is ready. There are three required parameters:

```javascript
var checker = new sc.SpellChecker({
	button: 'spellcheck_button', // HTML element that will open the spell checker when clicked
	textInput: 'text_box', // HTML field containing the text to spell check
	action: 'spellcheck.php' // URL of the server side script 
});
```

```html
<textarea id="text_box"></textarea>
<input type="button" id="spellcheck_button" value="Check Spelling">
```

### Installing Pspell ###
You'll need to install aspell, a dictionary, and the php-pspell module if not already installed:

```
sudo yum install aspell aspell-en
sudo yum install php-pspell
```

Then restart Apache:

```
sudo service httpd restart
```

### API Reference ###

#### Settings ####

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Type</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>action</td>
      <td>String<br />Default: <code>""</code></td>
      <td>Location of spellcheck.php on the server.</td>
    </tr>
    
    <tr>
      <td>button</td>
      <td>Mixed<br />Default: <code>""</code></td>
      <td>Button that opens spell checker. Accepts an element ID string, element, or jQuery object.</td>
    </tr>

    <tr>
      <td>textInput</td>
      <td>Mixed<br />Default: <code>""</code></td>
      <td>Text input to spell check. Accepts an element ID string, element, or jQuery object.</td>
    </tr>

    <tr>
      <td>name</td>
      <td>String<br />Default: <code>""</code></td>
      <td>Parameter name of text sent to server.</td>
    </tr>

    <tr>
      <td>data</td>
      <td>Object<br />Default: <code>{}</code></td>
      <td>Additional data to send to the server.</td>
    </tr>    
    
    <tr>
      <td>debug</td>
      <td>Boolean<br />Default: <code>false</code></td>
      <td>Set to <code>true</code> to log progress messages and server response in the console.</td>
    </tr>    
    
  </tbody>
</table>

#### Callback Functions ####

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Arguments</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>onOpen</td>
      <td><code>button</code> (Element),<br /><code>text</code> (String)</td>
      <td>Function to be called when spell checker is opened, after successful server response.<br /><br />The function gets passed two arguments: (1) a reference to the spell check button; (2) a string containing the text that is to be spell checked.</td>
    </tr>
    
    <tr>
      <td>onClose</td>
      <td><code>button</code> (Element),<br /><code>text</code> (String)</td>
      <td>Function to be called after the spell checker is closed.<br /><br />The function gets passed two arguments: (1) a reference to the spell check button; (2) a string containing the spell checked text, including any changes.</td>
    </tr>    
  </tbody>
</table>

#### Instance Methods ####

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Arguments</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>destroy</td>
      <td><i>none</i></td>
      <td>Completely removes spell check functionality. All event listeners, CSS classes, and DOM elements added by the plugin are removed.</td>
    </tr>   
  </tbody>
</table>

### License ###
Released under the MIT license.

[![githalytics.com alpha](https://cruel-carlota.pagodabox.com/c658e3ccc513c56cc253223a42274cb7 "githalytics.com")](http://githalytics.com/LPology/Javascript-PHP-Spell-Checker)