define(['java', './Command'], function(java, Command) {

  'use strict';
  
  return java.defineClass(
    function Alert(title, alertText, alertImage, alertType) {
      alertText = alertText || null;
      alertImage = alertImage || null;
      alertType = alertType || null;
      // ...
    },
    {
      name: 'javax.microedition.lcdui.Alert',
      instanceMembers: {
        addCommand: function(command) {
          throw new Error('NYI');
        },
        getDefaultTimeout: function() {
          throw new Error('NYI');
        },
        getImage: function() {
          throw new Error('NYI');
        },
        getIndicator: function() {
          throw new Error('NYI');
        },
        getString: function() {
          throw new Error('NYI');
        },
        getTimeout: function() {
          throw new Error('NYI');
        },
        getType: function() {
          throw new Error('NYI');
        },
        removeCommand: function(command) {
          throw new Error('NYI');
        },
        setCommandListener: function(commandListener) {
          throw new Error('NYI');
        },
        setImage: function(image) {
          throw new Error('NYI');
        },
        setIndicator: function(gauge) {
          throw new Error('NYI');
        },
        setString: function(string) {
          throw new Error('NYI');
        },
        setTimeout: function(milliseconds) {
          throw new Error('NYI');
        },
        setType: function(alertType) {
          throw new Error('NYI');
        },
      },
      staticMembers: {
        FOREVER: -2,
        DISMISS_COMMAND: new Command('', null, 4, 0),
      },
    });
});
