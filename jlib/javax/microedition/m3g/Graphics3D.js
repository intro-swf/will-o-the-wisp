define(['java'], function(java) {

  'use strict';
  
  const ANTIALIAS = 2,
        DITHER = 4,
        TRUE_COLOR = 8,
        OVERWRITE = 16;
  
  return java.define('javax.microedition.m3g.Graphics3D', {
    staticMethods: {
      getInstance: [
        {ret:'./Graphics3D'},
        function getInstance() {
        },
      ],
      getProperties: [
        {ret:'java.util.Hashtable'},
        funtion getProperties() {
        }
      ],
    },
    methods: {
      addLight: [
        {ret:'i32'}, './Light', './Transform',
        function addLight(light, transform) {
        },
      ],
      bindTarget: [
        [
          'object',
          function bindTarget(target) {
          },
        ],
        [
          'object', 'boolean', 'i32',
          function bindTarget(target, depthBuffer, hints) {
          },
        ],
      ],
      clear: ['./Background', function clear(bg) {
      }],
      getCamera: [
        {ret:'./Camera'}, './Transform',
        function getCamera(transform) {
        },
      ],
      getDepthRangeFar: [{ret:'f32'}, function getDepthRangeFar() {
      }],
      getDepthRangeNear: [{ret:'f32'}, function getDepthRangeFar() {
      }],
      getHints: [{ret:'i32'}, function getHints() {
      }],
      getLight: [
        {ret:'./Light'}, 'i32', './Transform',
        function getLight(index, transform) {
        },
      ],
      getLightCount: [{ret:'i32'}, function getLightCount() {
      }],
      getTarget: [{ret:'object'}, function getTarget() {
      }],
      getViewportHeight: [{ret:'i32'}, function getViewportHeight() {
      }],
      getViewportWidth: [{ret:'i32'}, function getViewportHeight() {
      }],
      getViewportX: [{ret:'i32'}, function getViewportX() {
      }],
      getViewportY: [{ret:'i32'}, function getViewportX() {
      }],
      isDepthBufferEnabled: [{ret:'boolean'}, function isDepthBufferEnabled() {
      }],
      releaseTarget: [function releaseTarget() {
      }],
      render: [
        [
          './Node', './Transform',
          function render(node, transform) {
          },
        ],
        [
          './VertexBuffer', './IndexBuffer', './Appearance', './Transform',
          function render(vertices, triangles, appearance, transform) {
          },
        ],
        [
          './VertexBuffer', './IndexBuffer', './Appearance', './Transform', 'i32',
          function render(vertices, triangles, appearance, transform, scope) {
          },
        ],
        [
          './World',
          function render(world) {
          },
        ],
      ],
      resetLights: [function resetLights() {
      }],
      setCamera: ['./Camera', './Transform', function setCamera(camera, transform) {
      }],
      setDepthRange: ['f32', 'f32', function setDepthRange(near, far) {
      }],
      setLight: [
        'i32', './Light', './Transform',
        function setLight(index, light, transform) {
        },
      ],
      setViewport: ['i32','i32','i32','i32', function setViewport(x,y,w,h) {
      }],
    },
    constants: {
      ANTIALIAS  : ANTIALIAS,
      DITHER     : DITHER,
      TRUE_COLOR : TRUE_COLOR,
      OVERWRITE  : OVERWRITE,
    },
  });

});
