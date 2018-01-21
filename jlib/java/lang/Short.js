define(['java', './NumberFormatException'], function(java, NumberFormatException) {
  
  'use strict';
  
  const _VALUE = java._VALUE;
  const _CTOR = java._CTOR;
  
  return java.define('java.lang.Short', {
    primitive: 'i16',
    constructor: ['i16', function Short(v) {
      this[_VALUE] = v;
    }],
    constants: {
      MIN_VALUE: ['i16', -32768],
      MAX_VALUE: ['i16', 32767],
    },
    staticMethods: {
      parseShort: [
        [{ret:'i16'}, 'string'],
        [{ret:'i16'}, 'string', 'i32'],
        function parseShort(str, radix) {
          if (isNaN(radix)) radix = 10;
          var v = parseInt(str, radix);
          if (isNaN(v) || v < -32768 || v > 32767) {
            throw new NumberFormatException();
          }
          return v;
        },
      ],
    },
    methods: {
      shortValue: [{ret:'i16'}, function shortValue() {
        return this[_VALUE];
      }],
      equals: [{ret:'boolean'}, 'object', function equals(o) {
        if (!o) return false;
        var cls = o[_CTOR];
        if (!cls || cls.primitive !== 'i16') return false;
        return o[_VALUE] === this[_VALUE];
      }],
      hashCode: [{ret:'i32'}, function hashCode() {
        return (this[_VALUE] | (this[_VALUE] << 16)) ^ 0x470e45a2;
      }],
      toString: [{ret:'string'}, function toString() {
        return this[_VALUE].toString();
      }],
    },
  });
  
});
