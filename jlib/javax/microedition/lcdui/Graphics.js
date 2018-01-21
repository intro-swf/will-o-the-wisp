define(['java'], function(java) {
  
  'use strict';
  
  const HCENTER = 1,
        VCENTER = 2,
        LEFT = 4,
        RIGHT = 8,
        TOP = 0x10,
        BOTTOM = 0x20,
        BASELINE = 0x40,
        SOLID = 0,
        DOTTED = 1;

  return java.define('javax.microedition.lcdui.Graphics', {
    final: true, // no accessible constructors
    methods: {
      copyArea: [
        'i32','i32','i32','i32','i32','i32','i32',
        function copyArea(srcX, srcY, width, height, destX, destY, anchor) {
        },
      ],
      drawString: [
        'string','i32','i32','i32',
        function drawString(str, x, y, anchor) {
        },
      ],
      drawSubstring: [
        'string','i32','i32','i32','i32','i32',
        function drawSubstring(str, offset, length, x, y, anchor) {
        },
      ],
      drawChars: [
        'char[]', 'i32', 'i32', 'i32', 'i32', 'i32',
        function(chars, offset, length, x, y, anchor) {
        },
      ],
      drawChar: [
        'char', 'i32', 'i32', 'i32',
        function drawChar(c, x, y, anchor) {
          throw new Error('NYI');
        },
      ],
      drawImage: [
        './Image', 'i32', 'i32', 'i32',
        function drawImage(image, x, y, anchor) {
        },
      ],
      drawRegion: [
        './Image','i32','i32','i32','i32','i32','i32','i32','i32',
        function drawRegion(image, srcX,srcY, width,height, transform, destX,destY, anchor) {
        },
      ],
      drawRGB: [
        'i32[]', 'i32','i32','i32','i32','i32','i32', 'boolean',
        function(rgbData, offset, scanLength, x, y, width, height, processAlpha) {
        },
      ],
      drawLine: [
        'i32','i32','i32','i32',
        function drawLine(x1,y1, x2,y2) {
        },
      ],
      drawArc: [
        'i32','i32','i32','i32','i32','i32',
        function drawArc(x, y, width, height, startAngle, arcAngle) {
        },
      ],
      fillArc: [
        'i32','i32','i32','i32','i32','i32',
        function fillArc(x,y,width,height,startAngle,arcAngle) {
        },
      ],
      drawRect: [
        'i32','i32','i32','i32',
        function drawRect(x,y, width,height) {
        },
      ],
      fillRect: [
        'i32','i32','i32','i32',
        function fillRect(x,y, width,height) {
        },
      ],
      drawRoundRect: [
        'i32','i32','i32','i32','i32','i32',
        function drawRoundRect(x,y, width,height, arcWidth, arcHeight) {
        },
      ],
      fillRoundRect: [
        'i32','i32','i32','i32','i32','i32',
        function fillRoundRect(x,y, width,height, arcWidth,arcHeight) {
        },
      ],
      fillTriangle: [
        'i32','i32','i32','i32','i32','i32',
        function fillTriangle(x1,y1, x2,y2, x3,y3) {
        },
      ],
      setClip: [
        'i32','i32','i32','i32',
        function setClip(x, y, width, height) {
        },
      ],
      clipRect: [
        'i32','i32','i32','i32',
        function clipRect(x, y, width, height) {
        },
      ],
      getClipX: [
        {ret:'i32'},
        function getClipX() {
        },
      ],
      getClipY: [
        {ret:'i32'},
        function getClipY() {
        },
      ],
      getClipWidth: [
        {ret:'i32'},
        function getClipWidth() {
        },
      ],
      getClipHeight: [
        {ret:'i32'},
        function getClipHeight() {
        },
      ],
      setColor: [
        ['i32', function setColor(rgb) {
        }],
        ['i32','i32','i32', function setColor(r,g,b) {
        }],
      ],
      getColor: [
        {ret:'i32'},
        function getColor() {
        },
      ],
      getDisplayColor: [
        {ret:'i32'},
        function getDisplayColor() {
        },
      ],
      getRedComponent: [
        {ret:'i32'},
        function getRedComponent() {
        },
      ],
      getGreenComponent: [
        {ret:'i32'},
        function getGreenComponent() {
        },
      ],
      getBlueComponent: [
        {ret:'i32'},
        function getBlueComponent() {
        },
      ],
      setGrayScale: [
        'i32',
        function setGrayScale(value) {
        },
      ],
      getGrayScale: [
        {ret:'i32'},
        function getGrayScale() {
        },
      ],
      setFont: [
        './Font',
        function setFont(font) {
        },
      ],
      getFont: [
        {ret:'./Font'},
        function getFont() {
        },
      ],
      setStrokeStyle: [
        'i32',
        function setStrokeStyle(style) {
        },
      ],
      getStrokeStyle: [
        {ret:'i32'},
        function getStrokeStyle() {
        },
      ],
      translate: [
        'i32', 'i32',
        function translate(x, y) {
        },
      ],
      getTranslateX: [
        {ret:'i32'},
        function getTranslateX() {
        },
      ],
      getTranslateY: [
        {ret:'i32'},
        function getTranslateY() {
        },
      ],
    },
    constants: {
      HCENTER: HCENTER,
      VCENTER: VCENTER,
      LEFT: LEFT,
      RIGHT: RIGHT,
      TOP: TOP,
      BOTTOM: BOTTOM,
      BASELINE: BASELINE,
      SOLID: SOLID,
      DOTTED: DOTTED,
    },
  });

});
