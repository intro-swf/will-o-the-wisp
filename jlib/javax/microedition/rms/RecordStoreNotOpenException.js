define(['java', './RecordStoreException'], function(java, RecordStoreException) {
  
  'use strict';
  
  return java.define('javax.microedition.rms.RecordStoreNotFoundException', {
    superclass: RecordStoreException,
    constructor: [
      [],
      ['string'],
      function RecordStoreNotFoundException() {
        RecordStoreException.apply(this, arguments);
      },
    ],
  });
  
});
