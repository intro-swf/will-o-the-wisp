define(['java', 'jlib.java.lang.Exception'], function(java, Exception) {
  
  'use strict';
  
  return java.define('javax.microedition.rms.RecordStoreException', {
    superclass: Exception,
    constructor: [
      [],
      ['string'],
      function RecordStoreException() {
        Exception.apply(this, arguments);
      },
    ],
  });
  
});
