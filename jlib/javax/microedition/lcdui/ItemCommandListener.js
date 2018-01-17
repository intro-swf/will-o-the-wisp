define(['java', './Command', './Item'], function(java, Command, Item) {

  'use strict';
  
  return java.defineInterface({
    name: 'javax.microedition.lcdui.ItemCommandListener',
    instanceMembers: {
      commandAction: new java.Signature([Command, Item]),
    },
  });

});
