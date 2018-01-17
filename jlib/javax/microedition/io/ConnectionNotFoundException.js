define(['java', 'jlib.java.io.IOException', function(java, IOException) {
  
  'use strict';
  
  return java.define('javax.microedition.io.ConnectionNotFoundException', {
    superclass: IOException,
    constructor: [
      [],
      ['string'],
      function ConnectionNotFoundException() {
        IOException.apply(this, arguments);
      },
    ],
  });
  
});
