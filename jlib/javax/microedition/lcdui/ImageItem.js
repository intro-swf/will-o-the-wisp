define(['java', './Item', './Image'], function(java, Item, Image) {

  'use strict';
  
  const LAYOUT_DEFAULT = 0,
        LAYOUT_LEFT = 1,
        LAYOUT_RIGHT = 2,
        LAYOUT_CENTER = 3,
        LAYOUT_NEWLINE_BEFORE = 0x100,
        LAYOUT_NEWLINE_AFTER = 0x200;
  
  return java.define('javax.microedition.lcdui.ImageItem', {
    superclass: Item,
    constructor: [
      ['string', Image, 'i32', 'string'],
      ['string', Image, 'i32', 'string', 'i32'],
      function ImageItem(label, image, layout, altText, appearanceMode) {
        appearanceMode = appearanceMode || 0; // PLAIN
      },
    ],
    methods: {
      getAltText: [{ret:'string'}, function() {
      }],
      getAppearanceMode: [{ret:'i32'}, function() {
      }],
      getImage: [{ret:Image}, function() {
      }],
      getLayout: [{ret:'i32'}, function() {
      }],
      setAltText: ['string', function(text) {
      }],
      setImage: [Image, function(image) {
      }],
      setLayout: ['i32', function(layout) {
      }],
    },
    constants: {
      LAYOUT_DEFAULT: LAYOUT_DEFAULT,
      LAYOUT_LEFT: LAYOUT_LEFT,
      LAYOUT_RIGHT: LAYOUT_RIGHT,
      LAYOUT_CENTER: LAYOUT_CENTER,
      LAYOUT_NEWLINE_BEFORE: LAYOUT_NEWLINE_BEFORE,
      LAYOUT_NEWLINE_AFTER: LAYOUT_NEWLINE_AFTER,
    },
  });

});
