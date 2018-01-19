define(['java'], function(java) {

  'use strict';
  
  return java.define('javax.wireless.messaging.MessageListener', {
    base: 'interface',
    methods: {
      notifyIncomingMessage: ['./MessageConnection'],
    },
  });

});
