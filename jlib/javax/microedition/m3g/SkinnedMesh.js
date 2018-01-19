define(['java', './Mesh'], function(java, Mesh) {

  'use strict';
  
  return java.define('javax.microedition.m3g.SkinnedMesh', {
    base: Mesh,
    constructor: [
      [
        './VertexBuffer', './IndexBuffer[]', './Appearance[]', './Group',
        function SkinnedMesh(vertices, submeshes, appearances, skeleton) {
        },
      ],
      [
        './VertexBuffer', './IndexBuffer', './Appearance', './Group',
        function SkinnedMesh(vertices, submesh, appearance, skeleton) {
        },
      ],
    ],
    methods: {
      addTransform: [
        './Node', 'i32', 'i32', 'i32',
        function addTransform(bone, weight, firstVertex, numVertices) {
        },
      ],
      getBoneTransform: [
        './Node', './Transform',
        function getBoneTransform(bone, out_transform) {
        },
      ],
      getBoneVertices: [
        './Node', 'i32[]', 'f32[]',
        function getBoneVertices(bone, indices, weights) {
        },
      ],
      getSkeleton: [{ret:'./Group'}, function getSkeleton() {
      }],
    },
  });

});
