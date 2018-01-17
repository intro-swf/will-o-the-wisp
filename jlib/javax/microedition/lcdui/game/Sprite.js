define(['java', './Layer', './Image'], function(java, Layer, Image) {

  'use strict';
  
  function Sprite() {
    var src = arguments[0];
    switch (arguments.length) {
      case 1:
        if (src instanceof Image) {
          // ...
        }
        else if (src instanceof Sprite) {
          // ...
        }
        else {
          throw new Error('bad arguments');
        }
        break;
      case 3:
        if (src instanceof Image) {
          var frameWidth = arguments[1];
          var frameHeight = arguments[2];
          // ...
        }
        else {
          throw new Error('bad arguments');
        }
        break;
    }
  }
  
  java.initClass(Sprite, {
    name: 'javax.microedition.lcdui.game.Sprite',
    superclass: Layer,
    instanceMembers: {
      collidesWidth: function() {
        // (image, x, y, pixelLevel)
        // (sprite, pixelLevel)
        // (tiledLayer, pixelLevel)
        throw new Error('NYI');
      },
      defineCollisionRectangle: function(x, y, width, height) {
        throw new Error('NYI');
      },
      defineReferencePixel: function(x, y) {
        throw new Error('NYI');
      },
      getFrame: function() {
        throw new Error('NYI');
      },
      getFrameSequenceLength: function() {
        throw new Error('NYI');
      },
      getRawFrameLength: function() {
        throw new Error('NYI');
      },
      getRefPixelX: function() {
        throw new Error('NYI');
      },
      getRefPixelY: function() {
        throw new Error('NYI');
      },
      nextFrame: function() {
        throw new Error('NYI');
      },
      paint: function(graphics) {
        throw new Error('NYI');
      },
      prevFrame: function() {
        throw new Error('NYI');
      },
      setFrame: function(sequenceIndex) {
        throw new Error('NYI');
      },
      setFrameSequence: function(intArray) {
        throw new Error('NYI');
      },
      setImage: function(image, frameWidth, imageHeight) {
        throw new Error('NYI');
      },
      setRefPixelPosition: function(x, y) {
        throw new Error('NYI');
      },
      setTransform: function(transform) {
        throw new Error('NYI');
      },
    },
    staticMembers: {
      TRANS_NONE: 0,
      TRANS_ROT90: 5,
      TRANS_ROT180: 3,
      TRANS_ROT270: 6,
      TRANS_MIRROR: 2,
      TRANS_MIRROR_ROT90: 7,
      TRANS_MIRROR_ROT180: 1,
      TRANS_MIRROR_ROT270: 4,
    },
  });
  
  return Sprite;

});
