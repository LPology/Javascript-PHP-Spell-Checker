/**
 * Javascript/PHP Spell Checker
 * Version 1.5
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
  regexCache = {};

sc._ = function( elem ) {
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
    } catch ( err ) {
      return false;
    }
  } else {
    return false;
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

    currentBox = sc._( 'spell-current' + this._uId );
    contextBox = sc._( 'spell-context' + this._uId );

    // Add CSS class to button for pointer cursor when hovering
    this._button.className += ' spellcheck-trigger';

    this._button.off = sc.addEvent( this._button, 'click', function() {
      self._openChecker();
    });

    sc.addEvent( 'spelling-ignore' + this._uId, 'click', function() {
      self._ignoreChange();
    });

    sc.addEvent( 'spelling-ignore-all' + this._uId, 'click', function() {
      self._ignoreChange(true);
    });

    sc.addEvent( 'spell-change' + this._uId, 'click', function() {
      self._makeChange();
    });

    sc.addEvent( 'spell-change-all' + this._uId, 'click', function() {
      self._makeChange(true);
    });

    sc.addEvent( 'spell-close' + this._uId, 'click', function() {
      self._closeChecker();
    });

    sc.addEvent( 'spell-msg-close' + this._uId, 'click', function() {
      self._closeChecker();
    });

    sc.addEvent( 'spell-undo' + this._uId, 'click', function() {
      if ( !self._canUndo ) {
        return;
      }
      self._undoChange();
    });

    // Unselect any suggestion if user clicks either input so that word is
    // changed to correct spelling
    sc.addEvent( currentBox, 'click', function() {
      sc._( 'spelling-suggestions' + self._uId ).selectedIndex = -1;
    });

    sc.addEvent( contextBox, 'click', function() {
      sc._( 'spelling-suggestions' + self._uId ).selectedIndex = -1;
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

    // Remove all the HTML we created
    sc.remove( sc._( 'spell-msg' + this._uId ) );
    sc.remove( sc._( 'spell-modal' + this._uId ) );
    sc.remove( sc._( 'spell-overlay' + this._uId ) );
    sc.remove( sc._( 'spell-hidden' + this._uId ) );

    // Now burn it all down
    for ( var prop in this ) {
      if ( this.hasOwnProperty( prop ) ) {
        delete this.prop;
      }
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

    this._text = this._textInput.value;
    sc._( 'spell-undo' + this._uId ).disabled = true;
    sc._( 'spell-overlay' + this._uId ).style.display = 'block';
    sc._( 'spell-modal' + this._uId ).style.display = 'block';
    this._canUndo = false;
    this._isOpen = true;

    // Add listener for escape key to close checker
    sc.addEvent( document, 'keyup', this._closeOnEsc );
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
    sc._( 'spell-msg' + this._uId ).style.display = 'none';
    sc._( 'spell-modal' + this._uId ).style.cssText = 'z-index:4999; display:none;';
    sc._( 'spell-overlay' + this._uId ).style.display = 'none';
    sc._( 'spell-current' + this._uId ).value = '';
    sc._( 'spell-context' + this._uId ).innerHTML = '';
    sc._( 'spelling-suggestions' + this._uId ).options.length = 0;

    // Reset everything after finishing
    this._text = this._wordObject = this._wordKeys = this._currentWord = this._wordMatches = this._matchOffset = this._canUndo = this._undoPrevious = this._previousWordMatches = this._previousMatchOffset = this._isOpen = null;

    // Removes listener for escape key
    sc.removeEvent( document, 'keyup', this._closeOnEsc );

    this._settings.onClose.call( this, this._button, this._textInput.value );
  },

  /**
  * Opens the review box to resolve a word.
  */
  _showReviewer: function() {
    "use strict";

    sc._( 'spell-msg' + this._uId ).style.display = 'none';
    sc._( 'spell-modal' + this._uId ).style.zIndex = 5001;
  },

  /**
  * Provides user with status messages.
  */
  _notifyMsg: function( type ) {
    "use strict";

    var msg,
        closeBox = sc._( 'spell-msg-close-box' + this._uId );

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

    sc._( 'spell-modal' + this._uId ).style.zIndex = 4999;
    sc._( 'spell-msg-text' + this._uId ).innerHTML = msg;
    sc._( 'spell-msg' + this._uId ).style.display = 'block';

    // Focus on "OK" button if anything but "Checking..." message
    if ( type != 'a' ) {
      sc._( 'spell-msg-close' + this._uId ).focus();
    }
  },

  /**
  * Ignores the potentially misspelled word currently in review
  */
  _ignoreChange: function( ignoreAll ) {
    "use strict";

    var wordMatches = this._wordMatches,
        matchOffset = this._matchOffset,
        moreMatches;

    if ( ignoreAll === true ||
         wordMatches <= 1 ||
         matchOffset === wordMatches )
    {
      this._wordKeys.splice( 0, 1 );
      this._matchOffset = 1; // Reset to 1 in case there is another word to review
      moreMatches = false;
    } else {
      // Increment the match counter because we're using the same word next round
      // This prevents us from reviewing the same occurrence of this word
      this._matchOffset = matchOffset + 1;
      moreMatches = true; // There are remaining duplicates of this word to review
    }

    // Disable "Undo" in case the prior action was a change
    sc._( 'spell-undo' + this._uId ).disabled = true;
    this._canUndo = false;

    if ( this._wordKeys.length > 0 || moreMatches === true ) {
      // Continue editing if that wasn't the last word
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
        currentWord = this._currentWord,
        wordMatches = this._wordMatches,
        matchOffset = this._matchOffset,
        select = sc._( 'spelling-suggestions' + this._uId ),
        regex = this._getRegex( currentWord ),
        selected_option = select.selectedIndex,
        m = 0,
        new_word,
        new_text,
        moreMatches;

    // Save backup copy of text and current state of variables for restoration on "Undo"
    sc._( 'spell-hidden' + this._uId ).value = text;
    this._undoPrevious = currentWord;
    this._previousWordMatches = wordMatches;
    this._previousMatchOffset = matchOffset;

    // Enable the "Undo" button
    sc._( 'spell-undo' + this._uId ).disabled = false;
    this._canUndo = true;

    if ( selected_option > -1 ) {
      new_word = select.options[selected_option].text; // Use suggestion if one is selected
    } else {
      new_word = sc._( 'spell-current' + this._uId ).value;
    }

    new_text = text.replace( regex, function( match ) {
      m++;
      if ( changeAll === true || matchOffset === m ) {
        return new_word;
      }
      return match;
    } );

    // Only remove the replaced word if we won't need it again
    if ( changeAll === true ||
         wordMatches <= 1 ||
         matchOffset === wordMatches )
    {
      this._wordKeys.splice( 0, 1 );
      this._matchOffset = 1; // Reset to 1 in case there is another word to review
      moreMatches = false; // No remaining duplicates of this word
    } else {
      moreMatches = true; // There are remaining duplicates of this word to review
    }

    this._textInput.value = this._text = new_text;

    if ( this._wordKeys.length > 0 || moreMatches === true ) {
      this._reviewWord();
    } else {
      this._notifyMsg( 'd' );
    }
  },

  /**
  * Undo the previous change action
  */
  _undoChange: function() {
    "use strict";

    var previousWord = this._undoPrevious,
        backupTextarea = sc._( 'spell-hidden' + this._uId ),
        previousText = backupTextarea.value;

    // Restore user text to pre-change state
    this._textInput.value = previousText;

    // Restore text data
    this._text = previousText;

    // Return previous word to the "Not found in dictionary" field
    sc._( 'spell-current' + this._uId ).value = previousWord;

    // Restore currentWord to value prior to change
    this._currentWord = previousWord;

    // Add previous word back to beginning of array	if it was removed
    if ( !sc.contains( this._wordKeys, previousWord ) ) {
      this._wordKeys.unshift( previousWord );
    }

    // Restore variables to their value prior to change
    this._wordMatches = this._previousWordMatches;
    this._matchOffset = this._previousMatchOffset;

    // Prevent another undo
    this._canUndo = false;

    // Disable the "Undo" button
    sc._( 'spell-undo' + this._uId ).disabled = true;

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
    "use strict";

    var wordObject = this._wordObject,
        word = this._currentWord,
        select_field = sc._( 'spelling-suggestions' + this._uId ),
        suggestions = wordObject[word],
        num = suggestions.length,
        i;

    select_field.options.length = 0;

    // Return if there are no suggestions
    if ( num < 1 ) {
      return;
    }

    for ( i = 0; i < num; i++ ) {
      select_field.options[i] = new Option( suggestions[i], suggestions[i] );
    }

    select_field.selectedIndex = 0;
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
        contextBox = sc._( 'spell-context' + this._uId ),
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
    } );
  },

  /**
  * Begin resolving a potentially misspelled word
  *
  * Executes at beginning of spell check if the server reports spelling errors or
  * after resolving the last word and moving to the next.
  */
  _reviewWord: function() {
    "use strict";

    var currentWord = this._wordKeys[0]; // The misspelled word currently being reviewed (always the first element of the keys array)

    this._currentWord = currentWord;
    sc._( 'spell-current' + this._uId ).value = currentWord;

    // Find how many occurrences of the misspelled word so each one is reviewed
    this._wordMatches = this._getTotalWordMatches();
    this._setSuggestionOptions();
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

    // Only count matches where next character is NOT alphanumeric
    // Prevents false matches for substring of a word. Ex: 'pre' matching 'previous'
    this._text.replace( regex, function( match, index ) {
      if ( !rAlphaNum.test( text.substr( index + wordLength, 1 ) ) ) {
        matches++;
      }
      return match;
    } );
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
        // Save a copy of the current text to hidden textarea for restore on "Undo"
        sc._( 'spell-hidden' + this._uId ).value = this._text;
        this._canUndo = false;
        this._wordObject = response.words;
        this._wordKeys = sc.objectKeys( this._wordObject );
        this._matchOffset = 1;
        this._showReviewer();
        this._reviewWord();

      } else {
        // No spelling errors were found
        this._notifyMsg( 'c' );
      }
    }
  },

  /**
  * Handles successful XHR responses
  */
  _handleXHR: function( response ) {
    "use strict";

    var json = sc.parseJSON( response );

    if ( json !== false ) {
      this._begin( json );
    } else {
      this._notifyMsg( 'b' );
    }
  },

  /**
  * Sends text to the server for spell review
  */
  _sendData: function() {
    "use strict";

    var self = this,
        xhr = sc.newXHR(),
        data;

    if ( xhr === false ) {
      this._notifyMsg( 'b' );
      return;
    }

    // Don't waste a server request for less than 2 characters
    if ( this._text.length < 2 ) {
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

    xhr.onreadystatechange = function() {
        if ( this.readyState === 4 ) {
          if ( this.status >= 200 && this.status < 300 ) {
            self._settings.onOpen.call( self, self._button, self._text );
            self._handleXHR( this.responseText );
          } else {
            self._notifyMsg( 'b' );
          }
        }
      };

    xhr.open( 'POST', this._settings.action, true );
    xhr.setRequestHeader( 'Accept', 'application/json, text/javascript, */*; q=0.01' );
    xhr.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest' );
    xhr.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
    xhr.send( data );
    xhr = null;
  },

  /**
  * Creates HTML for spell checker
  */
  _createHTML: function() {
    var overlay = document.createElement( 'div' ),
        modal = document.createElement( 'div' ),
        msgBox = document.createElement( 'div' ),
        hidden = document.createElement( 'textarea' );

    document.body.appendChild( overlay );
    overlay.className = 'spell-check-overlay';
    overlay.id = 'spell-overlay' + this._uId;

    document.body.appendChild( modal );
    modal.className = 'spell-wrap';
    modal.id = 'spell-modal' + this._uId;
    modal.innerHTML = '<div class="spell-header">Spell Check</div><div id="spelling-inner' + this._uId + '" class="spelling-inner"><div class="clearleft">Not found in dictionary:</div><div class="spell-nf"><input type="text" class="current" id="spell-current' + this._uId + '" /><div class="context" contenteditable="true" id="spell-context' + this._uId + '"></div></div><div class="spell-ignorebtns"><button id="spelling-ignore' + this._uId + '" type="button">Ignore</button><button id="spelling-ignore-all' + this._uId + '" type="button">Ignore All</button></div><div class="clearleft">Suggestions:</div><div class="spell-suggest"><select size="8" id="spelling-suggestions' + this._uId + '"><option></option></select></div><div class="spell-changebtns"><button type="button" id="spell-change' + this._uId + '">Change</button><button id="spell-change-all' + this._uId + '">Change All</button><button type="button" id="spell-undo' + this._uId + '">Undo</button></div><hr /><div class="close-box"><button type="button" id="spell-close' + this._uId + '">Close</button></div></div>';

    document.body.appendChild( msgBox );
    msgBox.className = 'spell-msg';
    msgBox.id = 'spell-msg' + this._uId;
    msgBox.innerHTML = '<div class="spell-header">Spell Check</div><div class="spell-msg-inner"><span id="spell-msg-text' + this._uId + '"></span></div><div class="spell-msg-inner" id="spell-msg-close-box' + this._uId + '"><button id="spell-msg-close' + this._uId + '">OK</button></div>';

    document.body.appendChild( hidden );
    hidden.style.display = 'none';
    hidden.id = 'spell-hidden' + this._uId;
  }
};

// Expose to the global window object
window.sc = sc;

})( window, document );
