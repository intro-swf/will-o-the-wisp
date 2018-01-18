define(['java'], function(java) {

  'use strict';
  
  // deprecated by javax.microedition.media.PlayerListener

  return java.define('com.nokia.mid.sound.SoundListener', {
    base: 'interface',
    methods: {
      soundStateChanged: ['./Sound', 'i32'],
    },
  });

});
