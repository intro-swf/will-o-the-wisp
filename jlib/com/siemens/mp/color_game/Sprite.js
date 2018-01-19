define(['java', './Layer'], function(java, Layer) {
  
  'use strict';
  
  const TRANS_MIRROR = 2,
        TRANS_MIRROR_ROT180 = 1,
        TRANS_MIRROR_ROT270 = 4,
        TRANS_MIRROR_ROT90 = 7,
        TRANS_NONE = 0,
        TRANS_ROT180 = 3,
        TRANS_ROT270 = 6,
        TRANS_ROT90 = 5;
  
  return java.define('com.siemens.mp.color_game.Sprite', {
    base: Layer,
    constructor: [
      [
        'javax.microedition.lcdui.Image',
        function Sprite(image) {
        },
      ],
      [
        'javax.microedition.lcdui.Image', 'i32', 'i32',
        function Sprite(image, width, height) {
        },
      ],
      [
        './Sprite',
        function Sprite(copy) {
        },
      ],
    ],
    methods: {
      paint: ['javax.microedition.lcdui.Graphics', function paint(gfx) {
      }],
      collidesWith: [
        [
          'javax.microedition.lcdui.Image', 'i32', 'i32', 'boolean',
          function collidesWith(image, x, y, pixelPerfect) {
          },
        ],
        [
          './Sprite', 'boolean',
          function collidesWith(sprite, pixelPerfect) {
          },
        ],
        [
          './TiledLayer', 'boolean',
          function collidesWith(tiled, pixelPerfect) {
          },
        ],
      ],
      defineCollisionRectangle: [
        'i32', 'i32', 'i32', 'i32',
        function defineCollisionRectangle(x, y, width, height) {
        },
      ],
      defineReferencePixel: [
        'i32', 'i32',
        function defineReferencePixel(x, y) {
        },
      ],
      setRefPixelPosition: [
        'i32', 'i32',
        function setRefPixelPosition(x, y) {
        },
      ],
      getRefPixelX: [{ret:'i32'}, function getRefPixelX() {
      }],
      getRefPixelY: [{ret:'i32'}, function getRefPixelX() {
      }],
      setFrameSequence: ['i32[]', function setFrameSequence(seq) {
      }],
      getFrameSequenceLength: [{ret:'i32'}, function getFrameSequenceLength() {
      }],
      getRawFrameCount: [{ret:'i32'}, function getRawFrameCount() {
      }],
      setFrame: ['i32', function setFrame(seqIndex) {
      }],
      nextFrame: [function nextFrame() {
      }],
      prevFrame: [function prevFrame() {
      }],
      getFrame: [{ret:'i32'}, function getFrame() {
      }],
      setTransform: ['i32', function setTransform(mode) {
      }],
      setImage: [
        'javax.microedition.lcdui.Image', 'i32', 'i32',
        function setImage(image, width, height) {
        },
      ],
    },
    constants: {
      TRANS_MIRROR: 2,
      TRANS_MIRROR_ROT180: 1,
      TRANS_MIRROR_ROT270: 4,
      TRANS_MIRROR_ROT90: 7,
      TRANS_NONE: 0,
      TRANS_ROT180: 3,
      TRANS_ROT270: 6,
      TRANS_ROT90: 5,
    },
  });
  
});
