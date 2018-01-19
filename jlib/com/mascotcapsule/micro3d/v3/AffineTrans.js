define(['java'], function(java) {

  'use strict';
  
  return java.define('com.mascotcapsule.micro3d.v3.AffineTrans', {
    constructor: [
      [
        function AffineTrans() {
        },
      ],
      [
        './AffineTrans',
        function AffineTrans(copy) {
        },
      ],
      [
        'i32','i32','i32','i32',
        'i32','i32','i32','i32',
        'i32','i32','i32','i32',
        function AffineTrans(
            m00,m01,m02,m03,
            m10,m11,m12,m13,
            m20,m21,m22,m23) {
        },
      ],
    ],
    fields: {
      m00:'i32', m01:'i32', m02:'i32', m03:'i32',
      m10:'i32', m11:'i32', m12:'i32', m13:'i32',
      m20:'i32', m21:'i32', m22:'i32', m23:'i32',
    },
    methods: {
      lookAt: [
        './Vector3D', './Vector3D', './Vector3D',
        function lookAt(v1, v2, v3) {
        },
      ],
      mul: [
        [
          './AffineTrans',
          function mul(t) {
          },
        ],
        [
          './AffineTrans', './AffineTrans',
          function mul(t1, t2) {
          },
        ],
      ],
      rotationX: ['i32', function rotationX(x) {
      }],
      rotationY: ['i32', function rotationY(y) {
      }],
      rotationZ: ['i32', function rotationZ(z) {
      }],
      set: ['./AffineTrans', function set(t) {
      }],
      setIdentity: [function setIdentity() {
      }],
      transform: [{ret:'./Vector3D'}, './Vector3D', function transform(v) {
      }],
    },
  });

});
