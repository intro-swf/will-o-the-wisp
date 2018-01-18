define(['java'], function(java) {

  'use strict';
  
  return java.define('java.util.Timer', {
    constructor: [
      function Timer() {
      },
    ],
    methods: {
      cancel: [function() {
      }],
      schedule: [
        ['./TimerTask', './Date'],
        ['./TimerTask', './Date', 'i64'],
        ['./TimerTask', 'i64'],
        ['./TimerTask', 'i64', 'i64'],
        function(task, dateOrDelay, period) {
        },
      ],
      scheduleAtFixedRate: [
        ['./TimerTask', './Date', 'i64'],
        ['./TimerTask', 'i64', 'i64'],
        function(task, dateOrDelay, period) {
        },
      ],
    },
  });

});
