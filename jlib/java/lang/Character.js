define(['java'], function(java) {
  
  'use strict';
  
  const _VALUE = java._VALUE;
  const _CTOR = java._CTOR;
  
  return java.define('java.lang.Character', {
    primitive: 'char',
    final: true,
    constructor: ['char', function Character(c) {
      this[_VALUE] = c;
    }],
    staticMethods: {
      digit: [{ret:'i32'}, 'char', 'i32', function digit(char, radix) {
        var v = parseInt(String.fromCharCode(char), radix);
        return isNaN(v) ? -1 : v;
      }],
      isDigit: [{ret:'boolean'}, 'char', function isDigit(char) {
        return /\d/.test(String.fromCharCode(char));
      }],
      isLowerCase: [{ret:'boolean'}, 'char', function isDigit(char) {
        return /[a-z\xDF-\xF6\xF8-\xFF]/.test(String.fromCharCode(char));
      }],
      isUpperCase: [{ret:'boolean'}, 'char', function isDigit(char) {
        return /[A-Z\xC0-\xD6\xD8-\xDE]/.test(String.fromCharCode(char));
      }],
      toLowerCase: [{ret:'char'}, 'char', function toLowerCase(char) {
        return String.fromCharCode(char).toLowerCase().charCodeAt(0);
      }],
      toUpperCase: [{ret:'char'}, 'char', function toUpperCase(char) {
        return String.fromCharCode(char).toUpperCase().charCodeAt(0);
      }],
    },
    constants: {
      MIN_VALUE: ['char', 0],
      MAX_VALUE: ['char', 0xffff],
      MIN_RADIX: 2,
      MAX_RADIX: 36,
    },
    methods: {
      charValue: [{ret:'char'}, function charValue() {
        return this[_VALUE];
      }],
      equals: [{ret:'boolean'}, 'object', function equals(o) {
        if (!o) return false;
        var cls = o[_CTOR];
        if (!cls || cls.primitive !== 'char') return false;
        return o[_VALUE] === this[_VALUE];
      }],
      hashCode: [{ret:'i32'}, function hashCode() {
        return this[_VALUE] ^ 0xccf701bf;
      }],
      toString: [{ret:'string'}, function toString() {
        return String.fromCharCode(this[_VALUE]);
      }],
    },
  });
  
});
