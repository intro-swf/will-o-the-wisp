define(['java'], function(java) {
  
  'use strict';
  
  const _VALUE = java._VALUE;
  
  return java.define('java.lang.Boolean', {
    primitive: 'boolean',
    constructor: ['boolean', function Boolean(b) {
      this[_VALUE] = b;
    }],
    constants: {
      FALSE: false,
      TRUE: true,
    },
    methods: {
      booleanValue: [{ret:'boolean'}, function booleanValue() {
        return this[_VALUE];
      }],
      equals: [{ret:'boolean'}, 'object', function equals(o) {
        return o && o[_VALUE] === this[_VALUE];
      }],
      hashCode: [{ret:'i32'}, function hashCode() {
        return this[_VALUE] ? 1231 : 1237;
      }],
      toString: [{ret:'string'}, function toString() {
        return this[_VALUE] ? 'true' : 'false';
      }],
    },
  });
  
});
