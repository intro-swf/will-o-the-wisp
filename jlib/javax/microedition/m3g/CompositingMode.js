define(['java', './Object3D'], function(java, Object3D) {

  'use strict';
  
  const ALPHA = 64,
        ALPHA_ADD = 65,
        MODULATE = 66,
        MODULATE_X2 = 67,
        REPLACE = 68;
  
  return java.define('javax.microedition.m3g.CompositingMode', {
    base: Object3D,
    constructor: [function CompositingMode() {
    }],
    methods: {
      getAlphaThreshold: [{ret:'f32'}, function getAlphaThreshold() {
      }],
      getBlending: [{ret:'i32'}, function getBlending() {
      }],
      getDepthOffsetFactor: [{ret:'f32'}, function getDepthOffsetFactor() {
      }],
      getDepthOffsetUnits: [{ret:'f32'}, function getDepthOffsetUnits() {
      }],
      isAlphaWriteEnabled: [{ret:'boolean'}, function isAlphaWriteEnabled() {
      }],
      isColorWriteEnabled: [{ret:'boolean'}, function isColorWriteEnabled() {
      }],
      isDepthTestEnabled: [{ret:'boolean'}, function isDepthTestEnabled() {
      }],
      isDepthWriteEnabled: [{ret:'boolean'}, function isDepthWriteEnabled() {
      }],
      setAlphaThreshold: ['f32', function setAlphaThreshold(threshold) {
      }],
      setAlphaWriteEnable: ['boolean', function setAlphaWriteEnable(enable) {
      }],
      setBlending: ['i32', function setBlending(mode) {
      }],
      setColorWriteEnable: ['boolean', function setColorWriteEnable(enable) {
      }],
      setDepthOffset: ['f32', 'f32', function setDepthOffset(factor, units) {
      }],
      setDepthTestEnable: ['boolean', function setDepthTestEnable(enable) {
      }],
      setDepthWriteEnable: ['boolean', function setDepthWriteEnable(enable) {
      }],
    },
    constants: {
      ALPHA:       ALPHA,
      ALPHA_ADD:   ALPHA_ADD,
      MODULATE:    MODULATE,
      MODULATE_X2: MODULATE_X2,
      REPLACE:     REPLACE,
    },
  });

});
