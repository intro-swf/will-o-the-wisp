define(['java', './Item', './Font'], function(java, Item, Font) {

  'use strict';
  
  return java.define('javax.microedition.lcdui.StringItem', {
    superclass: Item,
    constructor: [
      ['string', 'string'],
      ['string', 'string', 'i32'],
      function StringItem(label, text, appearanceMode) {
        appearanceMode = appearanceMode || 0;
      },
    ],
    methods: {
      getAppearanceMode: [{ret:'i32'}, function() {
      }],
      getFont: [{ret:Font}, function() {
      }],
      getText: [{ret:'string'}, function() {
      }],
      setFont: [Font, function(font) {
      }],
      setPreferredSize: ['i32', 'i32', function(width, height) {
      }],
      setText: ['string', function(text) {
      }],
    },
  });

});
