define(['java'], function(java) {

  'use strict';
  
  return java.define('com.mascotcapsule.micro3d.v3.Graphics3D', {
    constructor: [function Graphics3D() {
    }],
    methods: {
      bind: ['javax.microedition.lcdui.Graphics', function bind(gfx) {
      }],
      release: ['javax.microedition.lcdui.Graphics', function release(gfx) {
      }],
      drawCommandList: [
        './Texture', 'i32', 'i32', './FigureLayout', './Effect3D',
        function drawCommandList(texture, x, y, figureLayout, effect) {
        },
      ],
      drawFigure: [
        './Figure', 'i32', 'i32', './FigureLayout', './Effect3D',
        function drawFigure(figure, x, y, figureLayout, effect) {
        },
      ],
      renderFigure: [
        './Figure', 'i32', 'i32', './FigureLayout', './Effect3D',
        function renderFigure(figure, x, y, figureLayout, effect) {
        },
      ],
      renderPrimitives: [
        './Texture', 'i32', 'i32', './FigureLayout', './Effect3D',
        'i32', 'i32', 'i32[]', 'i32[]', 'i32[]', 'i32[]',
        function renderPrimitives(figure, x, y, figureLayout, effect,
            flags, count, vertexCoords, normalCoords, colorCoords) {
        },
      ],
      flush: [function flush() {
      }],
      dispose: [function dispose() {
      }],
    },
  });

});
