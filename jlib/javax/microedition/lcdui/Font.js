define(['java'], function(java) {

  'use strict';
  
  return java.defineClass(
  
    function Font() {
    },
    
    {
      name: 'javax.microedition.lcdui.Font',
      instanceMembers: {
        charsWidth: function(charArray, offset, length) {
          throw new Error('NYI');
        },
        charWidth: function(char) {
          throw new Error('NYI');
        },
        getBaselinePosition: function() {
          throw new Error('NYI');
        },
        getFace: function() {
          throw new Error('NYI');
        },
        getHeight: function() {
          throw new Error('NYI');
        },
        getSize: function() {
          throw new Error('NYI');
        },
        getStyle: function() {
          throw new Error('NYI');
        },
        isBold: function() {
          throw new Error('NYI');
        },
        isItalic: function() {
          throw new Error('NYI');
        },
        isPlain: function() {
          throw new Error('NYI');
        },
        isUnderlined: function() {
          throw new Error('NYI');
        },
        stringWidth: function(str) {
          throw new Error('NYI');
        },
        substringWidth: function(str, offset, len) {
          throw new Error('NYI');
        },
      },
      staticMembers: {
        getDefaultFont: function() {
          throw new Error('NYI');
        },
        getFont: function() {
          // (specifier)
          // (face, style, size)
          throw new Error('NYI');
        },
        STYLE_PLAIN: 0,
        STYLE_BOLD: 1,
        STYLE_ITALIC: 2,
        STYLE_UNDERLINED: 4,
        SIZE_SMALL: 8,
        SIZE_MEDIUM: 0,
        SIZE_LARGE: 16,
        FACE_SYSTEM: 0,
        FACE_MONOSPACE: 32,
        FACE_PROPORTIONAL: 64,
        FONT_STATIC_TEXT: 0,
        FONT_INPUT_TEXT: 1,
      },
    });

});
