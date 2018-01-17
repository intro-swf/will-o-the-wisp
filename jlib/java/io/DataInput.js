define(['java'], function(java) {

  'use strict';
  
  return java.define('java.io.DataInput', {
    superclass: 'interface',
    methods: {
      readBoolean: [{ret:'boolean'}],
      readByte: [{ret:'i8'}],
      readChar: [{ret:'char'}],
      readDouble: [{ret:'f64'}],
      readFloat: [{ret:'f32'}],
      readFully: ['i8[]'],
      readFully: ['i8[]', 'i32', 'i32'],
      readInt: [{ret:'i32'}],
      readLong: [{ret:'i64'}],
      readShort: [{ret:'i16'}],
      readUnsignedByte: [{ret:'i32'}],
      readUnsignedShort: [{ret:'i32'}],
      readUTF: [{ret:'string'}],
      skipBytes: [{ret:'i32'}, 'i32'],
    },
  });

});
