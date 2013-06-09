/**
 * Javascript/PHP Spell Checker
 * Version 1.3.2
 * https://github.com/LPology/Javascript-PHP-Spell-Checker
 *
 * Copyright 2012-2013 LPology, LLC  
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

sc.contains = function(a, obj) {
  var i = a.length;
  while (i--) {
    if (a[i] === obj) {
      return true;
    }
  }
  return false;
};

sc.trim = function(text) {
  return text.toString().replace(/^\s+/, '').replace( /\s+$/, '');
};

sc.getId = (function() {
  var id = 0,
      time = new Date().getTime();
  return function(){
    return time + id++;
  };
})();

sc.addEvent = function(elem, type, fn) {
  if (typeof elem === 'string') {
    elem = document.getElementById(elem);
  }	
  if (elem.attachEvent) {
    elem.attachEvent('on'+type, fn);
  } else {
    elem.addEventListener(type, fn, false);
  }
};

sc.removeEvent = function(elem, type, fn) {
  if (typeof elem === 'string') {
    elem = document.getElementById(elem);
  }
  if (elem.attachEvent) {
    elem.detachEvent('on' + type, fn);
  } else {
    elem.removeEventListener(type, fn, false);
  }
};

sc.newXHR = function() {
  if (typeof(XMLHttpRequest) !== undefined) {
    return new window.XMLHttpRequest();
  } else if (window.ActiveXObject) {
    try {
      return new window.ActiveXObject('Microsoft.XMLHTTP');
    } catch (err) {
      return false;
    }
  }
};

sc.encodeHTML = function(str) {
  return str.replace(/[&<>"']/g, function($0) {
      return "&" + {"&":"amp", "<":"lt", ">":"gt", '"':"quot", "'":"#39"}[$0] + ";";
  });
};

/**
 * Parses a JSON string and returns a Javascript object
 * Parts borrowed from www.jquery.com
 */
 sc.parseJSON = function(data) {
  if (!data || typeof data !== 'string') {
    return false;
  }		
  data = sc.trim(data);	
  if (window.JSON && window.JSON.parse) {
    try {
      return window.JSON.parse(data);
    } catch (err) {
      return false;
    }
  }	
  if (data) {
    if (/^[\],:{}\s]*$/.test( data.replace(/\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g, "@" )
      .replace(/"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g, "]" )
      .replace(/(?:^|:|,)(?:\s*\[)+/g, "")) ) {  
      return ( new Function( "return " + data ) )();
    }
  }  
  return false;
};

/**
 * Accepts a jquery object, a string containing an element ID, or an element, 
 * verifies that it exists, and returns the element.
 * @param {Mixed} elem
 * @return {Element} 
 */
