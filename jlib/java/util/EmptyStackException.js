define(['java', '../lang/RuntimeException'], function(java, RuntimeException) {
  
  'use strict';
  
  return java.define('java.util.EmptyStackException', {
    base: RuntimeException,
    constructor: [
      [],
      function EmptyStackException() {
        RuntimeException.apply(this);
      },
    ],
  });
  
});
