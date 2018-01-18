define(['java', './Object3D'], function(java, Object3D) {

  'use strict';
  
  return java.define('javax.microedition.m3g.IndexBuffer', {
    base: Object3D,
    methods: {
      getIndexCount: [{ret:'i32'}, function getIndexCount() {
      }],
      getIndices: ['i32[]', function getIndices(out_values) {
      }],
    },
  });

});
