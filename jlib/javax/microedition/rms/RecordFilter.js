define(['java'], function(RecordFilter) {

  'use strict';

  return java.define('javax.microedition.rms.RecordFilter', {
    methods: {
      matches: [{ret:'boolean'}, 'i8[]'],
    },
  });

});
