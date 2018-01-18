define(['java'], function(java) {

  'use strict';
  
  return java.define('java.util.Random', {
    constructor: [
      [],
      ['i64'],
      function Random(seed) {
      },
    ],
    methods: {
      next: [{access:'protected', ret:'i32'}, 'i32', function(bits) {
      }],
      nextDouble: [{ret:'f64'}, function() {
      }],
      nextFloat: [{ret:'f32'}, function() {
      }],
      nextInt: [
        [{ret:'i32'}, function() {
        }],
        [{ret:'i32'}, 'i32', function(lessThan) {
        }],
      ],
      nextLong: [{ret:'i64'}, function() {
      }],
      setSeed: ['i64', function(seed) {
      }],
    },
  });

});
