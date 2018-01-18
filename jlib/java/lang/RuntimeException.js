define(['java', './Exception'], function(java, Exception) {
  
  'use strict';
  
  return java.define('java.lang.RuntimeException', {
    base: Exception,
    constructor: [
      [],
      ['string'],
      function RuntimeException() {
        Exception.apply(this, arguments);
      },
    ],
  });
  
});
