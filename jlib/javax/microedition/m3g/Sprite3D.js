define(['java', './Node'], function(java, Node) {

  'use strict';
  
  return java.define('javax.microedition.m3g.Sprite3D', {
    base: Node,
    constructor: [
      'boolean', './Image2D', './Appearance',
      function Sprite3D(scaled, image, appearance) {
      },
    ],
    methods: {
      setAppearance: ['./Appearance', function setAppearance(appearance) {
      }],
      getAppearance: [{ret:'./Appearance'}, function getAppearance() {
      }],
      setImage: ['./Image2D', function setImage(image) {
      }],
      getImage: [{ret:'./Image2D'}, function getImage() {
      }],
      isScaled: [{ret:'boolean'}, function isScaled() {
      }],
      setCrop: [
        'i32', 'i32', 'i32', 'i32',
        function setCrop(x, y, width, height) {
        },
      ],
      getCropX: [{ret:'i32'}, function getCropX() {
      }],
      getCropY: [{ret:'i32'}, function getCropY() {
      }],
      getCropWidth: [{ret:'i32'}, function getCropWidth() {
      }],
      getCropHeight: [{ret:'i32'}, function getCropHeight() {
      }],
    },
  });

});
