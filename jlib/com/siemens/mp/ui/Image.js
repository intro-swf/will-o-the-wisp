define(['java'], function(java) {

  'use strict';
  
  return java.define('com.siemens.mp.ui.Image', {
    constructor: [
      [
        'i8[]',
        function Image(data) {
        },
      ],
      [
        'i8[]', 'i32', 'i32',
        function Image(data, width, height) {
        },
      ],
      [
        'i8[]', 'i32', 'i32', 'boolean',
        function Image(data, width, height, isTransparent) {
        },
      ],
      [
        './Image',
        function Image(copy) {
        },
      ],
      [
        'i32', 'i32',
        function Image(width, height) {
        },
      ],
      [
        'string', 'boolean',
        function Image(resourceName, doScale) {
        },
      ],
    ],
    methods: {
      getWidth: [{ret:'i32'}, function getWidth() {
      }],
      getHeight: [{ret:'i32'}, function getHeight() {
      }],
    },
    staticMethods: {
      getNativeImage: [
        {ret:'./Image'}, 'javax.microedition.lcdui.Image',
        function(image) {
        },
      ],
      createImageFromBitmap: [
        [
          {ret:'javax.microedition.lcdui.Image'},
          'i8[]', 'i8[]', 'i32', 'i32',
          function createImageFromBitmap(imageData, alpha, width, height) {
          },
        ],
        [
          {ret:'javax.microedition.lcdui.Image'},
          'i8[]', 'i32', 'i32',
          function createImageFromBitmap(imageData, width, height) {
          },
        ],
      ],
      createTransparentImageFromBitmap: [
        {ret:'javax.microedition.lcdui.Image'},
        'i8[]', 'i32', 'i32',
        function createImageFromBitmap(imageData, width, height) {
        },
      ],
      createImageWithoutScaling: [
        {ret:'javax.microedition.lcdui.Image'},
        'string',
        function createImageWithoutScaling(resourceName) {
        },
      ],
    },
  });

});
