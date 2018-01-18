define(['java', './Object3D'], function(java, Object3D) {

  'use strict';
  
  return java.define('javax.microedition.m3g.VertexArray', {
    base: Object3D,
    constructor: [
      'i32', 'i32', 'i32',
      function VertexArray(numVertices, numComponents, componentSize) {
      },
    ],
    methods: {
      get: [
        ['i32', 'i32', 'i8[]', function get(offset, count, out_values) {
        }],
        ['i32', 'i32', 'i16[]', function get(offset, count, out_values) {
        }],
      ],
      set: [
        ['i32', 'i32', 'i8[]', function set(offset, count, values) {
        }],
        ['i32', 'i32', 'i16[]', function set(offset, count, values) {
        }],
      ],
      getComponentCount: [{ret:'i32'}, function getComponentCount() {
      }],
      getComponentType: [{ret:'i32'}, function getComponentType() {
      }],
      getVertexCount: [{ret:'i32'}, function getVertexCount() {
      }],
    },
  });

});
