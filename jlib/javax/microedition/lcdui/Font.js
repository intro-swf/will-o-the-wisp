define(['java'], function(java) {

  'use strict';
  
  const STYLE_PLAIN = 0,
        STYLE_BOLD = 1,
        STYLE_ITALIC = 2,
        STYLE_UNDERLINED = 4,
        SIZE_SMALL = 8,
        SIZE_MEDIUM = 0,
        SIZE_LARGE = 16,
        FACE_SYSTEM = 0,
        FACE_MONOSPACE = 32,
        FACE_PROPORTIONAL = 64,
        FONT_STATIC_TEXT = 0,
        FONT_INPUT_TEXT = 1;
  
  return java.define('javax.microedition.lcdui.Font', {
    final: true,
    constructor: [
      {access:'private'},
      function Font() {
      },
    ],
    staticMethods: {
      getDefaultFont: ['./Font', function getDefaultFont() {
      }],
      getFont: [
        ['i32', function getFont(specifier) {
        }],
        ['i32','i32','i32', function getFont(face, style, size) {
        }],
      ],
    },
    methods: {
      charsWidth: [
        {ret:'i32'}, 'char[]', 'i32', 'i32',
        function charsWidth(chars, offset, length) {
        },
      ],
      charWidth: [
        {ret:'i32'}, 'char',
        function charWidth(c) {
        },
      ],
      getBaselinePosition: [
        {ret:'i32'},
        function getBaselinePosition() {
        },
      ],
      getFace: [
        {ret:'i32'},
        function getFace() {
        },
      ],
      getHeight: [
        {ret:'i32'},
        function getHeight() {
        },
      ],
      getSize: [
        {ret:'i32'},
        function getSize() {
        },
      ],
      getStyle: [
        {ret:'i32'},
        function getStyle() {
        },
      ],
      isBold: [
        {ret:'boolean'},
        function isBold() {
        },
      ],
      isItalic: [
        {ret:'boolean'},
        function isItalic() {
        },
      ],
      isPlain: [
        {ret:'boolean'},
        function isPlain() {
        },
      ],
      isUnderlined: [
        {ret:'boolean'},
        function isUnderlined() {
        },
      ],
      stringWidth: [
        {ret:'i32'}, 'string',
        function stringWidth(s) {
        },
      ],
      substringWidth: [
        {ret:'i32'}, 'string', 'i32', 'i32',
        function substringWidth(str, offset, len) {
        },
      ],
    },
    constants: {
      STYLE_PLAIN: STYLE_PLAIN,
      STYLE_BOLD: STYLE_BOLD,
      STYLE_ITALIC: STYLE_ITALIC,
      STYLE_UNDERLINED: STYLE_UNDERLINED,
      SIZE_SMALL: SIZE_SMALL,
      SIZE_MEDIUM: SIZE_MEDIUM,
      SIZE_LARGE: SIZE_LARGE,
      FACE_SYSTEM: FACE_SYSTEM,
      FACE_MONOSPACE: FACE_MONOSPACE,
      FACE_PROPORTIONAL: FACE_PROPORTIONAL,
      FONT_STATIC_TEXT: FONT_STATIC_TEXT,
      FONT_INPUT_TEXT: FONT_INPUT_TEXT,
    },
  });

});
