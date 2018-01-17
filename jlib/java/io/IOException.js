define(['java', '../lang/Exception'], function(java, Exception) {

  'use strict';

  function IOException() {
    Exception.apply(this, arguments);
  }
  java.initClass(IOException, {
    superclass: Exception,
  });
  
  return IOException;

});
