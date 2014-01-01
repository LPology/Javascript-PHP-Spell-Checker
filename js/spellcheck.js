/**
 * Javascript/PHP Spell Checker
 * Version 1.5.3
 * https://github.com/LPology/Javascript-PHP-Spell-Checker
 *
 * Copyright 2012-2013 LPology, LLC
 * Released under the MIT license
 */

;(function( window, document, undefined ) {

  var sc = window.sc || {},

  // Pre-compile and cache our regular expressions
  rLWhitespace = /^\s+/,
  rTWhitespace = /\s+$/,
  rLNonWhitespace = /[^\s]+/,
  rRNonWhitespace = /[^\s]+$/,

  // sc.getUID
  uidReplace = /[xy]/g,

  //sc.encodeHTML()
  rAmp = /&/g,
  rQuot = /"/g,
  rQuot2 = /'/g,
  rLt = /</g,
  rGt = />/g,

  rAlphaNum = /^\w+$/,

  // Holds cached regular expressions for _getRegex()
  regexCache = {},

  _ = function( elem ) {
    return document.getElementById( elem );
  };

/**
 * Accepts an object and returns an array of its property names
 */
sc.objectKeys = function( obj ) {
  "use strict";

  var keys = [];
  for ( var prop in obj ) {
    if ( obj.hasOwnProperty( prop ) ) {
      keys.push( prop );
    }
  }
  return keys;
};

/**
 * Converts object to query string
 */
sc.obj2string = function( obj, prefix ) {
  "use strict";

  var str = [];
  for ( var prop in obj ) {
    if ( obj.hasOwnProperty( prop ) ) {
      var k = prefix ? prefix + '[' + prop + ']' : prop, v = obj[prop];
      str.push( typeof v === 'object' ?
        sc.obj2string( v, k ) :
        encodeURIComponent( k ) + '=' + encodeURIComponent( v ) );
    }
  }
  return str.join( '&' );
};

/**
 * Copies all missing properties from second object to first object
 */
sc.extendObj = function( first, second ) {
  "use strict";

  for ( var prop in second ) {
    if ( second.hasOwnProperty( prop ) ) {
      first[prop] = second[prop];
    }
  }
};

/**
 * Returns true if an object has no properties of its own
 */
sc.isEmpty = function( obj ) {
  "use strict";

  for ( var prop in obj ) {
    if ( obj.hasOwnProperty( prop ) ) {
      return false;
    }
  }
  return true;
};

sc.contains = function( array, item ) {
  "use strict";

  var i = array.length;
  while ( i-- ) {
    if ( array[i] === item ) {
      return true;
    }
  }
  return false;
};

/**
* Nulls out event handlers to prevent memory leaks in IE6/IE7
* http://javascript.crockford.com/memory/leak.html
* @param {Element} d
* @return void
*/
sc.purge = function( d ) {
  "use strict";

  var a = d.attributes, i, l, n;
  if ( a ) {
    for ( i = a.length - 1; i >= 0; i -= 1 ) {
      n = a[i].name;
      if ( typeof d[n] === 'function' ) {
        d[n] = null;
      }
    }
  }
  a = d.childNodes;
  if ( a ) {
    l = a.length;
    for ( i = 0; i < l; i += 1 ) {
      sc.purge( d.childNodes[i] );
    }
  }
};

/**
* Removes element from the DOM
*/
sc.remove = function( elem ) {
  "use strict";

  if ( elem.parentNode ) {
    // null out event handlers for IE
    sc.purge( elem );
    elem.parentNode.removeChild( elem );
  }
  elem = null;
};

/**
* Removes whtie space from left and right of string
*/
sc.trim = function( text ) {
  "use strict";
  return text.toString().replace(rLWhitespace, '').replace(rTWhitespace, '');
};

/**
* Generates unique ID
* Complies with RFC 4122 version 4
* http://stackoverflow.com/a/2117523/1091949
*/
sc.getId = function() {
  "use strict";

  /*jslint bitwise: true*/
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(uidReplace, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
  });
};

sc.addEvent = function( elem, type, fn ) {
  "use strict";

  if ( typeof elem === 'string' ) {
    elem = document.getElementById( elem );
  }
  if ( elem.addEventListener ) {
    elem.addEventListener( type, fn, false );
  } else {
    elem.attachEvent( 'on' + type, fn );
  }

  return function() {
    sc.removeEvent( elem, type, fn );
  };
};

sc.removeEvent = function(elem, type, fn) {
  "use strict";

  if (typeof elem === 'string') {
    elem = document.getElementById( elem );
  }
 if ( elem.removeEventListener ) {
    elem.removeEventListener( type, fn, false );
  } else {
    elem.detachEvent( 'on' + type, fn );
  }
};

sc.newXHR = function() {
  "use strict";

  if ( typeof XMLHttpRequest !== 'undefined' ) {
    return new window.XMLHttpRequest();
  } else if ( window.ActiveXObject ) {
    try {
      return new window.ActiveXObject( 'Microsoft.XMLHTTP' );
    } catch ( e ) {
      return false;
    }
  }
};

sc.encodeHTML = function( str ) {
  "use strict";

  return String( str )
           .replace( rAmp, '&amp;' )
           .replace( rQuot, '&quot;' )
           .replace( rQuot2, '&#39;' )
           .replace( rLt, '&lt;' )
           .replace( rGt, '&gt;' );
};

/**
 * Parses a JSON string and returns a Javascript object
 * Parts borrowed from www.jquery.com
 */
sc.parseJSON = function( data ) {
   "use strict";

  if ( !data ) {
    return false;
  }
  data = sc.trim( data );
  if ( window.JSON && window.JSON.parse ) {
    try {
      return window.JSON.parse( data );
    } catch ( err ) {
      return false;
    }
  }
  if ( data ) {
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
sc.verifyElem = function( elem ) {
  "use strict";

  if ( typeof jQuery !== 'undefined' && elem instanceof jQuery ) {
    elem = elem[0];

  } else if ( typeof elem === 'string' ) {
    if ( elem.charAt( 0 ) == '#' ) {
      elem = elem.substr( 1 );
    }
    elem = document.getElementById( elem );
  }

  if ( !elem || elem.nodeType !== 1 ) {
    return false;
  }

  if ( elem.nodeName.toUpperCase() == 'A' ) {
    elem.style.cursor = 'pointer';
    sc.addEvent( elem, 'click', function( e ) {
        if ( e && e.preventDefault ) {
          e.preventDefault();
        } else if ( window.event ) {
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
sc.SpellChecker = function( options ) {

  var self = this;

  this._settings = {
    action: '',                             // URL of server script
    button: '',                             // Button that opens spell checker
    textInput: '',                          // Text input to spell check
    name: 'text',                           // Parameter name of text sent to server
    data: {},                               // Additional data to send to the server (optional)
    debug: false,
    onOpen: function( button, text ) {},    // Callback to be executed when spell checker is opened
    onClose: function( button, text ) {}    // Callback to be executed after spell checker is closed
  };

  sc.extendObj( this._settings, options );

  this._button = sc.verifyElem( this._settings.button );
  this._textInput = sc.verifyElem( this._settings.textInput );

  delete this._settings.button;

  if ( this._button === false ) {
    throw new Error( "Invalid button. Make sure the element you're passing exists." );
  }

  if ( this._textInput === false ) {
    throw new Error( "Invalid text field. Make sure the element you're passing exists." );
  }

  this._closeOnEsc = function( event ) {
      if ( event.keyCode === 27 ) {
        self._closeChecker();
      }
    };

  this.enable();
};

sc.SpellChecker.prototype = {

  enable: function() {
    "use strict";

    var self = this,
        currentBox,
        contextBox;

    this._isOpen = false;
    this._uId = sc.getId();
    this._createHTML();

    currentBox = _( 'spell-current' + this._uId );
    contextBox = _( 'spell-context' + this._uId );

    // Add CSS class to button for pointer cursor when hovering
    this._button.className += ' spellcheck-trigger';

    this._button.off = sc.addEvent( this._button, 'click', function() {
      self._openChecker();
    });

    sc.addEvent( 'spelling-ignore' + this._uId, 'click', function() {
      self._ignore();
    });

    sc.addEvent( 'spelling-ignore-all' + this._uId, 'click', function() {
      self._ignore( true );
    });

    sc.addEvent( 'spell-change' + this._uId, 'click', function() {
      self._makeChange();
    });

    sc.addEvent( 'spell-change-all' + this._uId, 'click', function() {
      self._makeChange( true );
    });

    sc.addEvent( 'spell-close' + this._uId, 'click', function() {
      self._closeChecker();
    });

    sc.addEvent( 'spell-msg-close' + this._uId, 'click', function() {
      self._closeChecker();
    });

    sc.addEvent( 'spell-undo' + this._uId, 'click', function() {
      self._undoChange();
    });

    // Unselect any suggestion if user clicks either input so that word is
    // changed to correct spelling
    sc.addEvent( currentBox, 'click', function() {
      _( 'spelling-suggestions' + self._uId ).selectedIndex = -1;
    });

    sc.addEvent( contextBox, 'click', function() {
      _( 'spelling-suggestions' + self._uId ).selectedIndex = -1;
    });

    // Change "Not found in dictionary" if user edits within word context box
    sc.addEvent( currentBox, 'keyup', function() {
      var span = contextBox.getElementsByTagName( 'span' )[0];
      if ( span && span.firstChild ) {
        span.firstChild.nodeValue = this.value;
      }
    });

    // Change word context also if user edits "Not found in dictionary" box
    sc.addEvent( contextBox, 'keyup', function() {
      var span = this.getElementsByTagName( 'span' )[0];
      if ( span && span.firstChild ) {
        currentBox.value = span.firstChild.nodeValue;
      }
    });
  },

  /**
  * Completely removes spell check functionality
  */
  destroy: function() {
    "use strict";

    // Close the checker if it's open
    if ( this._isOpen ) {
      this._closeChecker();
    }

    // Remove event listener from button
    if ( this._button.off ) {
      this._button.off();
    }

    // Remove .spellcheck-trigger CSS class from button
    this._button.className = this._button.className.replace( /(?:^|\s)spellcheck-trigger(?!\S)/ , '' );

    // Remove all of the HTML we created
    sc.remove( _( 'spell-msg' + this._uId ) );
    sc.remove( _( 'spell-modal' + this._uId ) );
    sc.remove( _( 'spell-overlay' + this._uId ) );

    // Now burn it all down
    for ( var prop in this ) {
      if ( this.hasOwnProperty( prop ) ) {
        delete this.prop;
      }
    }
  },

  /**
  * Send data to browser console if debug is set to true
  */
  log: function( str ) {
    "use strict";

    if ( this._settings.debug && window.console ) {
      console.log( '[spell checker] ' + str );
    }
  },

  _getRegex: function( word ) {
    "use strict";

    if ( !regexCache[word] ) {
      regexCache[word] = new RegExp( word, 'g' );
    }
    return regexCache[word];
  },

  /**
  * Begins the spell check function.
  */
  _openChecker: function() {
    "use strict";

    if ( this._isOpen ) {
      return;
    }

    _( 'spell-undo' + this._uId ).disabled = true;
    _( 'spell-overlay' + this._uId ).style.display = 'block';
    _( 'spell-modal' + this._uId ).style.display = 'block';

    // Get the text that we're going to spell check
    this._text = this._textInput.value;
    this._isOpen = true;

    // Array of objects containing change history for "Undo"
    this._undo = [];

    // Add listener for escape key to close checker
    sc.addEvent( document, 'keyup', this._closeOnEsc );

    // Show "Checking..." message
    this._notifyMsg( 'a' );

    // Send the text to the server
    this._sendData();
  },

  /**
  * Closes the spell check box and cleans up.
  */
  _closeChecker: function() {
    "use strict";

    if ( !this._isOpen ) {
      return;
    }

    // Close all dialog boxes
    _( 'spell-msg' + this._uId ).style.display = 'none';
    _( 'spell-modal' + this._uId ).style.cssText = 'z-index:4999; display:none;';
    _( 'spell-overlay' + this._uId ).style.display = 'none';
    _( 'spell-current' + this._uId ).value = '';
    _( 'spell-context' + this._uId ).innerHTML = '';
    _( 'spelling-suggestions' + this._uId ).options.length = 0;

    // Reset everything after finishing
    this._text = this._wordObject = this._wordKeys = this._currentWord = this._wordMatches = this._matchOffset = this._undo = this._isOpen = null;

    // Removes listener for escape key
    sc.removeEvent( document, 'keyup', this._closeOnEsc );

    this._settings.onClose.call( this, this._button, this._textInput.value );
  },

  /**
  * Provides user with status messages.
  */
  _notifyMsg: function( type ) {
    "use strict";

    var msg,
        closeBox = _( 'spell-msg-close-box' + this._uId );

    if ( type == 'a' ) {
      msg = 'Checking...';
      closeBox.style.display = 'none';
    } else {
      closeBox.style.display = 'block';
    }

    if ( type == 'b' ) {
      msg = 'We experienced an error and were unable to complete the spell check.';
    }

    if ( type == 'c' ) {
      msg = 'Spell check completed. No errors found.';
    }

    if ( type == 'd' ) {
      msg = 'Spell check completed';
    }

    // Put the spell check box behind the message box
    _( 'spell-modal' + this._uId ).style.zIndex = 4999;

    // Inject the correct message
    _( 'spell-msg-text' + this._uId ).innerHTML = msg;

    // Make the message box visible
    _( 'spell-msg' + this._uId ).style.display = 'block';

    // Focus on "OK" button if anything but "Checking..." message
    if ( type != 'a' ) {
      _( 'spell-msg-close' + this._uId ).focus();
    }
  },

  /**
  * Ignores the potentially misspelled word currently in review
  */
  _ignore: function( ignoreAll ) {
    "use strict";

    var moreMatches;

    if ( ignoreAll === true ||
         this._wordMatches <= 1 ||
         this._matchOffset === this._wordMatches )
    {
      this._wordKeys.splice( 0, 1 );
      this._matchOffset = 1; // Reset to 1 in case there is another word to review
      moreMatches = false;
    } else {
      // Increment the match counter because we're using the same word next round
      // This prevents us from reviewing the same occurrence of this word
      this._matchOffset++;
      moreMatches = true; // There are remaining duplicates of this word to review
    }

    // Disable "Undo" in case the prior action was a change
    _( 'spell-undo' + this._uId ).disabled = true;
    
    // Empty the change history array to help keep it under control
    // Apparently this is the fasted method: http://jsperf.com/array-destroy/32
    while ( this._undo.length > 0 ) {
      this._undo.pop();
    }

    if ( this._wordKeys.length > 0 || moreMatches === true ) {
      // Continue working if that wasn't the last word
      this._reviewWord();
    } else {
      this._notifyMsg( 'd' );
    }
  },

  /**
  * Changes the misspelled word currently in review
  */
  _makeChange: function( changeAll ) {
    "use strict";

    var text = this._text,
        wordMatches = this._wordMatches,
        matchOffset = this._matchOffset,
        select = _( 'spelling-suggestions' + this._uId ),
        regex = this._getRegex( this._currentWord ),
        selected_option = select.selectedIndex,
        m = 0,
        new_word,
        new_text,
        moreMatches;

    // Save the current state before we change anything
    this._undo.unshift({
      text: text,
      word: this._currentWord,
      numMatches: this._wordMatches,
      matchOffset: this._matchOffset
    });

    // Enable the "Undo" button
    _( 'spell-undo' + this._uId ).disabled = false;

    if ( selected_option > -1 ) {
      new_word = select.options[selected_option].text; // Use suggestion if one is selected
    } else {
      new_word = _( 'spell-current' + this._uId ).value;
    }

    // Replace misspelled word with new word
    new_text = text.replace( regex, function( match ) {
      m++;

      // Replace if we've landed on the right occurrence or it's "Change All"
      if ( changeAll === true || matchOffset === m ) {
        return new_word;
      }

      // Otherwise don't change this occurrence
      return match;
    });

    // Only remove the replaced word if we won't need it again
    if ( changeAll === true ||
         wordMatches <= 1 ||
         matchOffset === wordMatches )
    {
      // Remove word from our list b/c we're finished with it
      this._wordKeys.splice( 0, 1 );

      // Reset to 1 in case there is another word to review
      this._matchOffset = 1;

      // No remaining duplicates of this word
      moreMatches = false;

    // There are remaining duplicates of this word to review
    } else {
      moreMatches = true;
    }

    // Update text with new version
    this._textInput.value = this._text = new_text;

    // Keep going if there are more words to review
    if ( this._wordKeys.length > 0 || moreMatches === true ) {
      this._reviewWord();

    // Otherwise do "Spell check completed"
    } else {
      this._notifyMsg( 'd' );
    }
  },

  /**
  * Undo the previous change action
  */
  _undoChange: function() {
    "use strict";

    var prevData = this._undo[0];

    // Restore text to pre-change state
    this._textInput.value = this._text = prevData.text;

    // Return previous word to the "Not found in dictionary" field
    _( 'spell-current' + this._uId ).value = prevData.word;

    // Add previous word back to beginning of array	if it was removed
    if ( !sc.contains( this._wordKeys, prevData.word ) ) {
      this._wordKeys.unshift( prevData.word );
    }

    // Restore variables to their value prior to change
    this._currentWord = prevData.word;
    this._wordMatches = prevData.numMatches;
    this._matchOffset = prevData.matchOffset;

    // Populate suggestion box with options
    this._setSuggestionOptions();

    // Reset the word context box
    this._setContextBox();

    // Remove from change history array
    this._undo.splice( 0, 1 );

    // Disable "Undo" button if no more changes to undo
    if ( this._undo.length < 1 ) {
      _( 'spell-undo' + this._uId ).disabled = true;
    }
  },

  /**
  * Populates the spelling suggestions select box with options
  */
  _setSuggestionOptions: function() {
    "use strict";

    var select = _( 'spelling-suggestions' + this._uId ),
        suggestions = this._wordObject[this._currentWord],
        num = suggestions.length,
        i;

    // Clear out any existing options
    select.options.length = 0;

    // Return if there are no suggestions
    if ( num < 1 ) {
      return;
    }

    for ( i = 0; i < num; i++ ) {
      select.options[i] = new Option( suggestions[i], suggestions[i] );
    }

    // Select the first suggestion option
    select.selectedIndex = 0;
  },

  /**
  * Places the misspelled word in the review box along with surrounding words for context
  */
  _setContextBox: function() {
    "use strict";

    var currentWord = this._currentWord,
        wordLength = currentWord.length,
        matchOffset = this._matchOffset,
        regex = this._getRegex( currentWord ),
        text = this._text,
        textLength = text.length,
        contextBox = _( 'spell-context' + this._uId ),
        i = 0;

    text.replace( regex, function( match, index ) {
      // Prevents false matches for substring of a word. Ex: 'pre' matching 'previous'
      // Text is split by alphanumeric chars, so if the next char is alphanumeric, it's a false match
      if ( rAlphaNum.test( text.substr( index + wordLength, 1 ) ) ) {
        return match;
      }

      i++;

      if ( i === matchOffset ) {
        var firstHalf,
            secondHalf,
            startFirstHalf = index - 20,
            startSecondHalf = index + wordLength;

        if ( startFirstHalf < 0 ) {
          firstHalf = text.substr( 0, index );
        } else {
          firstHalf = text.substr( startFirstHalf, 20 );
        }

        if ( startSecondHalf + 50 > textLength ) {
          secondHalf = text.substr( startSecondHalf );
        } else {
          secondHalf = text.substr( startSecondHalf, 50 );
        }

        // This prevents broken words from going into the sentence context box by
        // trimming whitespace, trimming non-white space, then trimming white space again.
        firstHalf = firstHalf.replace( rLWhitespace, '' )
                          .replace( rLNonWhitespace, '' )
                          .replace( rLWhitespace, '' );

        secondHalf = secondHalf.replace( rTWhitespace, '' )
                          .replace( rRNonWhitespace, '' )
                          .replace( rTWhitespace, '' );

        contextBox.innerHTML = sc.encodeHTML( firstHalf ) +
            '<span class="word-highlight">' +
            sc.encodeHTML( currentWord ) +
            '</span>' +
            sc.encodeHTML( secondHalf );
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
    "use strict";

    // The misspelled word currently being reviewed
    // (always the first element of the keys array)
    this._currentWord = this._wordKeys[0];

    _( 'spell-current' + this._uId ).value = this._currentWord;

    // Find how many occurrences of the misspelled word so each one is reviewed
    this._wordMatches = this._getTotalWordMatches();

    // Populate select field with spelling suggestion options
    this._setSuggestionOptions();

    // Place misspelled word in review box with leading and trailing words for context
    this._setContextBox();
  },

  /**
  * Counts number of occurrences of the misspelled word so each will be reviewed
  */
  _getTotalWordMatches: function() {
    "use strict";

    var regex = this._getRegex( this._currentWord ),
        wordLength = this._currentWord.length,
        matches = 0,
        text = this._text;

    // Search through text for each occurrence of the misspelled word
    // Only count matches where next character is NOT alphanumeric
    // Prevents false matches for substring of a word. Ex: 'pre' matching 'previous'
    this._text.replace( regex, function( match, index ) {
      if ( !rAlphaNum.test( text.substr( index + wordLength, 1 ) ) ) {
        matches++;
      }
      return match;
    });

    return matches;
  },

  /**
  * Begins spell check process after data has been received from server
  */
  _begin: function( response ) {
    "use strict";

    if ( response.success && response.success === true ) {

      // Open the review box if there were spelling errors found
      if ( response.errors && response.errors === true ) {
        this._wordObject = response.words;
        this._wordKeys = sc.objectKeys( this._wordObject );
        this._matchOffset = 1;

        _( 'spell-msg' + this._uId ).style.display = 'none';
        _( 'spell-modal' + this._uId ).style.zIndex = 5001;
        this._reviewWord();

      // Otherwise do "Spell check completed. No errors found." message
      } else {
        this._notifyMsg( 'c' );
      }
    }
  },

  /**
  * Sends text to the server for spell review
  */
  _sendData: function() {
    "use strict";

    var self = this,
        xhr = sc.newXHR(),
        data,
        callback;

    // Don't waste a server request for less than 2 characters
    if ( this._text.length < 2 ) {
    // Do "Spell check completed. No errors found" message
      this._notifyMsg( 'c' );
      return;
    }

    data = encodeURIComponent( this._settings.name ) + '=';
    data += encodeURIComponent( this._text );

    // Add any additional data
    if ( !sc.isEmpty( this._settings.data ) ) {
      data += '&';
      data += sc.obj2string( this._settings.data );
    }

    callback = function() {
      var response,
          status,
          statusText;

      try {
        if ( callback && xhr.readyState === 4 ) {
          callback = undefined;
          xhr.onreadystatechange = function() {};

          // Only continue if the spell checker is open. This way, closing the checker
          // before the request is completed effectively aborts the request
          if ( !self._isOpen ) {
            return;
          }

          status = xhr.status;

          try {
            statusText = xhr.statusText;
          } catch( e ) {
            statusText = '';
          }

          self.log( 'Request completed. Status: ' + status + ' ' + statusText );

          if ( status >= 200 && status < 300 ) {
            response = sc.parseJSON( xhr.responseText );

            if ( response !== false ) {
              self._settings.onOpen.call( self, self._button, self._text );
              self._begin( response );

              // There was an error parsing the server response
            } else {
              self.log( 'Error parsing server response' );
              self._notifyMsg( 'b' );
            }

            xhr = response = null;

            // We didn't get a 2xx status
          } else {
            self._notifyMsg( 'b' );
          }

        }

      } catch( e ) {
        self.log( 'Error: ' + e.message );
        self._notifyMsg( 'b' );
      }
    };

    xhr.onreadystatechange = callback;
    xhr.open( 'POST', this._settings.action, true );
    xhr.setRequestHeader( 'Accept', 'application/json, text/javascript, */*; q=0.01' );
    xhr.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest' );
    xhr.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
    self.log( 'Sending data...' );
    xhr.send( data );
  },

  /**
  * Creates HTML for spell checker
  */
  _createHTML: function() {
    var overlay = document.createElement( 'div' ),
        modal = document.createElement( 'div' ),
        msgBox = document.createElement( 'div' );

    // Screen overlay
    document.body.appendChild( overlay );
    overlay.className = 'spell-check-overlay';
    overlay.id = 'spell-overlay' + this._uId;

    // Spell check box
    document.body.appendChild( modal );
    modal.className = 'spell-wrap';
    modal.id = 'spell-modal' + this._uId;
    modal.innerHTML = '<div class="spell-header">Spell Check</div><div id="spelling-inner' + this._uId + '" class="spelling-inner"><div class="clearleft">Not found in dictionary:</div><div class="spell-nf"><input type="text" class="current" id="spell-current' + this._uId + '" /><div class="context" contenteditable="true" id="spell-context' + this._uId + '"></div></div><div class="spell-ignorebtns"><button id="spelling-ignore' + this._uId + '" type="button">Ignore</button><button id="spelling-ignore-all' + this._uId + '" type="button">Ignore All</button></div><div class="clearleft">Suggestions:</div><div class="spell-suggest"><select size="8" id="spelling-suggestions' + this._uId + '"><option></option></select></div><div class="spell-changebtns"><button type="button" id="spell-change' + this._uId + '">Change</button><button id="spell-change-all' + this._uId + '">Change All</button><button type="button" id="spell-undo' + this._uId + '">Undo</button></div><hr /><div class="close-box"><button type="button" id="spell-close' + this._uId + '">Close</button></div></div>';

    // Popup message box
    document.body.appendChild( msgBox );
    msgBox.className = 'spell-msg';
    msgBox.id = 'spell-msg' + this._uId;
    msgBox.innerHTML = '<div class="spell-header">Spell Check</div><div class="spell-msg-inner"><span id="spell-msg-text' + this._uId + '"></span></div><div class="spell-msg-inner" id="spell-msg-close-box' + this._uId + '"><button id="spell-msg-close' + this._uId + '">OK</button></div>';
  }
};

// Expose to the global window object
window.sc = sc;

})( window, document );