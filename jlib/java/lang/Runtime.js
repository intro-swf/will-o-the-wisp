define(['java'], function(java) {

  'use strict';
  
  return java.define('java.lang.Runtime', {
    final: true, // no accessible constructor
    staticMethods: {
      getRuntime: [{ret:'./Runtime'}, function() {
        return java.currentThread.vm.runtimeObject;
      }],
    },
    methods: {
      exit: [{blocking:true}, 'i32', function exit(statusCode) {
        return java.currentThread.vm.exit(statusCode);
      }],
      freeMemory: [{ret:'i64'}, function freeMemory() {
        return java.currentThread.vm.freeMemory();
      }],
      gc: [function gc() {
        java.currentThread.vm.gc();
      }],
      totalMemory: [{ret:'i64'}, function totalMemory() {
        return java.currentThread.vm.totalMemory();
      }],
    },
  });

});
