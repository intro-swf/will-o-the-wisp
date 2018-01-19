define(['java'], function(java) {

  'use strict';

  return java.define('com.vodafone.v10.system.device.MailListener', {
    base: 'interface',
    methods: {
      received: ['i32'],
    },
    constants: {
      SMS: 1,
      MMS: 2,
      CBS: 3,
      WEB: 4,
    },
  });

});
