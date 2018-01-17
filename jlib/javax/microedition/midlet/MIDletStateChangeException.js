define(['java', 'jlib.java.lang.Exception'], function(java, Exception) {

  'use strict';
  
  return java.define('javax.microedition.midlet.MIDletStateChangeException', {
    superclass: Exception,
    constructor: [
      [],
      ['string'],
      function MIDletStateChangeException() {
        Exception.apply(this, arguments);
      },
    ],
  });

});
