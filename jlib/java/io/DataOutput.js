define(['java'], function(java) {

  'use strict';
  
  return java.define('java.io.DataOutput', {
    base: 'interface',
    methods: {
      write: [
        ['i8[]'],
        ['i8[]', 'i32', 'i32'],
        ['i32'], // low 8 bits as byte
      ],
      writeBoolean: ['boolean'],
      writeByte: ['i8'],
      writeChar: ['char'],
      writeChars: ['string'],
      writeDouble: ['f64'],
      writeFloat: ['f32'],
      writeInt: ['i32'],
      writeLong: ['i64'],
      writeShort: ['i16'],
      writeUTF: ['string'],
    },
  });

});
