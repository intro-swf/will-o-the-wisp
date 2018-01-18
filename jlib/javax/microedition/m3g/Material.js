define(['java', './Object3D'], function(java, Object3D) {

  'use strict';
  
  const AMBIENT = 1024,
        DIFFUSE = 2048,
        EMISSIVE = 4096,
        SPECULAR = 8192;
  
  return java.define('javax.microedition.m3g.Material', {
    base: Object3D,
    constructor: [function Material() {
    }],
    methods: {
      getColor: [
        {ret:'i32'}, 'i32',
        function getColor(target) {
        },
      ],
      setColor: [
        'i32', 'i32',
        function setColor(target, argb) {
        },
      ],
      getShininess: [
        {ret:'f32'},
        function getShininess() {
        },
      ],
      setShininess: [
        'f32',
        function setShininess(shininesss) {
        },
      ],
      isVertexColorTrackingEnabled: [
        {ret:'boolean'},
        function isVertexColorTrackingEnabled() {
        },
      ],
      setVertexColorTrackingEnable: [
        'boolean',
        function setVertexColorTrackingEnable() {
        },
      ],
    },
    constants: {
      AMBIENT: AMBIENT:
      DIFFUSE: DIFFUSE,
      EMISSIVE: EMISSIVE,
      SPECULAR: SPECULAR,
    },
  });

});
