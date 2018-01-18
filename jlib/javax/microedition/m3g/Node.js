define(['java', './Transformable'], function(java, Transformable) {

  'use strict';
  
  const NONE = 144,
        ORIGIN = 145,
        X_AXIS = 146,
        Y_AXIS = 147,
        Z_AXIS = 148;
  
  return java.define('javax.microedition.m3g.Node', {
    methods: {
      align: ['./Node', function(referenceNode) {
      }],
      setAlignment: [
        './Node', 'i32', './Node', 'i32',
        function setAlignment(zRef, zTarget, yRef, yTarget) {
        },
      ],
      getAlignmentReference: [
        {ret:'./Node'}, 'i32',
        function getAlignmentReference(axis) {
        },
      ],
      getAlignmentTarget: [
        {ret:'i32'}, 'i32',
        function getAlignmentTarget(axis) {
        },
      ],
      setAlphaFactor: ['f32', function setAlphaFactor(factor) {
      }],
      getAlphaFactor: [{ret:'f32'}, function getAlphaFactor() {
      }],
      getParent: [{ret:'./Node'}, function getParent() {
      }],
      setScope: ['i32', function setScope(scope) {
      }],
      getScope: [{ret:'i32'}, function getScope() {
      }],
      getTransformTo: [
        {ret:'boolean'}, './Node', './Transform',
        function getTransformTo(target, out_transform) {
        },
      ],
      setPickingEnable: ['boolean', function setPickingEnable(enable) {
      }],
      isPickingEnabled: [{ret:'boolean'}, function isPickingEnabled() {
      }],
      setRenderingEnable: ['boolean', function setRenderingEnable(enable) {
      }],
      isRenderingEnabled: [{ret:'boolean'}, function isRenderingEnabled() {
      }],
    },
    constants: {
      NONE: NONE,
      ORIGIN: ORIGIN,
      X_AXIS: X_AXIS,
      Y_AXIS: Y_AXIS,
      Z_AXIS: Z_AXIS,
    },
  });

});
