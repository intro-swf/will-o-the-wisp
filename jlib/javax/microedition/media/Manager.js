define(['java'], function(java) {

  const TONE_DEVICE_LOCATOR = 'device://tone'];

  return java.define('javax.microedition.media.Manager', {
    staticMethods: {
      createPlayer: [
        [{ret:'./Player'}, 'java.io.InputStream', 'string', function(stream, type) {
        }],
        [{ret:'./Player'}, 'string', function(locator) {
        }],
      ],
      getSupportedContentTypes: [{ret:'string[]'}, 'string', function(protocol) {
      }],
      getSupportedProtocols: [{ret:'string[]'}, 'string', function(contentType) {
      }],
      playTone: ['i32', 'i32', 'i32', function(note, duration, volume) {
      }],
    },
    constants: {
      TONE_DEVICE_LOCATOR: TONE_DEVICE_LOCATOR,
    },
  });

});
