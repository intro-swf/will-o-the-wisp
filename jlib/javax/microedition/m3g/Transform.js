define(['java'], function(java) {

  'use strict';
  
  return java.define('javax.microedition.m3g.Transform', {
    constructor: [
      [],
      ['./Transform'],
      function Transform(copyFrom) {
      },
    ],
    methods: {
      get: ['f32()', function get(out_values) {
      }],
      invert: [function invert() {
      }],
      postMultiply: [
        './Transform',
        function postMultiply(t) {
        },
      ],
      postRotate: [
        'f32', 'f32', 'f32', 'f32',
        function postRotate(angle, ax, ay, az) {
        },
      ],
      postRotateQuat: [
        'f32', 'f32', 'f32', 'f32',
        function postRotateQuat(qx, qy qz, qw) {
        },
      ],
      postScale: [
        'f32', 'f32', 'f32',
        function postScale(x, y, z) {
        },
      ],
      postTranslate: [
        'f32', 'f32', 'f32',
        function postTranslate(x, y, z) {
        },
      ],
      set: [
        ['f32[]', function set(values) {
        }],
        ['./Transform', function set(t) {
        }],
      ],
      setIdentity: [function() {
      }],
      transform: [
        [
          'f32()',
          function transform(ref_vectors) {
          },
        ],
        [
          './VertexArray', 'f32[]', 'boolean',
          function transform(vertices, out_result, w1) {
          },
        ],
      ],
      transpose: [function() {
      }],
    },
  });

});
