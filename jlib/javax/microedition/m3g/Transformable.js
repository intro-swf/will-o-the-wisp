define(['java', './Object3D'], function(java, Object3D) {

  'use strict';
  
  return java.define('javax.microedition.m3g.Transformable', {
    base: Object3D,
    methods: {
      setTransform: [
        './Transform',
        function setTransform(transform) {
        },
      ],
      getTransform: [
        './Transform',
        function getTransform(out_transform) {
        },
      ],
      getCompositeTransform: [
        './Transform',
        function getCompositeTransform(out_transform) {
        },
      ],
      setScale: [
        'f32', 'f32', 'f32',
        function setScale(x, y, z) {
        },
      ],
      scale: [
        'f32', 'f32', 'f32',
        function scale(x, y, z) {
        },
      ],
      getScale: [
        'f32[]',
        function getScale(out_xyz) {
        },
      ],
      setOrientation: [
        'f32', 'f32', 'f32', 'f32',
        function setOrientation(angle, ax, ay, az) {
        },
      ],
      preRotate: [
        'f32', 'f32', 'f32', 'f32',
        function preRotate(angle, ax, ay, az) {
        },
      ],
      postRotate: [
        'f32', 'f32', 'f32', 'f32',
        function postRotate(angle, ax, ay, az) {
        },
      ],
      getOrientation: [
        'f32[]',
        function getOrientation(out_angleAxis) {
        },
      ],
      setTranslation: [
        'f32', 'f32', 'f32',
        function setTranslation(x, y, z) {
        },
      ],
      translate: [
        'f32', 'f32', 'f32',
        function setTranslation(x, y, z) {
        },
      ],
      getTranslation: [
        'f32[]',
        function getTranslation(out_xyz) {
        },
      ],
    },
  });

});
