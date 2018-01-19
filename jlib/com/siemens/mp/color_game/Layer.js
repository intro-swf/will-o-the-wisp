define(['java'], function(java) {

  'use strict';
  
  return java.define('com.siemens.mp.color_game.Layer', {
    constructor: [
      [
        {access:'protected'}, 'javax.microedition.lcdui.Image',
        function Layer(image) {
        },
      ],
      [
        {access:'protected'}, 'i32', 'i32',
        function Layer(width, height) {
        },
      ],
    ],
    methods: {
      copyAllLayerVariables: [
        {access:'protected'}, './Layer',
        function copyAllLayerVariables(fromLayer) {
        },
      ],
      paint: ['javax.microedition.lcdui.Image'],
      setPosition: ['i32', 'i32', function setPosition(x, y) {
      }],
      move: ['i32', 'i32', function move(offsetX, offsetY) {
      }],
      getX: [{ret:'i32'}, function getX() {
      }],
      getY: [{ret:'i32'}, function getY() {
      }],
      getWidth: [{ret:'i32'}, function getWidth() {
      }],
      getHeight: [{ret:'i32'}, function getHeight() {
      }],
      setLayerImage: [
        {access:'protected'}, 'javax.microedition.lcdui.Image',
        function wetLayerImage(image) {
        },
      ],
      getLayerImage: [
        {access:'protected', ret:'javax.microedition.lcdui.Image'},
        function getLayerImage() {
        },
      ],
      setVisible: ['boolean', function setVisible(visible) {
      }],
      isVisible: [{ret:'boolean'}, function isVisible() {
      }],
    },
  });

});
