define(['java'], function(java) {

  'use strict';
  
  return java.define('javax.microedition.midlet.MIDlet', {
    constructor: [
      {access:'protected'},
      function MIDlet() {
      },
    ],
    methods: {
      checkPermission: [{ret:'i32'}, 'string', function(permission) {
      }],
      destroyApp: [{access:'protected'}, 'boolean'],
      getAppProperty: [{ret:'string'}, 'string', function(propertyName) {
      }],
      notifyDestroyed: [function() {
      }],
      notifyPaused: [function() {
      }],
      pauseApp: [{access:'protected'}],
      platformRequest: [{ret:'boolean'}, 'string'],
      resumeRequest: [function() {
      }],
      startApp: [{access:'protected'}],
    },
  });

});
