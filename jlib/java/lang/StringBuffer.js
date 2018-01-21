define(['java'], function(java) {

  'use strict';
  
  const _VALUE = java._VALUE;
  
  function str(sb) {
    var v = sb[_VALUE].join('');
    sb[VALUE] = [v];
    return v;
  }
  
  return java.define('java.lang.StringBuffer', {
    final: true,
    constructor: [
      [function StringBuffer() {
        this[_VALUE] = [];
      }],
      ['i32', function StringBuffer(initialCapacity) {
        this[_VALUE] = [];
      }],
      ['string', function StringBuffer(initialText) {
        this[_VALUE] = [initialText];
      }],
    ],
    methods: {
      append: [
        [{ret:'./StringBuffer'}, 'char', function append(c) {
          this[_VALUE].push(String.fromCharCode(c));
          return this;
        }],
        [{ret:'./StringBuffer'}, 'char[]', function append(cs) {
          var chars = cs[_VALUE];
          this[_VALUE].push(String.fromCharCode.apply(null, chars));
          return this;
        }],
        [{ret:'./StringBuffer'}, 'char[]', 'i32', 'i32', function append(cs, offset, length) {
          var chars = cs[_VALUE];
          this[_VALUE].push(String.fromCharCode.apply(null, chars.subarray(offset, offset+length)));
          return this;
        }],
        [{ret:'./StringBuffer'}, 'i32'],
        [{ret:'./StringBuffer'}, 'i64'],
        [{ret:'./StringBuffer'}, 'f32'],
        [{ret:'./StringBuffer'}, 'f64'],
        [{ret:'./StringBuffer'}, 'boolean'],
        [{ret:'./StringBuffer'}, 'string'],
        [{ret:'./StringBuffer'}, 'object'],
        function append(v) {
          this[_VALUE].push(v+'');
          return this;
        },
      ],
      capacity: [{ret:'i32'}, function capacity() {
        return str(this).length;
      }],
      charAt: [{ret:'char'}, 'i32', function charAt(i) {
        return str(this).charCodeAt(i);
      }],
      delete: [
        {ret:'./StringBuffer'}, 'i32', 'i32',
        function delete(start, end) {
          var v = str(this);
          this[_VALUE] = [v.slice(0, start), v.slice(end)];
          return this;
        },
      ],
      deleteCharAt: [{ret:'./StringBuffer'}, 'i32', function deleteCharAt(i) {
        var v = str(this);
        this[_VALUE] = [v.slice(0, i), v.slice(i+1)];
        return this;
      }],
      ensureCapacity: ['i32', function ensureCapacity(minimum) {
      }],
      getChars: [
        'i32', 'i32', 'char[]', 'i32',
        function getChars(srcBegin, srcEnd, dst, dstBegin) {
          var v = str(this);
          dst = dst[_VALUE];
          var diff = dstBegin - srcBegin;
          for (var i = srcBegin; i < srcEnd; i++) {
            dst[i + diff] = v.charCodeAt(i);
          }
        },
      ],
      insert: [
        [{ret:'./StringBuffer'}, 'i32', 'char', function insert(i, c) {
          var s = str(this);
          this[_VALUE] = [s.slice(0, i), String.fromCharCode(c), s.slice(i)];
          return this;
        }],
        [{ret:'./StringBuffer'}, 'i32', 'char[]', function insert(i, cs) {
          cs = cs[_VALUE];
          var s = str(this);
          this[_VALUE] = [s.slice(0, i), String.fromCharCode.apply(null, cs), s.slice(i)];
          return this;
        }],
        [{ret:'./StringBuffer'}, 'i32', 'i32'],
        [{ret:'./StringBuffer'}, 'i32', 'i64'],
        [{ret:'./StringBuffer'}, 'i32', 'f32'],
        [{ret:'./StringBuffer'}, 'i32', 'f64'],
        [{ret:'./StringBuffer'}, 'i32', 'boolean'],
        [{ret:'./StringBuffer'}, 'i32', 'string'],
        [{ret:'./StringBuffer'}, 'i32', 'object'],
        function insert(i, v) {
          var s = str(this);
          this[_VALUE] = [s.slice(0, i), v, s.slice(i)];
          return this;
        },
      ],
      length: [{ret:'i32'}, function length() {
        return str(this).length;
      }],
      reverse: [{ret:'./StringBuffer'}, function reverse() {
        var reversed = [];
        var parts = this[_VALUE];
        for (var i = parts.length-1; i >= 0; i--) {
          var part = parts[i];
          for (var j = part.length-1; j >= 0; j--) {
            reversed.push(part[j]);
          }
        }
        this[_VALUE] = reversed;
        return this;
      }],
      setCharAt: ['i32', 'char', function setCharAt(i, char) {
        var s = str(this);
        this[_VALUE] = [s.slice(0, i), String.fromCharCode(char), s.slice(i+1)];
      }],
      setLength: ['i32', function setLength(len) {
        var s = str(this);
        if (len <= s.length) {
          this[_VALUE] = [s.slice(0, len)];
        }
        else {
          this[_VALUE].push(new Array(len - s.length).fill('\0').join()],
        }
      }],
      toString: [{ret:'string'}, function toString() {
        return str(this);
      }],
    },
  });

});
