define(['java', './IndexBuffer'], function(java, IndexBuffer) {

  'use strict';
  
  return java.define('javax.microedition.m3g.TriangleStripArray', {
    base: IndexBuffer,
    constructor: [
      [
        'i32[]', 'i32',
        function TriangleStripArray(indices, stripLengths) {
        },
      ],
      [
        'i32', 'i32',
        function TriangleStripArray(firstIndex, stripLengths) {
        },
      ],
    ],
  });

});
