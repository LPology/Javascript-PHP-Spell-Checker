/**
 * Javascript/PHP Spell Checker v1.1
 * https://github.com/LPology/Javascript-PHP-Spell-Checker
 *
 * Copyright 2012 LPology, LLC  
 * Released under the MIT license
 */ 
 
var sc = sc || {};

sc._ = function(elem) {
	return document.getElementById(elem);
};

/**
 * Accepts an object and returns an array of its property names
 */
sc.objectKeys = function(obj) {
	var prop,
		keys = [];
	if (typeof obj !== 'object') {
		return false;
	}
	for (prop in obj) {
		if (obj.hasOwnProperty(prop)) {
			keys.push(prop);
		}
	}
	return keys;
};

/**
 * Converts object to query string
 */ 
sc.obj2string = function(obj, prefix) {
    var str = [],
		prop;
	if (typeof obj !== 'object') {
		return '';
	}
    for (prop in obj) {
		if (obj.hasOwnProperty(prop)) {
			var k = prefix ? prefix + "[" + prop + "]" : prop, v = obj[prop];
			str.push(typeof v === 'object' ? 
				sc.obj2string(v, k) :
				encodeURIComponent(k) + '=' + encodeURIComponent(v));
		}	
    }
    return str.join('&');
};

/**
 * Copies all missing properties from second object to first object
 */ 
sc.extendObj = function(first, second) {
	var prop;
	if (typeof first !== 'object' || typeof second !== 'object') {
		return false;
	}
	for (prop in second) {
		if (second.hasOwnProperty(prop)) {
			first[prop] = second[prop];
		}
	}
	return true;
};


sc.trim = function(text) {
	return text.toString().replace(/^\s+/, '').replace( /\s+$/, '');
};

sc.getId = (function() {
    var id = 0;
    return function(){ 
		id++;
		return id + (new Date()).getTime();
	};
})();

sc.addEvent = function(elem, type, fn) {
	if (typeof elem === 'string') {
		elem = sc._(elem);
	}	
	if (elem.attachEvent) {
		elem['e'+type+fn] = fn;
		elem[type+fn] = function(){elem['e'+type+fn]( window.event );};
		elem.attachEvent('on'+type, elem[type+fn]);
	} else {
		elem.addEventListener(type, fn, false);
	}
};

sc.removeEvent = function(elem, type, fn) {
	if (typeof elem === 'string') {
		elem = sc._(elem);
	}
	if (elem.detachEvent) {
		elem.detachEvent('on'+type, elem[type+fn]);
		elem[type+fn] = null;
	} else {
		elem.removeEventListener(type, fn, false);
	}
};

/**
 * Finds the index of an element with a particular offset within an array
 * @param {Array} arr
 * @param {Mixed} value
 * @return The index of the element within the array, or false if not found
 */
sc.findIndex = function(arr, value, matchOffset) {
	var i,
		size,
		matchNum = 1;
	for (i = 0, size = arr.length; i < size; i++) {
		if (arr[i] == value) {
			if (matchNum == matchOffset) {
				return i;
			}
			matchNum++;
		}
	}
	return false;
};

sc.newXHR = function() {
	if (typeof(XMLHttpRequest) !== undefined) {
		return new window.XMLHttpRequest();
	} else if (window.ActiveXObject) {
		try {
			return new window.ActiveXObject('Microsoft.XMLHTTP');
		} catch (err) {}
	}
};

sc.evalJSON = function(data) {
	var obj = {};
	if (!data || typeof data !== 'string') {
		obj = {success:false};
		return obj;
	}
	data = sc.trim(data);		
	if (window.JSON && window.JSON.parse) {
		try {
			obj = window.JSON.parse(data);
		}
		catch (err) {
			obj = {success:false};
		}
	} else {
		try {
			obj = eval("(" + data + ")");
		}
		catch (err) {
			obj = {success:false};
		}
	}
	return obj;
};

