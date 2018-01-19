define(['java', '../../microedition/io/Connection'], function(java, Connection) {

  'use strict';
  
  return java.define('javax.wireless.messaging.MessageListener', {
    base: 'interface',
    interfaces: [Connection],
    methods: {
      newMessage: [
        [{ret:'./Message'}, 'string'],
        [{ret:'./Message'}, 'string', 'string'],
      ],
      numberOfSegments: [{ret:'i32'}, './Message'],
      receive: [{ret:'./Message'}],
      send: ['./Message'],
      setMessageListener: ['./MessageListener'],
    },
  });

});
