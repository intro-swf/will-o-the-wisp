define(['java'], function(java) {

  'use strict';
  
  return java.define('javax.microedition.m3g.RayIntersection', {
    constructor: [
      function RayIntersection() {
      },
    ],
    methods: {
      getDistance: [{ret:'f32'}, function getDistance() {
      }],
      getIntersected: [{ret:'./Node'}, function getIntersected() {
      }],
      getNormalX: [{ret:'f32'}, function getNormalX() {
      }],
      getNormalY: [{ret:'f32'}, function getNormalY() {
      }],
      getNormalZ: [{ret:'f32'}, function getNormalZ() {
      }],
      getRay: ['f32[]', function getRay(out_values) {
      }],
      getSubmeshIndex: [{ret:'i32'}, function getSubmeshIndex() {
      }],
      getTextureS: [{ret:'f32'}, 'i32', function getTextureS(index) {
      }],
      getTextureT: [{ret:'f32'}, 'i32', function getTextureT(index) {
      }],
    },
  });

});
