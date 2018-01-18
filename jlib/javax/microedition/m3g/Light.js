define(['java', './Node'], function(java, Node) {

  'use strict';
  
  const AMBIENT = 128,
        DIRECTIONAL = 129,
        OMNI = 130,
        SPOT = 131;
  
  return java.define('javax.microedition.m3g.Light', {
    base: Node,
    constructor: [function Light() {
    }],
    methods: {
      setColor: ['i32', function setColor(rgb) {
      }],
      getColor: [{ret:'i32'}, function getColor() {
      }],
      setAttenuation: [
        'f32', 'f32', 'f32',
        function setAttenuation(constant, linear, quadratic) {
        },
      ],
      getConstantAttenuation: [
        {ret:'f32'},
        function getConstantAttenuation() {
        },
      ],
      getLinearAttenuation: [
        {ret:'f32'},
        function getLinearAttenuation() {
        },
      ],
      getQuadraticAttenuation: [
        {ret:'f32'},
        function getQuadraticAttenuation() {
        },
      ],
      setIntensity: ['f32', function setIntensity(intensity) {
      }],
      getIntensity: [{ret:'f32'}, function getIntensity() {
      }],
      setMode: ['i32', function setMode(mode) {
      }],
      getMode: [{ret:'i32'}, function getMode() {
      }],
      setSpotAngle: ['f32', function setSpotAngle(angle) {
      }],
      getSpotAngle: [{ret:'f32'}, function getSpotAngle() {
      }],
      setSpotExponent: ['f32', function setSpotExponent(exponent) {
      }],
      getSpotExponent: [{ret:'f32'}, function getSpotExponent() {
      }],
    },
    constants: {
      AMBIENT: AMBIENT,
      DIRECTIONAL: DIRECTIONAL,
      OMNI: OMNI,
      SPOT: SPOT,
    },
  });

});
