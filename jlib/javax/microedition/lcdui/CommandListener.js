define(['java', './Command', './Displayable'], function(java, Command, Displayable) {

  'use strict';
  
  return java.defineInterface({
    name: 'javax.microedition.lcdui.CommandListener',
    instanceMembers: {
      commandAction: new java.Signature([Command, Displayable]),
    },
  });

});
