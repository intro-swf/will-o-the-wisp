define(['java'], function(java) {

  'use strict';
  
  return java.define('com.mascotcapsule.micro3d.v3.Vector3D', {
    constructor: [
      [
        function Vector3D() {
        },
      ],
      [
        'i32', 'i32', 'i32',
        function Vector3D(x, y, z) {
        },
      ],
      [
        './Vector3D',
        function Vector3D(copy) {
        },
      ],
    ],
    fields: {
      x: 'i32',
      y: 'i32',
      z: 'i32',
    },
    methods: {
      unit: [function unit() {
      }],
      set: [
        [
          'i32', 'i32', 'i32',
          function set(x, y, z) {
          },
        ],
        [
          './Vector3D',
          function set(copy) {
          },
        ],
      ],
      innerProduct: [
        {ret:'i32'}, './Vector3D',
        function innerProduct(v) {
        },
      ],
      outerProduct: [
        './Vector3D',
        function outerProduct(v) {
        },
      ],
    },
    staticMethods: {
      innerProduct: [
        {ret:'i32'}, './Vector3D', './Vector3D',
        function innerProduct(v1, v2) {
        },
      ],
      outerProduct: [
        {ret:'./Vector3D'}, './Vector3D', './Vector3D',
        function outerProduct(v1, v2) {
        },
      ],
    },
  });

});
