define(['java'], function(java) {

  'use strict';
  
  return java.define('com.siemens.mp.ui.Image', {
    constructor: [
      [
        {blocking:true}, 'i8[]',
        function Image(data) {
        },
      ],
      [
        {blocking:true}, 'i8[]', 'i32', 'i32',
        function Image(data, width, height) {
        },
      ],
      [
        {blocking:true}, 'i8[]', 'i32', 'i32', 'boolean',
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
        {blocking:true}, 'string', 'boolean',
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
          {blocking:true, ret:'javax.microedition.lcdui.Image'},
          'i8[]', 'i8[]', 'i32', 'i32',
          function createImageFromBitmap(imageData, alpha, width, height) {
          },
        ],
        [
          {blocking:true, ret:'javax.microedition.lcdui.Image'},
          'i8[]', 'i32', 'i32',
          function createImageFromBitmap(imageData, width, height) {
          },
        ],
      ],
      createTransparentImageFromBitmap: [
        {blocking:true, ret:'javax.microedition.lcdui.Image'},
        'i8[]', 'i32', 'i32',
        function createImageFromBitmap(imageData, width, height) {
        },
      ],
      createImageWithoutScaling: [
        {blocking:true, ret:'javax.microedition.lcdui.Image'},
        'string',
        function createImageWithoutScaling(resourceName) {
        },
      ],
    },
  });

});
