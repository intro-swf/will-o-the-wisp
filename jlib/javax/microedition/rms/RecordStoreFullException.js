define(['java', './RecordStoreException'], function(java, RecordStoreException) {
  
  'use strict';
  
  return java.define('javax.microedition.rms.RecordStoreFullException', {
    superclass: RecordStoreException,
    constructor: [
      [],
      ['string'],
      function RecordStoreFullException() {
        RecordStoreException.apply(this, arguments);
      },
    ],
  });
  
});
