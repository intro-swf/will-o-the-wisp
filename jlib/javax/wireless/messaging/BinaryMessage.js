define(['java', './Message'], function(java, Message) {

  'use strict';
  
  return java.define('javax.wireless.messaging.BinaryMessage', {
    base: 'interface',
    interfaces: [Message],
    methods: {
      getPayloadData: [{ret:'i8[]'}],
      setPayloadData: ['i8[]'],
    },
  });

});
