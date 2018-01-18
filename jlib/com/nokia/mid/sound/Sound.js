define(['java'], function(java) {

  'use strict';
  
  const FORMAT_TONE = 1,
        FORMAT_WAV = 5,
        SOUND_PLAYING = 0,
        SOUND_STOPPED = 1,
        SOUND_UNINITIALIZED = 3;

  return java.define('com.nokia.mid.sound.Sound', {
    constructor: [
      [
        'i8[]', 'i32',
        function Sound(bytes, type) {
        },
      ],
      [
        'i32', 'i64',
        function Sound(hz, milliseconds) {
        },
      ],
    ],
    staticMethods: {
      getConcurrentSoundCount: [
        {ret:'i32'}, 'i32',
        function getConcurrentSoundCount(type) {
        },
      ],
      getSupportedFormats: [
        {ret:'i32[]'},
        function getSupportedFormats() {
        },
      ],
    },
    methods: {
      getGain: [{ret:'i32'}, function getGain() {
      }],
      getState: [{ret:'i32'}, function getGain() {
      }],
      init: [
        [
          'i8[]', 'i32',
          function init(bytes, type) {
          },
        ],
        [
          'i32', 'i64',
          function init(hz, milliseconds) {
          },
        ],
      ],
      play: ['i32', function play(loop) {
      }],
      release: [function release() {
      }],
      resume: [function resume() {
      }],
      setGain: ['i32', function setGain(gain) {
      }],
      setSoundListener: [
        './SoundListener',
        function setSoundListener(listener) {
        },
      ],
      stop: [function stop() {
      }],
    },
    constants: {
      FORMAT_TONE         : FORMAT_TONE,
      FORMAT_WAV          : FORMAT_WAV,
      SOUND_PLAYING       : SOUND_PLAYING,
      SOUND_STOPPED       : SOUND_STOPPED,
      SOUND_UNINITIALIZED : SOUND_UNINITIALIZED,
    },
  });

});
