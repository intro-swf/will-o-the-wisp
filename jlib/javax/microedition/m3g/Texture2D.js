define(['java', './Transformable'], function(java, Transformable) {

  'use strict';
  
  const FILTER_BASE_LEVEL = 208,
        FILTER_LINEAR = 209,
        FILTER_NEAREST = 210,
        FUNC_ADD = 224,
        FUNC_BLEND = 225,
        FUNC_DECAL = 226,
        FUNC_MODULATE = 227,
        FUNC_REPLACE = 228,
        WRAP_CLAMP = 240,
        WRAP_REPEAT = 241;
  
  return java.define('javax.microedition.m3g.Texture2D', {
    base: Transformable,
    constructor: ['./Image2D', function Texture2D(image) {
    }],
    methods: {
      setBlendColor: ['i32', function setBlendColor(rgb) {
      }],
      getBlendColor: [{ret:'i32'}, function getBlendColor() {
      }],
      setBlending: ['i32', function setBlending(mode) {
      }],
      getBlending: [{ret:'i32'}, function getBlending() {
      }],
      setImage: ['./Image2D', function setImage(image) {
      }],
      getImage: [{ret:'./Image2D'}, function getImage() {
      }],
      setFiltering: [
        'i32', 'i32',
        function setFiltering(levelFilter, imageFilter) {
        },
      ],
      getLevelFilter: [{ret:'i32'}, function getLevelFilter() {
      }],
      getImageFilter: [{ret:'i32'}, function getImageFilter() {
      }],
      setWrapping: [
        'i32', 'i32',
        function setWrapping(wrapS, wrapT) {
        },
      ],
      getWrappingS: [{ret:'i32'}, function getWrappingS() {
      }],
      getWrappingT: [{ret:'i32'}, function getWrappingT() {
      }],
    },
    constants: {
      FILTER_BASE_LEVEL: FILTER_BASE_LEVEL,
      FILTER_LINEAR: FILTER_LINEAR,
      FILTER_NEAREST: FILTER_NEAREST,
      FUNC_ADD: FUNC_ADD,
      FUNC_BLEND: FUNC_BLEND,
      FUNC_DECAL: FUNC_DECAL,
      FUNC_MODULATE: FUNC_MODULATE,
      FUNC_REPLACE: FUNC_REPLACE,
      WRAP_CLAMP: WRAP_CLAMP,
      WRAP_REPEAT: WRAP_REPEAT,
    },
  });

});
