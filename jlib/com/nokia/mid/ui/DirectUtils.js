define(['java'], function(java) {

  'use strict';
  
  return java.define('com.nokia.mid.ui.DirectUtils', {
    staticMethods: {
      createImage: [
        [
          {ret:'javax.microedition.lcdui.Image'}, 'i8[]', 'i32', 'i32',
          function createImage(bytes, offset, length) {
          },
        ],
        [
          {ret:'javax.microedition.lcdui.Image'}, 'i32', 'i32', 'i32',
          function createImage(width, height, argb) {
          },
        ],
      ],
      getDirectGraphics: [
        {ret:'./DirectGraphics'}, 'javax.microedition.lcdui.Graphics',
        function getDirectGraphics(gfx) {
        },
      ],
    },
  });

});
