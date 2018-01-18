define(['java', '../lang/Runnable'], function(java, Runnable) {

  'use strict';
  
  return java.define('java.util.TimerTask', {
    interfaces: [Runnable],
    constructor: [
      {access: 'protected'},
      function TimerTask() {
      },
    ],
    methods: {
      cancel: [{ret:'boolean'}, function() {
      }],
      run: [], // abstract
      scheduledExecutionTime: [{ret:'i64'}, function() {
      }],
    },
  });

});
