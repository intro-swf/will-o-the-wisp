define(['java', './NumberFormatException'], function(java, NumberFormatException) {
  
  'use strict';
  
  const _VALUE = java._VALUE;
  const _CTOR = java._CTOR;
  
  return java.define('java.lang.Integer', {
    primitive: 'i32',
    final: true,
    constructor: ['i32', function Integer(v) {
      this[_VALUE] = v;
    }],
    constants: {
      MIN_VALUE:  0x7fffffff,
      MAX_VALUE: -0x80000000,
    },
    staticMethods: {
      parseInt: [
        [{ret:'i32'}, 'string'],
        [{ret:'i32'}, 'string', 'i32'],
        function parseInt(str, radix) {
          if (isNaN(radix)) radix = 10;
          var v = parseInt(str, radix);
          if (isNaN(v) || v < -0x80000000 || v > 0x7fffffff) {
            throw new NumberFormatException();
          }
          return v;
        },
      ],
      valueOf: [
        [{ret:'./Integer'}, 'string'],
        [{ret:'./Integer'}, 'string', 'i32'],
        function valueOf(str, radix) {
          if (isNaN(radix)) radix = 10;
          var v = parseInt(str, radix);
          if (isNaN(v) || v < -0x80000000 || v > 0x7fffffff) {
            throw new NumberFormatException();
          }
          return v;
        },
      ],
      toString: [
        [{ret:'string'}, 'i32'],
        [{ret:'string'}, 'i32', 'i32'],
        function toString(v, radix) {
          if (isNaN(radix)) radix = 10;
          return v.toString(radix);
        },
      ],
      toBinaryString: [{ret:'string'}, 'i32', function toBinaryString(v) {
        return v.toString(2);
      }],
      toHexString: [{ret:'string'}, 'i32', function toHexString(v) {
        return v.toString(16);
      }],
      toOctalString: [{ret:'string'}, 'i32', function toOctalString(v) {
        return v.toString(8);
      }],
    },
    methods: {
      byteValue: [{ret:'i8'}, function byteValue() {
        return this[_VALUE];
      }],
      doubleValue: [{ret:'f64'}, function doubleValue() {
        return this[_VALUE];
      }],
      floatValue: [{ret:'f32'}, function floatValue() {
        return new Float32Array([this[_VALUE]])[0];
      }],
      shortValue: [{ret:'i16'}, function shortValue() {
        return this[_VALUE];
      }],
      intValue: [{ret:'i32'}, function intValue() {
        return this[_VALUE];
      }],
      longValue: [{ret:'i64'}, function longValue() {
        return this[_VALUE];
      }],
      equals: [{ret:'boolean'}, 'object', function equals(o) {
        if (!o) return false;
        var cls = o[_CTOR];
        if (!cls || cls.primitive !== 'i32') return false;
        return o[_VALUE] === this[_VALUE];
      }],
      hashCode: [{ret:'i32'}, function hashCode() {
        return this[_VALUE];
      }],
      toString: [{ret:'string'}, function toString() {
        return this[_VALUE].toString();
      }],
    },
  });
  
});
