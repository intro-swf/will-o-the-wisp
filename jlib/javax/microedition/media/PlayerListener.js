define(['java'], function(java) {

  'use strict';
  
  return java.define('javax.microedition.media.PlayerListener', {
    superclass: 'interface',
    methods: {
      playerUpdate: ['./Player', 'string', 'object'],
    },
    constants: {
      STARTED: 'started',
      STOPPED: 'stopped',
      END_OF_MEDIA: 'endOfMedia',
      DURATION_UPDATED: 'durationUpdated',
      DEVICE_UNAVAILABLE: 'deviceUnavailable',
      DEVICE_AVAILABLE: 'deviceAvailable',
      VOLUME_CHANGED: 'volumeChanged',
      ERROR: 'error',
      CLOSED: 'closed',
    },
  });

});
