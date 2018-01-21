define(['java', './NumberFormatException'], function(java, NumberFormatException) {
  
  'use strict';
  
  const _VALUE = java._VALUE;
  const _CTOR = java._CTOR;
  
  function fromBits(b) {
    return new Float32Array(new Int32Array([b]).buffer)[0];
  }
  
  function toBits(f) {
    return new Int32Array(new Float32Array([f]).buffer)[0];
  }
  
  return java.define('java.lang.Float', {
    primitive: 'f32',
    constructor: [
      ['f32', function Float(v) {
        this[_VALUE] = v;
      }],
      ['f64', function Float(v) {
        this[_VALUE] = new Float32Array([v])[0];
      }],
    ],
    constants: {
      MIN_VALUE: ['f32', fromBits(1)],
      MAX_VALUE: ['f32', fromBits(0x7f7fffff)],
      NaN: ['f32', NaN],
      NEGATIVE_INFINITY: ['f32', -Infinity],
      POSITIVE_INFINITY: ['f32', +Infinity],
    },
    staticMethods: {
      parseFloat: [{ret:'f32'}, 'string', function parseFloat(str) {
        var v = parseFloat(str);
        if (isNaN(v)) {
          throw new NumberFormatException();
        }
        return new Float32Array([v])[0];
      }],
      valueOf: [{ret:'./Float'}, 'string', function valueOf(str) {
        var v = parseFloat(str);
        if (isNaN(v)) {
          throw new NumberFormatException();
        }
        return new Float32Array([v])[0];
      }],
      intBitsToFloat: [{ret:'f32'}, 'i32', fromBits],
      floatToIntBits: [{ret:'i32'}, 'f32', toBits],
      isInfinite: [{ret:'boolean'}, 'f32', function isInfinite(f) {
        return !isFinite(f);
      }],
      isNaN: [{ret:'boolean'}, 'f32', function isNaN_(f) {
        return !isNaN(f);
      }],
      toString: [{ret:'string'}, 'f32', function toString(f) {
        return ''+f;
      }],
    },
    methods: {
      byteValue: [{ret:'i8'}, function byteValue() {
        return this[_VALUE] << 24 >> 24;
      }],
      doubleValue: [{ret:'f64'}, function doubleValue() {
        return this[_VALUE];
      }],
      floatValue: [{ret:'f32'}, function floatValue() {
        return this[_VALUE];
      }],
      shortValue: [{ret:'i16'}, function shortValue() {
        return this[_VALUE] << 16 >> 16;
      }],
      intValue: [{ret:'i32'}, function intValue() {
        return this[_VALUE] | 0;
      }],
      longValue: [{ret:'i64'}, function longValue() {
        throw new Exception('NYI');
      }],
      equals: [{ret:'boolean'}, 'object', function equals(o) {
        if (!o) return false;
        var cls = o[_CTOR];
        if (!cls || cls.primitive !== 'f32') return false;
        return o[_VALUE] === this[_VALUE];
      }],
      hashCode: [{ret:'i32'}, function hashCode() {
        return toBits(this[_VALUE]);
      }],
      toString: [{ret:'string'}, function toString() {
        return this[_VALUE].toString();
      }],
      isInfinite: [{ret:'boolean'}, function isInfinite() {
        return !isFinite(this[_VALUE]);
      }],
      isNaN: [{ret:'boolean'}, 'f32', function isNaN_() {
        return !isNaN(this[_VALUE]);
      }],
    },
  });
  
});
