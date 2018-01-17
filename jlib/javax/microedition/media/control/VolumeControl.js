define(['java'], function(java) {

  'use strict';
  
  return java.define('javax.microedition.media.control', {
    superclass: 'interface',
    interfaces: ['../Control'],
    methods: {
      getLevel: [{ret:'i32'}],
      isMuted: [{ret:'boolean'}],
      setLevel: [{ret:'i32'}, 'i32'],
      setMute: ['boolean'],
    },
  });

});
