define(['java', './RecordStoreException'], function(java, RecordStoreException) {
  
  'use strict';
  
  return java.define('javax.microedition.rms.InvalidRecordIDException', {
    superclass: RecordStoreException,
    constructor: [
      [],
      ['string'],
      function InvalidRecordIDException() {
        RecordStoreException.apply(this, arguments);
      },
    ],
  });
  
});
