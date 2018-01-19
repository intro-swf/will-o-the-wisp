define(['java'], function(java) {

  'use strict';

  return java.define('com.vodafone.v10.system.device.RingStateListener', {
    base: 'interface',
    methods: {
      ringStarted: [],
      ringStopped: [],
    },
  });

});
