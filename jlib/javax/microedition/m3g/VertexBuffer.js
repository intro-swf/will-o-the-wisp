define(['java', './Object3D'], function(java, Object3D) {

  'use strict';
  
  return java.define('javax.microedition.m3g.VertexBuffer', {
    base: Object3D,
    constructor: [function() {
    }],
    methods: {
      getColors: [{ret:'./VertexArray'}, function getColors() {
      }],
      getDefaultColor: [{ret:'i32'}, function getDefaultColor() {
      }],
      getNormals: [{ret:'./VertexArray'}, function getNormals() {
      }],
      getPositions: [
        {ret:'./VertexArray'}, 'f32[]',
        function getPositions(scaleBias) {
        },
      ],
      getTexCoords: [
        {ret:'./VertexArray'}, 'i32', 'f32[]',
        function getTexCoords(index, scaleBias) {
        },
      ],
      getVertexCount: [{ret:'i32'}, function getDefaultColor() {
      }],
      setColors: ['./VertexArray', function setColors(colors) {
      }],
      setDefaultColor: ['i32', function setDefaultColor(argb) {
      }],
      setNormals: ['./VertexArray', function setNormals(normals) {
      }],
      setPositions: [
        './VertexArray', 'f32', 'f32[]',
        function getPositions(positions, scale, bias) {
        },
      ],
      setTexCoords: [
        'i32', './VertexArray', 'f32', 'f32[]',
        function setTexCoords(index, texCoords, scale, bias) {
        },
      ],
    },
  });

});
