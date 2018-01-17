define(['java'], function(java) {

  'use strict';
  
  return java.define('javax.microedition.rms.RecordComparator', {
    superclass: 'interface',
    constants: {
      EQUIVALENT: 0,
      FOLLOWS: 1,
      PRECEDES: -1,
    },
    methods: {
      compare: [{ret:'i32'}, 'i8[]', 'i8[]'],
    },
  });

});
