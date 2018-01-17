define(['java'], function(java) {

  function Graphics() {
  }

  java.initClass(Graphics, {
    name: 'javax.microedition.lcdui.Graphics',
    instanceMembers: {
      clipRect: function(x, y, width, height) {
        throw new Error('NYI');
      },
      copyArea: function(srcX, srcY, width, height, destX, destY, anchor) {
        throw new Error('NYI');
      },
      drawArc: function(x, y, width, height, startAngle, arcAngle) {
        throw new Error('NYI');
      },
      drawChar: function(char16, x, y, anchor) {
        throw new Error('NYI');
      },
      drawChars: function(char16Array, offset, length, x, y, anchor) {
        throw new Error('NYI');
      },
      drawImage: function(image, x, y, anchor) {
        throw new Error('NYI');
      },
      drawLine: function(x1,y1, x2,y2) {
        throw new Error('NYI');
      },
      drawRect: function(x,y, width,height) {
        throw new Error('NYI');
      },
      drawRegion: function(image, srcX,srcY, width,height, transform, destX,destY, anchor) {
        throw new Error('NYI');
      },
      drawRGB: function(rgbData, offset, scanLength, x, y, width, height, processAlpha) {
        throw new Error('NYI');
      },
      drawRoundRect: function(x,y, width,height, arcWidth, arcHeight) {
        throw new Error('NYI');
      },
      drawString: function(str, x, y, anchor) {
        throw new Error('NYI');
      },
      drawSubstring: function(str, offset, length, x, y, anchor) {
        throw new Error('NYI');
      },
      fillArc: function(x,y,width,height,startAngle,arcAngle) {
        throw new Error('NYI');
      },
      fillRect: function(x,y, width,height) {
        throw new Error('NYI');
      },
      fillRoundRect: function(x,y, width,height, arcWidth,arcHeight) {
        throw new Error('NYI');
      },
      fillTriangle: function(x1,y1, x2,y2, x3,y3) {
        throw new Error('NYI');
      },
      getBlueComponent: function() {
        throw new Error('NYI');
      },
      getClipHeight: function() {
        throw new Error('NYI');
      },
      getClipWidth: function() {
        throw new Error('NYI');
      },
      getClipX: function() {
        throw new Error('NYI');
      },
      getClipY: function() {
        throw new Error('NYI');
      },
      getColor: function() {
        throw new Error('NYI');
      },
      getDisplayColor: function() {
        throw new Error('NYI');
      },
      getFont: function() {
        throw new Error('NYI');
      },
      getGrayScale: function() {
        throw new Error('NYI');
      },
      getGreenComponent: function() {
        throw new Error('NYI');
      },
      getRedComponent: function() {
        throw new Error('NYI');
      },
      getStrokeStyle: function() {
        throw new Error('NYI');
      },
      getTranslateX: function() {
        throw new Error('NYI');
      },
      getTranslateY: function() {
        throw new Error('NYI');
      },
      setClip: function(x, y, width, height) {
        throw new Error('NYI');
      },
      setColor: function() {
        // (rgb)
        // (r,g,b)
        throw new Error('NYI');
      },
      setFont: function(font) {
        throw new Error('NYI');
      },
      setGrayScale: function(value) {
        throw new Error('NYI');
      },
      setStrokeStyle: function(style) {
        throw new Error('NYI');
      },
      translate: function(x, y) {
        throw new Error('NYI');
      },
    },
    staticMembers: {
      HCENTER: 1,
      VCENTER: 2,
      LEFT: 4,
      RIGHT: 8,
      TOP: 0x10,
      BOTTOM: 0x20,
      BASELINE: 0x40,
      SOLID: 0,
      DOTTED: 1,
    },
  });
  
  return Graphics;

});
