define(['java'], function(java) {

  'use strict';
  
  const BATTERY = 1,
        FIELD_INTENSITY = 2,
        KEY_STATE = 3,
        VIBRATION = 4,
        BACK_LIGHT = 5,
        EIGHT_DIRECTIONS = 6;
  
  return java.define('com.vodafone.v10.system.device.DeviceControl', {
    staticMethods: {
      getDefaultDeviceControl: [
        {ret:'./DeviceControl'},
        function getDefaultDeviceControl() {
        },
      ],
      setMailListener: [
        './MailListener',
        function setMailListener(listener) {
        },
      ],
      setScheduledAlarmListener: [
        './ScheduledAlarmListener',
        function setScheduledAlarmListener(listener) {
        },
      ],
      setTelephonyListener: [
        './ScheduledAlarmListener',
        function setTelephonyListener(listener) {
        },
      ],
      setRingStateListener: [
        './RingStateListener',
        function setRingStateListener(listener) {
        },
      ],
    },
    methods: {
      getDeviceState: [{ret:'i32'}, 'i32', function getDeviceState() {
      }],
      isDeviceActive: [{ret:'boolean'}, 'i32', function isDeviceActive(device) {
      }],
      setDeviceActive: [{ret:'boolean'}, 'i32', 'boolean', function isDeviceActive(device, active) {
      }],
      blink: ['i32', 'i32', 'i32', function blink(v1, v2, v3) {
      }],
      setKeyRepeatState: [{ret:'boolean'}, 'i32', 'boolean', function setKeyRepeatState(i, boolean) {
      }],
      getKeyRepeatState: [{ret:'boolean'}, 'i32', function getKeyRepeatState(i) {
      }],
    },
    constants: {
      BATTERY: BATTERY,
      FIELD_INTENSITY: FIELD_INTENSITY,
      KEY_STATE: KEY_STATE,
      VIBRATION: VIBRATION,
      BACK_LIGHT: BACK_LIGHT,
      EIGHT_DIRECTIONS: EIGHT_DIRECTIONS;
    },
  });

});