/**
 * Accepts a jquery object, a string containing an element ID, or an element, 
 * verifies that it exists, and returns the element.
 * @param {Mixed} elem
 * @return {Element} 
 */
sc.verifyElem = function(elem) {
    if (elem.jquery) {
        elem = elem[0];
    } else if (typeof elem === 'string') {
        if (/^#.*/.test(elem)) {				
            elem = elem.slice(1);                
        }
        elem = document.getElementById(elem);
    }
    if (!elem || elem.nodeType !== 1) {
		return false;
    }
    if (elem.nodeName.toUpperCase() == 'A') {                      
        sc.addEvent(elem, 'click', function(e) {
            if (e && e.preventDefault) {
                e.preventDefault();
            } else if (window.event) {
                window.event.returnValue = false;
            }
        });
    }
	return elem;
};

/**
* @constructor
* @param {Object} options
*/
sc.SpellChecker = function(options) {

	var self = this;

	self._settings = {
		action: '',		// URL of server script
		button: '',		// Button that opens spell checker
		textInput: '',	// Text input to spell check
		name: 'text',	// Name of text sent to server
		data: {}		// Additional data to send to the server (optional)
	};
	
	sc.extendObj(self._settings, options);
	
	self._button = sc.verifyElem(self._settings.button);
	self._textInput = sc.verifyElem(self._settings.textInput);	
	
	if (self._button === false) {
		throw new Error("Invalid button. Make sure the element you're passing exists."); 
	}	
	if (self._textInput === false) {
		throw new Error("Invalid text field. Make sure the element you're passing exists."); 
	}	
	
	self._serverURL = self._settings.action;
	self._text = null;
	self._wordObject = null;
	self._wordKeys = null;
	self._currentWord = null;
	self._wordMatches = null;
	self._matchOffset = null;
	self._canUndo = null;
	self._undoPrevious = null;
	self._previousWordMatches = null;
	self._previousMatchOffset = null;
	self._uniqueID = null;
	self._isOpen = null;
  
	self.enable();			
};

