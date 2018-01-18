define(['java', './Vector'], function(java, Vector) {

  'use strict';
  
  return java.define('java.util.Stack', {
    base: Vector,
    constructor: [
      function Stack() {
      },
    ],
    methods: {
      empty: [{ret:'boolean'}, function() {
      }],
      peek: [{ret:'object'}, function() {
      }],
      pop: [{ret:'object'}, function() {
      }],
      push: [{ret:'object'}, 'object', function(element) {
      }],
      search: [{ret:'i32'}, 'object', function(element) {
      }],
    },
  });

});
