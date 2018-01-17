define(['java'], function(java) {

  'use strict';
  
  return java.defineClass(
    function AlertType() {
    },
    {
      name: 'javax.microedition.lcdui.AlertType',
      instanceMembers: {
        playSound: function(display) {
          throw new Error('NYI');
        },
      },
      staticMembers: {
        ALERT:
        CONIRMATION:
        ERROR:
        INFO:
        WARNING:
      },
    });

});
