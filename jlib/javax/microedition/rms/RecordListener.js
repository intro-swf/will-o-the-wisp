define(['java'], function(java) {

  'use strict';
  
  return java.define('javax.microedition.rms.RecordListener', {
    superclass: 'interface',
    methods: {
      recordAdded: ['./RecordStore', 'i32'],
      recordChanged: ['./RecordStore', 'i32'],
      recordDeleted: ['./RecordStore', 'i32'],
    },
  });

});
