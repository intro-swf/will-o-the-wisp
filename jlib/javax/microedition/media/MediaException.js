define(['java', 'jlib.java.lang.Exception'], function(java, Exception) {

  'use strict';
  
  return java.define('javax.microedition.media.MediaException', {
    superclass: Exception,
    constructor: [
      [],
      ['string'],
      function MediaException() {
        Exception.apply(this, arguments);
      },
    ],
  });

});
