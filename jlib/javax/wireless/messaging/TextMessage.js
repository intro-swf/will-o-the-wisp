define(['java', './Message'], function(java, Message) {

  'use strict';
  
  return java.define('javax.wireless.messaging.TextMessage', {
    base: 'interface',
    interfaces: [Message],
    methods: {
      getPayloadText: [{ret:'string'}],
      setPayloadText: ['string'],
    },
  });

});
