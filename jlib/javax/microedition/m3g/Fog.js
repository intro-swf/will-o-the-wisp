define(['java', './Object3D'], function(java, Object3D) {

  'use strict';
  
  const EXPONENTIAL = 80,
        LINEAR = 81;
  
  return java.define('javax.microedition.m3g.Fog', {
    base: Object3D,
    constructor: [function Fog() {
    }],
    methods: {
      getColor: [{ret:'i32'}, function getColor() {
      }],
      getDensity: [{ret:'f32'}, function getDensity() {
      }],
      getFarDistance: [{ret:'f32'}, function getFarDistance() {
      }],
      getMode: [{ret:'i32'}, function getMode() {
      }],
      getNearDistance: [{ret:'f32'}, function getNearDistance() {
      }],
      setColor: ['i32', function setColor(rgb) {
      }],
      setDensity: ['f32', function setDensity(rgb) {
      }],
      setLinear: ['f32', 'f32', function setLinear(near, far) {
      }],
      setMode: ['i32', function setMode(mode) {
      }],
    },
    constants: {
      EXPONENTIAL: EXPONENTIAL,
      LINEAR: LINEAR,
    },
  });

});
