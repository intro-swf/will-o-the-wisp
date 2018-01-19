define(['java', './Mesh'], function(java, Mesh) {

  'use strict';
  
  return java.define('javax.microedition.m3g.MorphingMesh', {
    base: Mesh,
    constructor: [
      [
        './VertexBuffer', './VertexBuffer[]', './IndexBuffer[]', './Appearance[]',
        function MorphingMesh(base, targets, submeshes, appearances) {
        },
      ],
      [
        './VertexBuffer', './VertexBuffer[]', './IndexBuffer', './Appearance',
        function MorphingMesh(base, targets, submesh, appearance) {
        },
      ],
    ],
    methods: {
      getMorphTargetCount: [{ret:'i32'}, function getMorphTargetCount() {
      }],
      getMorphTarget: [{ret:'./VertexBuffer'}, 'i32', function getMorphTarget(index) {
      }],
      setWeights: ['f32[]', function setWeights(weights) {
      }],
      getWeights: ['f32[]', function getWeights(out_weights) {
      }],
    },
  });

});