sc.SpellChecker.prototype = {

    enable: function() {
	
		var self = this,
			currentBox,
			contextBox;
		
		self._isOpen = false;
		self._uniqueID = sc.getId();
		self._createHTML();
		
		currentBox = sc._('spell-current'+self._uniqueID);
		contextBox = sc._('spell-context'+self._uniqueID);		
								
		sc.addEvent(self._button, 'click', function() {
			self._openChecker();
		});
		sc.addEvent('spelling-ignore'+self._uniqueID, 'click', function() {
			self._ignoreChange();
		}); 
		sc.addEvent('spelling-ignore-all'+self._uniqueID, 'click', function() {
			self._ignoreChange(true);
		});		
		sc.addEvent('spell-change'+self._uniqueID, 'click', function() {
			self._makeChange();
		});
		sc.addEvent('spell-change-all'+self._uniqueID, 'click', function() {
			self._makeChange(true);
		});		
		sc.addEvent('spell-close'+self._uniqueID, 'click', function() {
			self._closeChecker();
		});	
		sc.addEvent('spell-msg-close'+self._uniqueID, 'click', function() {
			self._closeChecker();
		});
				
		sc.addEvent('spell-undo'+self._uniqueID, 'click', function() {
			if (self._canUndo === false) {
				return;
			}
			self._undoChange();
		});			
				
		// Unselect any suggestion if user clicks either input so that word is 
		// changed to correct spelling
		sc.addEvent(currentBox, 'click', function() {
			sc._('spelling-suggestions'+self._uniqueID).selectedIndex = -1;
		});
		sc.addEvent(contextBox, 'click', function() {
			sc._('spelling-suggestions'+self._uniqueID).selectedIndex = -1;
		});		
		
		// Change "Not found in dictionary" if user edits within word context box
		sc.addEvent(currentBox, 'keyup', function() {
			var that = this,
				span = contextBox.getElementsByTagName('span')[0];
			if (span && span.firstChild) {					
				span.firstChild.nodeValue = that.value;
			}
		});	
		// Change word context also if user edits "Not found in dictionary" box		
		sc.addEvent(contextBox, 'keyup', function() {
			var that = this,
				span = that.getElementsByTagName('span')[0];
			if (span && span.firstChild) {
				currentBox.value = span.firstChild.nodeValue;
			}		
		});		
    },
	
	/**
	 * Begins the spell check function.
	 */			
	_openChecker: function() {
		var self = this,
			text = self._textInput.value;

		if (self._isOpen === true) {
			return;
		}

		sc._('spell-undo'+self._uniqueID).setAttribute('disabled', true);
		self._canUndo = false;	
		
		sc._('spell-overlay'+self._uniqueID).style.display = 'block';		
		self._isOpen = true;	
		
		self._text = text;
				
		// Close the spell checker if user presses escape key
		self._esc = function(event) {
				if (event.keyCode === 27 && self._isOpen === true) {	
					self._closeChecker();
				}
			};
			
		sc.addEvent(document, 'keyup', self._esc);			
		self._notifyMsg('checking');
		
		// Send the text to the server
		self._sendData();		
	},
	
	/**
	 * Closes the spell check box and cleans up.
	 */			
	_closeChecker: function() {
		var self = this;

		if (self._isOpen !== true) {
			return;
		}
		
		// Reset everything after finishing
		sc._('spell-modal'+self._uniqueID).style.display = 'none';
		sc._('spell-overlay'+self._uniqueID).style.display = 'none';
				
		self._text = null;
		self._wordObject = null;
		self._wordKeys = null;
		self._currentWord = null;
		self._wordMatches = null;
		self._matchOffset = null;	
		self._canUndo = null;		
		self._undoPrevious = null;
		self._previousWordMatches = null;
		self._previousMatchOffset = null;		
		self._isOpen = null;
		
		// Removes listener for escape key
		sc.removeEvent(document, 'keyup', self._esc);		
	},
	
	/**
	 * Opens the review box to resolve a word.
	 */			
	_showReviewer: function() {
		var self = this;
		
		sc._('spell-msg'+self._uniqueID).style.display = 'none';		
		sc._('spelling-inner'+self._uniqueID).style.display = 'block';
		sc._('spell-modal'+self._uniqueID).style.cssText = 'width:480px;height:390px;margin-left:-240px;margin-top:-195px;display:block;';
	},
	
	/**
	 * Provides user with status messages.
	 */		
	_notifyMsg: function(type) {
		var self = this,
			msg,
			closeBox = sc._('spell-msg-close-box'+self._uniqueID),
			minHeight = 106,
			marginTop = 53;
		
		if (type == 'checking') {
			msg = 'Checking...';
			closeBox.style.display = 'none';
			minHeight = 86;
			marginTop = 43;
		} else {
			closeBox.style.display = 'block';
		}
		
		if (type == 'servererror') {
			msg = 'We have experienced an error and cannot complete the spell check.';
		}
		if (type == 'noerrors') {
			msg = 'Spell check completed. No errors found.';
		}
		if (type == 'finished') {
			msg = 'Spell check completed';
		}
		
		sc._('spelling-inner'+self._uniqueID).style.display = 'none';
		sc._('spell-msg-text'+self._uniqueID).innerHTML = msg;
		sc._('spell-msg'+self._uniqueID).style.display = 'block';		
		sc._('spell-modal'+self._uniqueID).style.cssText = 'width:290px;height:auto;min-height:'+minHeight+'px;margin-left:-145px;margin-top:-'+marginTop+'px;display:block;';
	},
	
	
	/**
	 * Ignores the potentially misspelled word currently in review
	 */		
	_ignoreChange: function(ignoreAll) {
		var self = this,
			keys = self._wordKeys,
			wordMatches = self._wordMatches,
			matchOffset = self._matchOffset,
			moreMatches;

		if (ignoreAll === true || wordMatches <= 1 || matchOffset === wordMatches) {
			keys.splice(0, 1);
			self._matchOffset = 1; // Reset to 1 in case there is another word to review	
			moreMatches = false;
		} else {
			// Increment the match counter because we're using the same word next round
			// This prevents us from reviewing the same occurrence of this word
			self._matchOffset = matchOffset + 1;
			moreMatches = true; // There are remaining duplicates of this word to review
		}
		
		// Disable "Undo" in case the prior action was a change
		sc._('spell-undo'+self._uniqueID).setAttribute('disabled', true);
		self._canUndo = false;
		self._wordKeys = keys;	

		if (keys.length > 0 || moreMatches === true) {
			// Continue editing if that wasn't the last word			
			self._reviewWord(false);
		} else {
			self._notifyMsg('finished');
		}		
	},
	
	/**
	 * Changes the misspelled word currently in review
	 */				
	_makeChange: function(changeAll) {
		var self = this,
			text = self._text,
			currentWord = self._currentWord,
			wordMatches = self._wordMatches,
			matchOffset = self._matchOffset,
			select = sc._('spelling-suggestions'+self._uniqueID),
			selected_option = select.selectedIndex,
			regex = new RegExp(currentWord, 'g'),
			keys = self._wordKeys,
			m = 0,
			new_word,
			new_text,
			moreMatches;
		
		// Save backup copy of text and current state of variables for restoration on "Undo"
		sc._('spell-hidden'+self._uniqueID).value = text;		
		self._undoPrevious = currentWord;
		self._previousWordMatches = wordMatches;
		self._previousMatchOffset = matchOffset;
		
		// Enable the "Undo" button
		sc._('spell-undo'+self._uniqueID).removeAttribute('disabled');
		self._canUndo = true;
						
		if (selected_option > -1) {
			new_word = select.options[selected_option].text; // Use suggestion if one is selected
		} else {
			new_word = sc._('spell-current'+self._uniqueID).value;
		}
				
		new_text = text.replace(regex, function(match) {
			m++;
			if (changeAll === true || matchOffset === m) {
				return new_word;
			}
			return match;
		});											
		
		// Only remove the replaced word if we won't need it again
		if (changeAll === true || wordMatches <= 1 || matchOffset === wordMatches) {
			keys.splice(0, 1);
			self._matchOffset = 1; // Reset to 1 in case there is another word to review			
			moreMatches = false; // No remaining duplicates of this word
		} else {
			moreMatches = true; // There are remaining duplicates of this word to review
		}
		
		self._textInput.value = new_text;
		self._text = new_text;			
		self._wordKeys = keys;
		
		if (keys.length > 0 || moreMatches === true) {
			self._reviewWord(false);
		} else {
			self._notifyMsg('finished');
		}
	},
	
	/**
	 * Undo the previous change action
	 */			
	_undoChange: function() {
		var self = this,
			previousWord = self._undoPrevious,
			previousWordMatches = self._previousWordMatches,
			previousMatchOffset = self._previousMatchOffset,
			backupTextarea = sc._('spell-hidden'+self._uniqueID),			
			previousText = backupTextarea.value;
		
		// Restore user text to pre-change state
		self._textInput.value = previousText;
		
		// Restore text data
		self._text = previousText;		
		
		// Return previous word to the "Not found in dictionary" field
		sc._('spell-current'+self._uniqueID).value = previousWord;
		
		// Restore currentWord to value prior to change
		self._currentWord = previousWord;

		// Add previous word back to beginning of array		
		self._wordKeys.unshift(previousWord); 
		
		// Restore variables to their value prior to change
		self._wordMatches = previousWordMatches;
		self._matchOffset = previousMatchOffset;
		
		// Prevent another undo
		self._canUndo = false;
		
		// Disable the "Undo" button
		sc._('spell-undo'+self._uniqueID).setAttribute('disabled', true);		
		
		// Empty the backup text area
		backupTextarea.value = '';
		
		// Populate suggestion box with options
		self._setSuggestionOptions();

		// Reset the word context box
		self._setContextBox();		
	},

	/**
	 * Populates the spelling suggestions select box with options
	 */				
	_setSuggestionOptions: function() {
		var self = this,
			wordObject = self._wordObject,
			word = self._currentWord,
			select_field = sc._('spelling-suggestions'+self._uniqueID),
			suggestions = wordObject[word],
			num = suggestions.length,
			i;			

			select_field.options.length = 0;			

			// Return if there are no suggestions
			if (num < 1) {
				return;
			}

			for (i = 0; i < num; i++) {
				select_field.options[i] = new Option(suggestions[i], suggestions[i]);				
			}

			select_field.selectedIndex = 0;
	},
	
	/**
	 * Places the misspelled word in the review box along with surrounding words for context
	 */			
	_setContextBox: function() {
		var self = this,
			currentWord = self._currentWord,
			wordLength = currentWord.length,
			matchOffset = self._matchOffset,
			text = self._text,		
			textLength = text.length,
			contextBox = sc._('spell-context'+self._uniqueID),
			regex = new RegExp(currentWord, 'g'),			
			newText,
			i=0;

		newText = text.replace(regex, function(match, index) {
				i++;

				if (i === matchOffset) {
					var firstHalf,
						secondHalf,
						startFirstHalf = index - 20,
						startSecondHalf = index + wordLength,
						result;

					if (startFirstHalf < 0) {
						firstHalf = text.substr(0, index);
					} else {
						firstHalf = text.substr(startFirstHalf, 20);
					}				

					if (startSecondHalf + 50 > textLength) {
						secondHalf = text.substr(startSecondHalf);
					} else {
						secondHalf = text.substr(startSecondHalf, 50);
					}
					
					result = firstHalf+'<span class="word-highlight">'+currentWord+'</span>'+secondHalf;
					
					if (index + wordLength + 2 < textLength) {
						// This prevents broken words from going into the sentence context box by 
						// trimming whitespace, trimming non-white space, then trimming white space again.					
						result = result.replace(/^\s+/, '')
										.replace( /\s+$/, '')
										.replace(/[^\s]+/, '')
										.replace( /[^\s]+$/, '')
										.replace(/^\s+/, '')
										.replace( /\s+$/, '');	
					}
									
					contextBox.innerHTML = result;
				}
				return match;
			});			
	},

	/**
	 * Begin resolving a potentially misspelled word
	 *
	 * Executes at beginning of spell check if the server reports spelling errors or 
	 * after resolving the last word and moving to the next.
	 */		
	_reviewWord: function(startNew) {	
		var self = this,
			keys = self._wordKeys, // Array of misspelled words that have not yet been resolved by changing or ignoring
			currentWord = keys[0], // The misspelled word currently being reviewed (always the first element of the keys array)
			regex = new RegExp(currentWord, 'g'); // Use a regular expression to find the misspelled word in the text
			
		self._currentWord = currentWord;
		sc._('spell-current'+self._uniqueID).value = currentWord;
				
		// Find how many occurrences of the misspelled word so each one is reviewed
		self._wordMatches = self._text.match(regex).length;
		
		if (startNew === false) {
			self._matchOffset = self._matchOffset;
		}
		else {
			self._matchOffset = 1;
		}

		self._setSuggestionOptions();
		self._setContextBox();	
	},
	
	/**
	 * Begins spell check process after data has been received from server
	 */		
	_begin: function(response) {
		var self = this,
			keys,
			backupCopy = sc._('spell-hidden'+self._uniqueID); // Hidden textarea for storing backup copy of current text
						
		if (response.success && response.success === true) {
			// Open the review box if there were spelling errors found
			if (response.errors && response.errors === true) {
				backupCopy.value = self._text; // Save a copy of the current text to restore on "Undo"
				self._canUndo = false;
				self._wordObject = response.words;
				keys = sc.objectKeys(self._wordObject);
				self._wordKeys = keys;
				self._showReviewer();
				self._reviewWord(true);
			} else {
				// No spelling errors were found
				self._notifyMsg('noerrors');
			}
		}
	},
	
	/**
	 * Handles successful XHR responses
	 */		
	_handleXHR: function(xhr) {		
		var self = this,
			response_text = sc.trim(xhr.responseText),
			json_obj = sc.evalJSON(response_text);
		
		if (json_obj !== false) {
			self._begin(json_obj);
		} else {
			self._notifyMsg('servererror');
		}
	},
	
	/**
	 * Sends text to the server for spell review
	 */		
	_sendData: function() {
		var self = this,
			url = self._serverURL,
			text = self._text,
			xhr = sc.newXHR(),
			data;
			
		// Don't waste a server request for less than 2 characters	
		if (text.length < 2) {
			self._notifyMsg('noerrors');
			return;
		}			
		
		data = self._settings.name + '='; 
		data += encodeURIComponent(text);
		data += '&';
		data += sc.obj2string(self._settings.data);
		
		xhr.onreadystatechange = function() {
				if (xhr.readyState === 4) {
					if (xhr.status === 200) {
						self._handleXHR(xhr);
					} else {
						self._notifyMsg('servererror');
					}
				}
			};
		
		xhr.open('POST', url, true);
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		xhr.send(data);				
	},
	
	/**
	 * Creates HTML for spell checker
	 */		
	_createHTML: function() {
		var self = this,
			overlay = document.createElement('div'),
			modal = document.createElement('div'),
			hidden = document.createElement('textarea');				
		
		document.body.appendChild(overlay);	
		overlay.setAttribute('id', 'spell-overlay'+self._uniqueID);
		overlay.className = 'spell-check-overlay';
		
		document.body.appendChild(modal);
		modal.setAttribute('id', 'spell-modal'+self._uniqueID);		
		modal.className = 'spell-wrap';
		modal.innerHTML = '<div class="spell-header">Spell Check</div><div id="spelling-inner'+self._uniqueID+'" class="spelling-inner"><div class="clearleft">Not found in dictionary:</div><div class="spell-nf"><input type="text" class="current" id="spell-current'+self._uniqueID+'" /><div class="context" contenteditable="true" id="spell-context'+self._uniqueID+'"></div></div><div class="spell-ignorebtns"><button id="spelling-ignore'+self._uniqueID+'" type="button">Ignore</button><button id="spelling-ignore-all'+self._uniqueID+'" type="button">Ignore All</button></div><div class="clearleft top5">Suggestions:</div><div class="spell-suggest"><select size="8" id="spelling-suggestions'+self._uniqueID+'"><option></option></select></div><div class="spell-changebtns"><button type="button" id="spell-change'+self._uniqueID+'">Change</button><button id="spell-change-all'+self._uniqueID+'">Change All</button><button type="button" id="spell-undo'+self._uniqueID+'">Undo</button></div><hr /><div class="close-box"><button type="button" id="spell-close'+self._uniqueID+'">Close</button></div></div><div id="spell-msg'+self._uniqueID+'" class="spell-msg"><div class="spell-msg-inner"><span id="spell-msg-text'+self._uniqueID+'"></span></div><div class="spell-msg-inner" id="spell-msg-close-box'+self._uniqueID+'"><button id="spell-msg-close'+self._uniqueID+'">OK</button></div></div>';
	
		hidden.setAttribute('id', 'spell-hidden'+self._uniqueID);
		hidden.style.display = 'none';
		document.body.appendChild(hidden);
	}
};
