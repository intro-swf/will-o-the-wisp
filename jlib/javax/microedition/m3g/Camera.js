define(['java', './Node'], function(java, Node) {

  'use strict';
  
  const GENERIC = 48,
        PARALLEL = 49,
        PERSPECTIVE = 50;
  
  return java.define('javax.microedition.m3g.Camera', {
    base: Node,
    constructor: [function Camera() {
    }],
    methods: {
      setGeneric: [
        './Transform',
        function setGeneric(transform) {
        },
      ],
      setParallel: [
        'f32','f32','f32','f32',
        function setParallel(fovy, aspectRatio, near, far) {
        },
      ],
      setPerspective: [
        'f32','f32','f32','f32',
        function setPerspective(fovy, aspectRatio, near, far) {
        },
      ],
      getProjection: [
        [
          './Transform',
          function getProjection(out_transform) {
          },
        ],
        [
          'f32[]',
          function getProjection(out_values) {
          },
        ],
      ],
    },
    constants: {
      GENERIC: GENERIC,
      PARALLEL: PARALLEL,
      PERSPECTIVE: PERSPECTIVE,
    },
  });

});
