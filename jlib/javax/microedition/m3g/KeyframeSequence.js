define(['java', './Object3D'], function(java, Object3D) {

  'use strict';
  
  const CONSTANT = 192,
        LINEAR = 176,
        LOOP = 193,
        SLERP = 177,
        SPLINE = 178,
        SQUAD = 179,
        STEP = 180;
  
  return java.define('javax.microedition.m3g.KeyframeSequence', {
    base: Object3D,
    constructor: [
      'i32', 'i32', 'i32',
      function KeyframeSequence(numKeyframes, numComponents, interpolation) {
      },
    ],
    methods: {
      getComponentCount: [{ret:'i32'}, function getComponentCount() {
      }],
      getDuration: [{ret:'i32'}, function getDuration() {
      }],
      setDuration: ['i32', function setDuration(timeUnits) {
      }],
      getInterpolationType: [{ret:'i32'}, function getInterpolationType() {
      }],
      getKeyframe: [
        {ret:'i32'}, 'i32', 'f32[]',
        function getKeyframe(index, out_value) {
        },
      ],
      setKeyframe: [
        'i32', 'i32', 'f32[]',
        function setKeyframe(index, time, value) {
        },
      ],
      getKeyframeCount: [{ret:'i32'}, function getKeyframeCount() {
      }],
      getRepeatMode: [{ret:'i32'}, function getRepeatMode() {
      }],
      setRepeatMode: ['i32', function setRepeatMode(mode) {
      }],
      getValidRangeFirst: [{ret:'i32'}, function getValidRangeFirst() {
      }],
      getValidRangeLast: [{ret:'i32'}, function getValidRangeLast() {
      }],
      setValidRange: ['i32','i32', function setValidRange(first, last) {
      }],
    },
    constants: {
      CONSTANT: CONSTANT,
      LINEAR: LINEAR,
      LOOP: LOOP,
      SLERP: SLERP,
      SPLINE: SPLINE,
      SQUAD: SQUAD,
      STEP: STEP,
    },
  });

});
