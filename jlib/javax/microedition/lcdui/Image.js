define(['java'], function(java) {
  
  'use strict';

  return java.define('javax.microedition.lcdui.Image', {
    final: true, // no accessible constructor
    staticMethods: {
      createImage: [
        [
          {ret:'./Image'}, 'i32', 'i32',
          function createImage(width, height) {
            // the only way to create a mutable image
          },
        ],
        [
          {ret:'./Image'}, './Image',
          function createImage(copy) {
          },
        ],
        [
          './Image', 'i32', 'i32', 'i32', 'i32', 'i32',
          function createImage(copy, x,y,width,height, transform) {
          },
        ],
        [
          {blocking:true}, 'i8[]', 'i32', 'i32',
          function createImage(bytes, offset, length) {
          },
        ],
        [
          {blocking:true}, 'java.io.InputStream',
          function createImage(inputStream) {
          },
        ],
        [
          {blocking:true}, 'string',
          function createImage(resourceName) {
          },
        ],
      ],
      createRGBImage: [
        {ret:'./Image'}, 'i32[]', 'i32', 'i32', 'boolean',
        function(argbArray, width, height, processAlpha) {
        },
      ],
    },
    methods: {
      getGraphics: [{ret:'./Graphics'}, function getGraphics() {
      }],
      getWidth: [{ret:'i32'}, function getWidth() {
      }],
      getHeight: [{ret:'i32'}, function getHeight() {
      }],
      isMutable: [{ret:'boolean'}, function isMutable() {
      }],
      getRGB: [
        {blocking:true}, 'i32[]', 'i32', 'i32', 'i32', 'i32', 'i32', 'i32',
        function getRGB(out_argbArray, offset, scanLength, x,y, width,height) {
        },
      }],
    },
  });

});
