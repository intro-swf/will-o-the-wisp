define(['java'], function(java) {

  'use strict';
  
  return java.define('java.util.Hashtable', {
    constructor: [
      [],
      ['i32'],
      function(initialCapacity) {
        if (arguments.length === 0) {
          initialCapacity = 8;
        }
      },
    ],
    methods: {
      clear: [function() {
      }],
      contains: [{ret:'boolean'}, 'object', function() {
      }],
      containsKey: [{ret:'boolean'}, 'object', function(key) {
      }],
      elements: [{ret:'./Enumeration'}, function() {
      }],
      get: [{ret:'object'}, 'object', function(key) {
      }],
      isEmpty: [{ret:'boolean'}, function() {
      }],
      keys: [{ret:'./Enumeration'}, function() {
      }],
      put: [{ret:'object'}, 'object', 'object', function(key, value) {
      }],
      rehash: [{access:'protected', function() {
      }],
      remove: [{ret:'object'}, 'object', function(key) {
      }],
      size: [{ret:'i32'}, function() {
      }],
      toString: [{ret:'string'}, function() {
      }],
    },
  });

});
