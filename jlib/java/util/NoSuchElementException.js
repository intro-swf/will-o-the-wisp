define(['java', '../lang/RuntimeException'], function(java, RuntimeException) {
  
  'use strict';
  
  return java.define('java.util.NoSuchElementException', {
    base: RuntimeException,
    constructor: [
      [],
      ['string'],
      function NoSuchElementException() {
        RuntimeException.apply(this, arguments);
      },
    ],
  });
  
});
