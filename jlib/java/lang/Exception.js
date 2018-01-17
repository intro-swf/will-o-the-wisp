define(['java', './Throwable'], function(java, Throwable) {

  'use strict';

  function Exception() {
    Throwable.apply(this, arguments);
  }
  java.initClass(Exception, {
    superclass: Throwable,
  });
  
  return Exception;

});
