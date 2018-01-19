define(['java', './Runnable'], function(java, Runnable) {

  'use strict';
  
  const MAX_PRIORITY = 10,
        MIN_PRIORITY = 1,
        NORM_PRIORITY = 5;
  
  return java.define('java.lang.Thread', {
    interfaces: [Runnable],
    staticMethods: {
      activeCount: [{ret:'i32'}, function activeCount() {
      }],
      currentThread: [{ret:'Thread'}, function currentThread() {
      }],
      sleep: [{blocking:true}, 'i64', function sleep(milliseconds) {
      }],
      yield: [function() {
        // not marked as blocking: any waiting threads should be woken before
        // this function call returns (right?)
      }],
    },
    constructor: [
      [function Thread() {
      }],
      ['string', function Thread(name) {
      }],
      ['./Runnable', function Thread(target) {
      }],
      ['./Runnable', 'string', function Thread(target, name) {
      }],
    ],
    methods: {
      getName: [{ret:'string'}, function() {
      }],
      setPriority: ['i32', function setPriority(pri) {
      }],
      getPriority: [{ret:'i32'}, function() {
      }],
      interrupt: [function() {
      }],
      isAlive: [{ret:'boolean'}, function() {
      }],
      join: [{blocking:true}, function() {
      }],
      run: [function() {
      }],
      start: [function() {
      }],
      toString: [{ret:'string'}, function() {
      }],
    },
    constants: {
      MAX_PRIORITY: MAX_PRIORITY,
      MIN_PRIORITY: MIN_PRIORITY,
      NORM_PRIORITY: NORM_PRIORITY,
    },
  });

});
