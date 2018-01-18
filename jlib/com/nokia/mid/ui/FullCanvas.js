define(['java'
          ,'jlib/javax/microedition/lcdui/Canvas'
          ,'jlib/java/lang/IllegalStateException'
],
function(java
          ,Canvas
          ,IllegalStateException
) {

  'use strict';
  
  // FullCanvas: deprecated by Canvas.setFullScreenMode()
  
  return java.define('com.nokia.mid.ui.FullCanvas', {
    base: Canvas,
    constructor: [
      {access:'protected'},
      function FullCanvas() {
      },
    ],
    methods: {
      // commands not supported by FullCanvas
      addCommand: [
        'jlib/javax/microedition/lcdui/Command',
        function addCommand(command) {
          throw new IllegalStateException();
        },
      ],
      setCommandListener: [
        'jlib/javax/microedition/lcdui/CommandListener',
        function setCommandListener(listener) {
          throw new IllegalStateException();
        },
      ],
    },
    constants: {
      KEY_UP_ARROW: -1,
      KEY_DOWN_ARROW: -2,
      KEY_LEFT_ARROW: -3,
      KEY_RIGHT_ARROW: -4,
      KEY_SOFTKEY1: -6,
      KEY_SOFTKEY2: -7,
      KEY_SOFTKEY3: -5,
      KEY_SEND: -10,
      KEY_END: -11,
    },
  });

});
