define(['java'], function(java) {

  'use strict';
  
  const _VALUE = java._VALUE;
  
  return java.define('java.lang.String', {
    final: true,
    constructor: [
      [],
      ['i8[]'],
      ['i8[]', 'i32', 'i32'],
      ['i8[]', 'i32', 'i32', 'string'],
      function String(bytes, offset, len, enc) {
      },
      ['i8[]', 'string'],
      function String(bytes, enc) {
      },
      ['char[]'],
      ['char[]', 'i32', 'i32'],
      function String(chars, offset, len) {
      },
      ['string'],
      function String(str) {
      },
      ['./StringBuffer'],
      function String(sb) {
      },
    ],
    methods: {
      charAt: [{ret:'char'}, 'i32', function charAt(i) {
        return this[_VALUE].charCodeAt(i);
      }],
      compareTo: [{ret:'i32'}, 'string', function compareTo(str) {
        var v = this[_VALUE];
        return (v === str) ? 0 : (v < str) ? -1 : 1;
      }],
      concat: [{ret:'string'}, 'string', function concat(str) {
        return this[_VALUE] + str;
      }],
      endsWith: [{ret:'boolean'}, 'string', function endsWith(str) {
        return this[_VALUE].endsWith(str);
      }],
      equals: [{ret:'boolean'}, 'object', function equals(o) {
        return o && this[_VALUE] === o[_VALUE];
      }],
      equalsIgnoreCase: [{ret:'boolean'}, 'object', function equals(o) {
        return o
          && typeof o[_VALUE] === 'string'
          && this[_VALUE].toLowerCase() === o[_VALUE].toLowerCase();
      }],
      getBytes: [
        [{ret:'i8[]'}, function getBytes() {
        }],
        [{ret:'i8[]'}, 'string', function getBytes(enc) {
        }],
      ],
      getChars: [
        'i32', 'i32', 'char[]', 'i32',
        function getChars(srcBegin, srcEnd, dst, dstBegin) {
        },
      ],
      hashCode: [{ret:'i32'}, function hashCode() {
      }],
      indexOf: [
        [{ret:'i32'}, 'i32', function indexOf(c) {
        }],
        [{ret:'i32'}, 'i32', 'i32', function indexOf(c, startIndex) {
        }],
        [{ret:'i32'}, 'string', function indexOf(s) {
        }],
        [{ret:'i32'}, 'string', 'i32', function indexOf(s, startIndex) {
        }],
      ],
      intern: [{ret:'string'}, function intern() {
      }],
      lastIndexOf: [
        [{ret:'i32'}, 'i32', function lastIndexOf(c) {
        }],
        [{ret:'i32'}, 'i32', 'i32', function lastIndexOf(c, startIndex) {
        }],
      ],
      length: [{ret:'i32'}, function length() {
        return this[_VALUE].length;
      }],
      regionMatches: [
        {ret:'boolean'}, 'i32', 'string', 'i32', 'i32',
      ],
      replace: [
        {ret:'string'}, 'char', 'char',
      ],
      startsWith: [
        [{ret:'boolean'}, 'string'],
        [{ret:'boolean'}, 'string', 'i32'],
      ],
      substring: [
        [{ret:'string'}, 'i32'],
        [{ret:'string'}, 'i32', 'i32'],
      ],
      toCharArray: [{ret:'char[]'}, function toCharArray() {
        var v = this[_VALUE];
        var a = new Uint16Array(v.length);
        for (var i = 0; i < v.length; i++) {
          a[i] = v.charCodeAt(i);
        }
        return a;
      }],
      toLowerCase: [{ret:'string'}, function toLowerCase() {
        return this[_VALUE].toLowerCase();
      }],
      toString: [{ret:'string'}, function toString() {
        return this[_VALUE];
      }],
      toUpperCase: [{ret:'string'}, function toUpperCase() {
        return this[_VALUE].toUpperCase();
      }],
      trim: [{ret:'string'}, function trim() {
        return this[_VALUE].trim();
      }],
    },
    staticMethods: {
      valueOf: [
        ['boolean'],
        ['char'],
        ['char[]'],
        ['char[]', 'i32', 'i32'],
        ['f32'],
        ['f64'],
        ['i32'],
        ['i64'],
        ['object'],
        function valueOf(v) {
          return ''+v;
        },
      ],
    },
  });

});
