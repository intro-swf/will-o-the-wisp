define(['java'], function(java) {

  'use strict';
  
  function LayerManager() {
  }
  
  java.initClass(LayerManager, {
    name: 'javax.microedition.lcdui.game.LayerManager',
    instanceMembers: {
      append: function(layer) {
        throw new Error('NYI');
      },
      getLayerAt: function(index) {
        throw new Error('NYI');
      },
      getSize: function() {
        throw new Error('NYI');
      },
      insert: function(layer, index) {
        throw new Error('NYI');
      },
      paint: function(graphics, x, y) {
        throw new Error('NYI');
      },
      remove: function(layer) {
        throw new Error('NYI');
      },
      setViewWindow: function(x, y, width, height) {
        throw new Error('NYI');
      },
    },
  });
  
  return LayerManager;

});
