define(['java'], function(java) {

  'use strict';

  return java.defineClass(
  
    function Displayable() {
    },
    
    {
      name: 'javax.microedition.lcdui.Displayable',
      instanceMembers: {
        addCommand: function(command) {
          throw new Error('NYI');
        },
        getHeight: function() {
          throw new Error('NYI');
        },
        getTicker: function() {
          throw new Error('NYI');
        },
        getTitle: function() {
          throw new Error('NYI');
        },
        getWidth: function() {
          throw new Error('NYI');
        },
        isShown: function() {
          throw new Error('NYI');
        },
        removeCommand: function(command) {
          throw new Error('NYI');
        },
        setCommandListener: function(commandListener) {
          throw new Error('NYI');
        },
        setTicker: function(ticker) {
          throw new Error('NYI');
        },
        setTitle: function(title) {
          throw new Error('NYI');
        },
        sizeChanged: function(width, height) {
          throw new Error('NYI');
        },
      },
    });

});
