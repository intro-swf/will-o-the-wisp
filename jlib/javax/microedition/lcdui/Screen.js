define(['java', './Displayable'], function(java, Displayable) {

  'use strict';
  
  return java.define('javax.microedition.lcdui.Screen', {
    superclass: Displayable,
  });

});
