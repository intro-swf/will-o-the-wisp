define(['java', './Controllable', './PlayerListener'], function(java, Controllable, PlayerListener) {

  'use strict';
  
  return java.define('javax/microedition.media.Player', {
    superclass: 'interface',
    interfaces: ['Controllable'],
    methods: {
      addPlayerListener: [PlayerListener],
      close: [],
      deallocate: [],
      getContentType: [{ret:'string'}],
      getDuration: [{ret:'i64'}],
      getMediaTime: [{ret:'i64'}],
      getState: [{ret:'i32'}],
      prefetch: [],
      realize: [],
      removePlayerListener: [PlayerListener],
      setLoopCount: ['i32'],
      setMediaTime: [{ret:'i64}, 'i64'],
      start: [],
      stop: [],
    },
  });

});
