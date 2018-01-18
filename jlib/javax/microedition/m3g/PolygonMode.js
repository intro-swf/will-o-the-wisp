define(['java', './Object3D'], function(java, Object3D) {

  'use strict';

  const CULL_BACK = 160,
        CULL_FRONT = 161,
        CULL_NONE = 162,
        SHADE_FLAT = 164,
        SHADE_SMOOTH = 165,
        WINDING_CCW = 168,
        WINDING_CW = 169;

  return java.define('javax.microedition.m3g.PolygonMode', {
    base: Object3D,
    constructor: [function PolygonMode() {
    }],
    methods: {
      getCulling: [{ret:'i32'}, function getCulling() {
      }],
      getShading: [{ret:'i32'}, function getShading() {
      }],
      getWinding: [{ret:'i32'}, function getWinding() {
      }],
      isLocalCameraLightingEnabled: [
        {ret:'boolean'},
        function isLocalCameraLightingEnabled() {
        },
      ],
      isPerspectiveCorrectionEnabled: [
        {ret:'boolean'},
        function isPerspectiveCorrectionEnabled() {
        },
      ],
      isTwoSidedLightingEnabled: [
        {ret:'boolean'},
        function isTwoSidedLightingEnabled() {
        },
      ],
      setCulling: ['i32', function setCulling(mode) {
      }],
      setLocalCameraLightingEnable: [
        'boolean',
        function setLocalCameraLightingEnable(enable) {
        },
      ],
      setPerspectiveCorrectionEnable: [
        'boolean',
        function setPerspectiveCorrectionEnable(enable) {
        },
      ],
      setShading: ['i32', function setShading(mode) {
      }],
      setTwoSidedLightingEnable: [
        'boolean',
        function setTwoSidedLightingEnable(enable) {
        },
      ],
      setWinding: ['i32', function setWinding(mode) {
      }],
    },
    constants: {
      CULL_BACK: CULL_BACK,
      CULL_FRONT: CULL_FRONT,
      CULL_NONE: CULL_NONE,
      SHADE_FLAT: SHADE_FLAT,
      SHADE_SMOOTH: SHADE_SMOOTH,
      WINDING_CCW: WINDING_CCW,
      WINDING_CW: WINDING_CW,
    },
  });

});
