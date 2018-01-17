define(['java', './Item'], function(java, Item) {
  
  'use strict';
  
  return java.defineInterface({
    name: 'javax.microedition.lcdui.ItemStateListener',
    instanceMembers: {
      itemStateChanged: new java.Signature([Item]),
    },
  });
  
});
