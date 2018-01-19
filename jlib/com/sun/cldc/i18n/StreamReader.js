define(['java'
        ,'jlib/java/io/InputStream'
        ,'jlib/java/io/Reader',
],
function(java
        ,InputStream,
        ,Reader
) {

  'use strict';
  
  const _IN = Symbol('in');
  
  return java.define('com.sun.cldc.i18n.StreamReader', {
    base: Reader,
    constructor: [function StreamReader() {
    }],
    fields: {
      in: [InputStream, _IN];
    },
    methods: {
      open: [
        {ret:Reader}, InputStream, 'string',
        function open(stream, encoding) {
        },
      ],
      ready: [{ret:'boolean'}, function ready() {
      }],
      markSupported: [{ret:'boolean'}, function markSupported() {
      }],
      mark: ['i32', function mark(p) {
      }],
      reset: [function() {
      }],
      close: [function() {
      }],
      sizeOf: [{ret:'i32'}, 'i8[]', 'i32', 'i32'],
    },
  });

});
