define(['java'], function(java) {

  'use strict';
  
  return java.define('com.siemens.mp.color_game.LayerManager', {
    constructor: [function LayerManager() {
    }],
    methods: {
      append: ['./Layer', function append(layer) {
      }],
      getLayerAt: [{ret:'./Layer'}, 'i32', function getLayerAt(i) {
      }],
      getSize: [{ret:'i32'}, function getSize() {
      }],
      insert: ['./Layer', 'i32', function insert(layer, i) {
      }],
      paint: [
        'javax.microedition.lcdui.Graphics', 'i32', 'i32',
        function paint(gfx, x, y) {
        },
      ],
      remove: ['./Layer', function remove(layer) {
      }],
      setViewWindow: [
        'i32', 'i32', 'i32', 'i32',
        function setViewWindow(x,y,width,height) {
        },
      ],
    },
  });

});
