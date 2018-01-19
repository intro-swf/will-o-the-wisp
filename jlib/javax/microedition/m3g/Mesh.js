define(['java', './Node'], function(java, Node) {

  'use strict';
  
  return java.define('javax.microedition.m3g.Mesh', {
    base: Node,
    constructor: [
      [
        './VertexBuffer', './IndexBuffer[]', './Appearance[]',
        function Mesh(vertices, submeshes, appearances) {
        },
      ],
      [
        './VertexBuffer', './IndexBuffer', './Appearance',
        function Mesh(vertices, submesh, appearance) {
        },
      ],
    ],
    methods: {
      getSubmeshCount: [
        {ret:'i32'},
        function getSubmeshCount() {
        },
      ],
      getVertexBuffer: [
        {ret:'./VertexBuffer'},
        function getVertexBuffer() {
        },
      ],
      getIndexBuffer: [
        {ret:'./IndexBuffer'}, 'i32',
        function getIndexBuffer(index) {
        },
      ],
      setAppearance: [
        'i32', './Appearance',
        function setAppearance(index, appearance) {
        },
      ],
      getAppearance: [
        {ret:'./Appearance'}, 'i32',
        function getAppearance(index) {
        },
      ],
    },
  });

});
