define(['java', './Object3D'], function(java, Object3D) {

  'use strict';
  
  const BORDER = 32,
        REPEAT = 33;
  
  return java.define('javax.microedition.m3g.Background', {
    base: Object3D,
    constructor: [function Background() {
    }],
    methods: {
      getColor: [{ret:'i32'}, function getColor() {
      }],
      getCropHeight: [{ret:'i32'}, function getCropHeight() {
      }],
      getCropWidth: [{ret:'i32'}, function getCropWidth() {
      }],
      getCropX: [{ret:'i32'}, function getCropX() {
      }],
      getCropY: [{ret:'i32'}, function getCropY() {
      }],
      getImage: [{ret:'./Image'}, function getImage() {
      }],
      getImageModeX: [{ret:'i32'}, function getImageModeX() {
      }],
      getImageModeY: [{ret:'i32'}, function getImageModeY() {
      }],
      isColorClearEnabled: [{ret:'boolean'}, function isColorClearEnabled() {
      }],
      isDepthClearEnabled: [{ret:'boolean'}, function isDepthClearEnabled() {
      }],
      setColor: ['i32', function setColor(argb) {
      }],
      setColorClearEnable: ['boolean', function setColorClearEnable(enable) {
      }],
      setCrop: ['i32','i32','i32','i32', function setCrop(x,y,w,h) {
      }],
      setDepthClearEnable: ['boolean', function setDepthClearEnable(enable) {
      }],
      setImage: ['./Image', function setImage(image) {
      }],
      setImageMode: ['i32','i32', function setImageMode(modeX, modeY) {
      }],
    },
    constants: {
      BORDER: BORDER,
      REPEAT: REPEAT,
    },
  });

});
