define(['java'], function(java) {

  'use strict';
  
  return java.define('javax.microedition.media.control.ToneControl', {
    superclass: 'interface',
    interfaces: ['../Control'],
    methods: {
      setSequence: ['i8[]'],
    },
    constants: {
      VERSION: ['i8', -2],
      TEMPO: ['i8', -3],
      RESOLUTION: ['i8', -4],
      BLOCK_START: ['i8', -5],
      BLOCK_END: ['i8', -6],
      PLAY_BLOCK: ['i8', -7],
      SET_VOLUME: ['i8', -8],
      REPEAT: ['i8', -9],
      C4: ['i8', 60],
      SILENCE: ['i8', -1],
    },
  });

});
