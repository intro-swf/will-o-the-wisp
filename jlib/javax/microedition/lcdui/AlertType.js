define(['java'], function(java) {

  'use strict';
  
  function AlertType() {
  }
  
  java.defineClass(AlertType, {
    name: 'javax.microedition.lcdui.AlertType',
    instanceMembers: {
      playSound: function(display) {
        throw new Error('NYI');
      },
    },
  });
  
  AlertType.staticMembers = {
    ALERT: new AlertType(),
    CONFIRMATION: new AlertType(),
    ERROR: new AlertType(),
    INFO: new AlertType(),
    WARNING: new AlertType(),
  };
  
  return AlertType;

});
