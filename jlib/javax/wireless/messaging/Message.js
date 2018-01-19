define(['java'], function(java) {

  'use strict';

  return java.define('javax.wireless.messaging.Message', {
    base: 'interface',
    methods: {
      setAddress: ['string'],
      getAddress: [{ret:'string'}],
      getTimestamp: [{ret:'java.util.Date'}],
    },
  });

});
