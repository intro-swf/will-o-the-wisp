define(['java', './NumberFormatException'], function(java, NumberFormatException) {
  
  'use strict';
  
  const _VALUE = java._VALUE;
  const _CTOR = java._CTOR;
  
  return java.define('java.lang.Byte', {
    primitive: 'i8',
    constructor: ['i8', function Byte(v) {
      this[_VALUE] = v;
    }],
    staticMethods: {
      parseByte: [
        [{ret:'i8'}, 'string'],
        [{ret:'i8'}, 'string', 'i32'],
        function parseByte(str, radix) {
          if (isNaN(radix)) radix = 10;
          var v = parseInt(str, radix);
          if (isNaN(v) || v < -128 || v > 127) {
            throw new NumberFormatException();
          }
          return v;
        },
      ],
    },
    constants: {
      MIN_VALUE: ['i8', -128],
      MAX_VALUE: ['i8', 127],
    },
    methods: {
      byteValue: [{ret:'i8'}, function byteValue() {
        return this[_VALUE];
      }],
      equals: [{ret:'boolean'}, 'object', function equals(o) {
        if (!o) return false;
        var cls = o[_CTOR];
        if (!cls || cls.primitive !== 'i8') return false;
        return o[_VALUE] === this[_VALUE];
      }],
      hashCode: [{ret:'i32'}, function hashCode() {
        return this[_VALUE] ^ 0xa9cfa55a;
      }],
      toString: [{ret:'string'}, function toString() {
        return this[_VALUE].toString();
      }],
    },
  });
  
});
