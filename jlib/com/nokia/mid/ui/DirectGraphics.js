define(['java'], function(java) {

  'use strict';

  return java.define('com.nokia.mid.ui.DirectGraphics', {
    base: 'interface',
    methods: {
      drawImage: ['javax.microedition.lcdui.Image','i32','i32','i32','i32'],
      drawPixels: [
        ['i8[]','i8[]','i32','i32','i32','i32','i32','i32','i32','i32'],
        ['i32[]','boolean','i32','i32','i32','i32','i32','i32','i32','i32'],
        ['i16[]','boolean','i32','i32','i32','i32','i32','i32','i32','i32'],
      ],
      drawPolygon: ['i32[]','i32','i32[]','i32','i32','i32'],
      drawTriangle: ['i32','i32','i32','i32','i32','i32','i32'],
      fillPolygon: ['i32[]','i32','i32[]','i32','i32','i32'],
      fillTriangle: ['i32','i32','i32','i32','i32','i32','i32'],
      getAlphaComponent: [{ret:'i32'}],
      getNativePixelFormat: [{ret:'i32'}],
      getPixels: [
        ['i8[]','i8[]','i32','i32','i32','i32','i32','i32','i32'],
        ['i32[]','i32','i32','i32','i32','i32','i32','i32'],
        ['i16[]','i32','i32','i32','i32','i32','i32','i32'],
      ],
      setARGBColor: ['i32'],
    },
    constants: {
      FLIP_HORIZONTAL: 0x2000,
      FLIP_VERTICAL: 0x4000,
      ROTATE_90: 90,
      ROTATE_180: 180,
      ROTATE_270: 270,
      TYPE_BYTE_1_GRAY: 1,
      TYPE_BYTE_1_GRAY_VERTICAL: -1,
      TYPE_BYTE_2_GRAY: 2,
      TYPE_BYTE_4_GRAY: 4,
      TYPE_BYTE_8_GRAY: 8,
      TYPE_BYTE_332_RGB: 332,
      TYPE_USHORT_4444_ARGB: 4444,
      TYPE_USHORT_444_RGB: 444,
      TYPE_USHORT_555_RGB: 555,
      TYPE_USHORT_1555_ARGB: 1555,
      TYPE_USHORT_565_RGB: 565,
      TYPE_INT_888_RGB: 888,
      TYPE_INT_8888_ARGB: 8888,
    },
  });

});
