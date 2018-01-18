define(['java'], function(java) {

  'use strict';
  
  return java.define('com.nokia.mid.ui.DeviceControl', {
    staticMethods: {
      flashLights: ['i64', function flashLights(milliseconds) {
      }],
      setLights: ['i32', 'i32', function setLights(which, max100) {
        // which: backlight=0, any others?
        // max100: often just a boolean on/off
      }],
      startVibra: ['i32', 'i64', function startVibra(max100, milliseconds) {
      }],
      stopVibra: [function stopVibra() {
      }],
    },
  });

});