sc.verifyElem = function(elem) {
  if (typeof jQuery !== 'undefined' && elem instanceof jQuery) {
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
    action: '',       // URL of server script
    button: '',       // Button that opens spell checker
    textInput: '',    // Text input to spell check
    name: 'text',     // Parameter name of text sent to server
    data: {}          // Additional data to send to the server (optional)
  };
  
  sc.extendObj(this._settings, options);
  
  this._button = sc.verifyElem(this._settings.button);
  this._textInput = sc.verifyElem(this._settings.textInput);	
  
  if (this._button === false) {
    throw new Error("Invalid button. Make sure the element you're passing exists."); 
  }	
  if (this._textInput === false) {
    throw new Error("Invalid text field. Make sure the element you're passing exists."); 
  }	
  
  this._closeOnEsc = function(event) {
      if (event.keyCode === 27) {
        self._closeChecker();
      }
    };  
  
  this._serverURL = self._settings.action;
  this._text = null;
  this._wordObject = null;
  this._wordKeys = null;
  this._currentWord = null;
  this._wordMatches = null;
  this._matchOffset = null;
  this._canUndo = null;
  this._undoPrevious = null;
  this._previousWordMatches = null;
  this._previousMatchOffset = null;
  this._uniqueID = null;
  this._isOpen = null;
  this.enable();			
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
  
    self._button.className += ' spellcheck-trigger';
    
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
    if (this._isOpen === true) {
      return;
    }
    
    this._text = this._textInput.value;
    sc._('spell-undo'+this._uniqueID).setAttribute('disabled', true);		
    sc._('spell-overlay'+this._uniqueID).style.display = 'block';
    sc._('spell-modal'+this._uniqueID).style.display = 'block';	
    this._canUndo = false;		
    this._isOpen = true;        
                 
    // Add listener for escape key to close checker
    sc.addEvent(document, 'keyup', this._closeOnEsc);			
    this._notifyMsg('checking');
    
    // Send the text to the server
    this._sendData();		
  },
  
  /**
  * Closes the spell check box and cleans up.
  */			
  _closeChecker: function() {
    if (this._isOpen !== true) {
      return;
    }
    
    // Close all dialog boxes
    sc._('spell-msg'+this._uniqueID).style.display = 'none';
    sc._('spell-modal'+this._uniqueID).style.cssText = 'z-index:4999; display:none;';
    sc._('spell-overlay'+this._uniqueID).style.display = 'none';
    sc._('spell-current'+this._uniqueID).value = '';
    sc._('spell-context'+this._uniqueID).innerHTML = '';
    sc._('spelling-suggestions'+this._uniqueID).options.length = 0;
    
    // Reset everything after finishing		
    this._text = null;
    this._wordObject = null;
    this._wordKeys = null;
    this._currentWord = null;
    this._wordMatches = null;
    this._matchOffset = null;	
    this._canUndo = null;		
    this._undoPrevious = null;
    this._previousWordMatches = null;
    this._previousMatchOffset = null;		
    this._isOpen = null;
    
    // Removes listener for escape key
    sc.removeEvent(document, 'keyup', this._closeOnEsc);		
  },
  
  /**
  * Opens the review box to resolve a word.
  */			
  _showReviewer: function() {
    sc._('spell-msg'+this._uniqueID).style.display = 'none';		
    sc._('spell-modal'+this._uniqueID).style.zIndex = 5001;
  },
  
  /**
  * Provides user with status messages.
  */		
  _notifyMsg: function(type) {
    var msg,
        closeBox = sc._('spell-msg-close-box'+this._uniqueID);
    
    if (type == 'checking') {
      msg = 'Checking...';
      closeBox.style.display = 'none';
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
    
    sc._('spell-modal'+this._uniqueID).style.zIndex = 4999;
    sc._('spell-msg-text'+this._uniqueID).innerHTML = msg;
    sc._('spell-msg'+this._uniqueID).style.display = 'block';		
  },
  
  
  /**
  * Ignores the potentially misspelled word currently in review
  */		
  _ignoreChange: function(ignoreAll) {
    var wordMatches = this._wordMatches,
        matchOffset = this._matchOffset,
        moreMatches;
  
    if (ignoreAll === true || wordMatches <= 1 || matchOffset === wordMatches) {
      this._wordKeys.splice(0, 1);
      this._matchOffset = 1; // Reset to 1 in case there is another word to review	
      moreMatches = false;
    } else {
      // Increment the match counter because we're using the same word next round
      // This prevents us from reviewing the same occurrence of this word
      this._matchOffset = matchOffset + 1;
      moreMatches = true; // There are remaining duplicates of this word to review
    }
    
    // Disable "Undo" in case the prior action was a change
    sc._('spell-undo'+this._uniqueID).setAttribute('disabled', true);
    this._canUndo = false;
  
    if (this._wordKeys.length > 0 || moreMatches === true) {
      // Continue editing if that wasn't the last word			
      this._reviewWord();
    } else {
      this._notifyMsg('finished');
    }		
  },
  
  /**
  * Changes the misspelled word currently in review
  */				
  _makeChange: function(changeAll) {
    var text = this._text,
        currentWord = this._currentWord,
        wordMatches = this._wordMatches,
        matchOffset = this._matchOffset,
        select = sc._('spelling-suggestions'+this._uniqueID),
        selected_option = select.selectedIndex,
        regex = new RegExp(currentWord, 'g'),
        m = 0,
        new_word,
        new_text,
        moreMatches;
    
    // Save backup copy of text and current state of variables for restoration on "Undo"
    sc._('spell-hidden'+this._uniqueID).value = text;		
    this._undoPrevious = currentWord;
    this._previousWordMatches = wordMatches;
    this._previousMatchOffset = matchOffset;
    
    // Enable the "Undo" button
    sc._('spell-undo'+this._uniqueID).removeAttribute('disabled');
    this._canUndo = true;
            
    if (selected_option > -1) {
      new_word = select.options[selected_option].text; // Use suggestion if one is selected
    } else {
      new_word = sc._('spell-current'+this._uniqueID).value;
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
      this._wordKeys.splice(0, 1);
      this._matchOffset = 1; // Reset to 1 in case there is another word to review			
      moreMatches = false; // No remaining duplicates of this word
    } else {
      moreMatches = true; // There are remaining duplicates of this word to review
    }
    
    this._textInput.value = new_text;
    this._text = new_text;			
    
    if (this._wordKeys.length > 0 || moreMatches === true) {
      this._reviewWord();
    } else {
      this._notifyMsg('finished');
    }
  },
  
  /**
  * Undo the previous change action
  */			
  _undoChange: function() {
    var previousWord = this._undoPrevious,
        backupTextarea = sc._('spell-hidden'+this._uniqueID),			
        previousText = backupTextarea.value;
    
    // Restore user text to pre-change state
    this._textInput.value = previousText;
    
    // Restore text data
    this._text = previousText;		
    
    // Return previous word to the "Not found in dictionary" field
    sc._('spell-current'+this._uniqueID).value = previousWord;
    
    // Restore currentWord to value prior to change
    this._currentWord = previousWord;
  
    // Add previous word back to beginning of array	if it was removed	
    if (!sc.contains(this._wordKeys, previousWord)) {
      this._wordKeys.unshift(previousWord); 
    }
    
    // Restore variables to their value prior to change
    this._wordMatches = this._previousWordMatches;
    this._matchOffset = this._previousMatchOffset;
    
    // Prevent another undo
    this._canUndo = false;
    
    // Disable the "Undo" button
    sc._('spell-undo'+this._uniqueID).setAttribute('disabled', true);		
    
    // Empty the backup text area
    backupTextarea.value = '';
    
    // Populate suggestion box with options
    this._setSuggestionOptions();
  
    // Reset the word context box
    this._setContextBox();		
  },
  
  /**
  * Populates the spelling suggestions select box with options
  */				
  _setSuggestionOptions: function() {
    var wordObject = this._wordObject,
        word = this._currentWord,
        select_field = sc._('spelling-suggestions'+this._uniqueID),
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
        alphaNum = /^\w+$/,         
        i = 0;
  
    text.replace(regex, function(match, index) {
      // Prevents false matches for substring of a word. Ex: 'pre' matching 'previous'
      // Text is split by alphanumeric chars, so if the next char is alphanumeric, it's a false match
      if (alphaNum.test(text.substr(index + wordLength, 1))) {
        return match;
      }
      
      i++;
  
      if (i === matchOffset) {
        var firstHalf,
            secondHalf,
            startFirstHalf = index - 20,
            startSecondHalf = index + wordLength;
  
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
        
        // This prevents broken words from going into the sentence context box by 
        // trimming whitespace, trimming non-white space, then trimming white space again.					
        firstHalf = firstHalf.replace(/^\s+/, '')
                    .replace(/[^\s]+/, '')
                    .replace(/^\s+/, '');
                    
        secondHalf = secondHalf.replace(/\s+$/, '')
                    .replace(/[^\s]+$/, '')
                    .replace(/\s+$/, '');					
        
        contextBox.innerHTML = sc.encodeHTML(firstHalf)+'<span class="word-highlight">'+sc.encodeHTML(currentWord)+'</span>'+sc.encodeHTML(secondHalf);														
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
  _reviewWord: function() {	
    var currentWord = this._wordKeys[0]; // The misspelled word currently being reviewed (always the first element of the keys array)
        
    this._currentWord = currentWord;
    sc._('spell-current'+this._uniqueID).value = currentWord;
        
    // Find how many occurrences of the misspelled word so each one is reviewed
    this._wordMatches = this._getTotalWordMatches();		
    this._setSuggestionOptions();
    this._setContextBox();	
  },
  
  /**
  * Counts number of occurrences of the misspelled word so each will be reviewed
  */
  _getTotalWordMatches: function() {
    var self = this,
        regex = new RegExp(this._currentWord, 'g'),
        wordLength = this._currentWord.length,
        alphaNum = /^\w+$/,
        matches = 0;
    
    // Only count matches where next character is NOT alphanumeric
    // Prevents false matches for substring of a word. Ex: 'pre' matching 'previous'
    self._text.replace(regex, function(match, index) {
      if (!alphaNum.test(self._text.substr(index + wordLength, 1))) {
        matches++;
      } 
      return match;
    }); 
    return matches;
  },  
  
  /**
  * Begins spell check process after data has been received from server
  */		
  _begin: function(response) {    
    if (response.success && response.success === true) {
      // Open the review box if there were spelling errors found
      if (response.errors && response.errors === true) {
        sc._('spell-hidden'+this._uniqueID).value = this._text; // Save a copy of the current text to hidden textarea for restore on "Undo"
        this._canUndo = false;
        this._wordObject = response.words;
        this._wordKeys = sc.objectKeys(this._wordObject);
        this._matchOffset = 1;
        this._showReviewer();
        this._reviewWord();
      } else {
        // No spelling errors were found
        this._notifyMsg('noerrors');
      }
    }
  },
  
  /**
  * Handles successful XHR responses
  */		
  _handleXHR: function(xhr) {		
    var json_obj = sc.parseJSON( sc.trim(xhr.responseText) );
    
    if (json_obj !== false) {
      this._begin(json_obj);
    } else {
      this._notifyMsg('servererror');
    }
  },
  
  /**
  * Sends text to the server for spell review
  */		
  _sendData: function() {
    var self = this,
        xhr = sc.newXHR(),
        text = self._text,
        data;
        
    if (xhr === false) {
      self._notifyMsg('servererror');
      return;    
    }         
      
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
    
    xhr.open('POST', self._serverURL, true);
    xhr.setRequestHeader('Accept', 'application/json, text/javascript, */*; q=0.01');     
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');   
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
        msgBox = document.createElement('div'),
        hidden = document.createElement('textarea');				
    
    document.body.appendChild(overlay);	
    overlay.className = 'spell-check-overlay';    
    overlay.setAttribute('id', 'spell-overlay'+self._uniqueID);
    
    document.body.appendChild(modal);
    modal.className = 'spell-wrap';    
    modal.setAttribute('id', 'spell-modal'+self._uniqueID);		
    modal.innerHTML = '<div class="spell-header">Spell Check</div><div id="spelling-inner'+self._uniqueID+'" class="spelling-inner"><div class="clearleft">Not found in dictionary:</div><div class="spell-nf"><input type="text" class="current" id="spell-current'+self._uniqueID+'" /><div class="context" contenteditable="true" id="spell-context'+self._uniqueID+'"></div></div><div class="spell-ignorebtns"><button id="spelling-ignore'+self._uniqueID+'" type="button">Ignore</button><button id="spelling-ignore-all'+self._uniqueID+'" type="button">Ignore All</button></div><div class="clearleft top5">Suggestions:</div><div class="spell-suggest"><select size="8" id="spelling-suggestions'+self._uniqueID+'"><option></option></select></div><div class="spell-changebtns"><button type="button" id="spell-change'+self._uniqueID+'">Change</button><button id="spell-change-all'+self._uniqueID+'">Change All</button><button type="button" id="spell-undo'+self._uniqueID+'">Undo</button></div><hr /><div class="close-box"><button type="button" id="spell-close'+self._uniqueID+'">Close</button></div></div>';
    
    document.body.appendChild(msgBox);
    msgBox.className = 'spell-msg';    
    msgBox.setAttribute('id', 'spell-msg'+self._uniqueID);
    msgBox.innerHTML = '<div class="spell-header">Spell Check</div><div class="spell-msg-inner"><span id="spell-msg-text'+self._uniqueID+'"></span></div><div class="spell-msg-inner" id="spell-msg-close-box'+self._uniqueID+'"><button id="spell-msg-close'+self._uniqueID+'">OK</button></div>';
  
    document.body.appendChild(hidden);
    hidden.style.display = 'none';    
    hidden.setAttribute('id', 'spell-hidden'+self._uniqueID);
  }
};
