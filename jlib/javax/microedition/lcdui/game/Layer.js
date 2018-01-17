define(['java'], function(java) {

  'use strict';
  
  function Layer() {
  }
  
  java.initClass(Layer, {
    name: 'javax.microedition.lcdui.game.Layer',
    instanceMembers: {
      getHeight: function() {
        throw new Error('NYI');
      },
      getWidth: function() {
        throw new Error('NYI');
      },
      getX: function() {
        throw new Error('NYI');
      },
      getY: function() {
        throw new Error('NYI');
      },
      isVisible: function() {
        throw new Error('NYI');
      },
      move: function(dx, dy) {
        throw new Error('NYI');
      },
      paint: function(graphics) {
        throw new Error('NYI');
      },
      setPosition: function(x, y) {
        throw new Error('NYI');
      },
      setVisible: function(visible) {
        throw new Error('NYI');
      },
    },
  });
  
  return Layer;

});
