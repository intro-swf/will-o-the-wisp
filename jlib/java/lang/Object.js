define(['java'], function(java) {

  'use strict';

  const JObject = java.Object;
  
  const _CTOR = java._CTOR;
  const _HASHCODE = Symbol('hashCode');
  
  return java.define('java.lang.Object', {
    base: null,
    constructor: [java.Object],
    methods: {
      equals: [{ret:'boolean'}, 'object', function(other) {
        return (this === other);
      }],
      getClass: function() {
        return this[_CTOR].classObject;
      },
      hashCode: [{ret:'i32'}, function() {
        if (_HASHCODE in this) {
          return this[_HASHCODE];
        }
        return this[_HASHCODE] = (Math.random() * 0xffffffff) | 0;
      }],
      notify: [function() {
      }],
      notifyAll: [function() {
      }],
      toString: [{ret:'string'}, function() {
        return this[_CTOR].name + "@" + (this.hashCode() >>> 0).toString(16);
      }],
      wait: [
        [],
        ['i64'],
        ['i64', 'i32'],
        function(timeout, nanos) {
        },
      ],
    },
  });
  
});
