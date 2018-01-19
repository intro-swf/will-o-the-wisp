define(['java', 'Exception'], function(java, Exception) {
  
  'use strict';
  
  return java.define('com.siemens.mp.NotAllowedException', {
    base: Exception,
    constructor: [function NotAllowedException() {
      Exception.apply(this);
    }],
  });
  
});
