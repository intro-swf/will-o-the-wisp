define(['java', './Object3D'], function(java, Object3D) {

  'use strict';
  
  const ALPHA = 96,
        LUMINANCE = 97,
        LUMINANCE_ALPHA = 98,
        RGB = 99,
        RGBA = 100;
  
  return java.define('javax.microedition.m3g.Image2D', {
    base: Object3D,
    constructor: [
      ['i32', 'i32', 'i32'],
      ['i32', 'i32', 'i32', 'i8[]'],
      ['i32', 'i32', 'i32', 'i8[]', 'i8[]'],
      function Image2D(format, width, height, image, palette) {
      },
      ['i32', 'object'],
      function Image2D(format, copyFrom) {
      },
    ],
    methods: {
      getFormat: [{ret:'i32'}, function getFormat() {
      }],
      getWidth: [{ret:'i32'}, function getWidth() {
      }],
      getHeight: [{ret:'i32'}, function getHeight() {
      }],
      isMutable: [{ret:'boolean'}, function isMutable() {
      }],
      set: [
        'i32', 'i32', 'i32', 'i32', 'i8[]',
        function set(x, y, width, height, bytes) {
        },
      ],
    },
    constants: {
      ALPHA           : ALPHA,
      LUMINANCE       : LUMINANCE,
      LUMINANCE_ALPHA : LUMINANCE_ALPHA,
      RGB             : RGB,
      RGBA            : RGBA,
    },
  });

});
