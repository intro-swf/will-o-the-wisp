define(['java'], function(java) {

  'use strict';
  
  return java.define('java.util.TimeZone', {
    constructor: [function TimeZone() {
    }],
    staticMethods: {
      getAvailableIDs: [{ret:'string[]'}, function() {
      }],
      getDefault: [{ret:'./TimeZone'}, function() {
      }],
      getTimeZone: [{ret:'./TimeZone'}, 'string', function(id) {
      }],
    },
    methods: {
      getID: [{ret:'string'}, function() {
      }],
      getOffset: [{ret:'i32'}, 'i32', 'i32', 'i32', 'i32', 'i32', 'i32'],
      getRawOffset: [{ret:'i32'}],
      useDaylightTime: [{ret:'boolean'}],
    },
  });

});
