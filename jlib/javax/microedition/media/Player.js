define(['java', './Controllable', './PlayerListener'], function(java, Controllable, PlayerListener) {

  'use strict';
  
  const UNREALIZED = 100,
        REALIZED = 200,
        PREFETCHED = 300,
        STARTED = 400,
        CLOSED = 0,
        TIME_UNKNOWN = -1;
  
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
      setMediaTime: [{ret:'i64'}, 'i64'],
      start: [],
      stop: [],
    },
    constants: {
      UNREALIZED: UNREALIZED,
      REALIZED: REALIZED,
      PREFETCHED: PREFETCHED,
      STARTED: STARTED,
      CLOSED: CLOSED,
      TIME_UNKNOWN: TIME_UNKNOWN,
    },
  });

});
