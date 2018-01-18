define(['java'], function(java) {

  'use strict';
  
  const _TIME = Symbol('time');
  
  return java.define('java.util.Date', {
    constructor: [
      [],
      ['i64'],
      function Date(time) {
        if (arguments.length === 0) {
          this[_TIME] = new Date().getTime();
        }
        else {
          this[_TIME] = time;
        }
      },
    ],
    fields: {
      time: [{access:'private'}, 'i64', _TIME],
    },
    methods: {
      equals: ['object', function(v) {
        return v && v[_TIME] === this[_TIME];
      }],
      getTime: [{ret:'i64'}, function() {
        return this[_TIME];
      }],
      hashCode: [{ret:'i32'}, function() {
        // TODO: this[_TIME] ^ (this[_TIME] >>> 32)
        return 0x2cfb317a;
      }],
      setTime: ['i64', function(time) {
        this[_TIME] = time;
      }],
      toString: ['string', function() {
        var date = new Date(this[_TIME]);
        return [
          date.toLocaleString('en-US', {weekday:'short'}),
          date.toLocaleString('en-US', {month:'short', day:'2-digit'}),
          date.toLocaleString('en-US', {hour:'2-digit', minute:'2-digit', second:'2-digit', timeZoneName:'short', hour12:false}),
          date.getFullYear(),
        ].join(' ');
      }],
    },
  });

});
