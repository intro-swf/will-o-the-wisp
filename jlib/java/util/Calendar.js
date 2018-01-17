define(['java'], function(java) {

  'use strict';
  
  const _FIELDS = Symbol('fields'),
        _IS_SET = Symbol('isSet'),
        _TIME = Symbol('time');
  
  var Calendar;
  return Calendar = java.define('java.util.Calendar', {
    constructor: [
      {access: 'protected'},
      function Calendar() {
      },
    ],
    staticMethods: {
      getInstance: [
        [],
        ['./TimeZone'],
        function(timezone) {
        },
      ],
    },
    methods: {
      after: ['object', function(when) {
      }],
      before: ['object', function(when) {
      }],
      computeFields: [{access:'protected'}, function() {
      }],
      computeTime: [{access:'protected'}, function() {
      }],
      equals: [{ret:'boolean'}, 'object', function(other) {
      }],
      get: [{ret:'i32'}, 'i32', function(field) {
      }],
      getTime: [{ret:'./Date'}, function() {
      }],
      getTimeInMillis: [{access:'protected', ret:'i16'}, function() {
      }],
      getTimeZone: [{ret:'./TimeZone'}, function() {
      }],
      set: ['i32', 'i32', function(field, value) {
      }],
      setTime: ['./Date', function(date) {
      }],
      setTimeInMillis: [{access:'protected'}, 'i64', function(ms) {
      }],
      setTimeZone: ['./TimeZone', function(timezone) {
      }],
    },
    fields: {
      fields: [{access:'protected'}, 'i32[]', _FIELDS],
      isSet: [{access:'protected'}, 'boolean[]', _IS_SET],
      time: [{access:'protected'}, 'i64', _TIME],
    },
  });

});
