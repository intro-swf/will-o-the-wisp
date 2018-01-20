define(['java'], function(java) {

  'use strict';
  
  const _DISPLAY = new Symbol('display');
  
  const LIST_ELEMENT = 1,
        CHOICE_GROUP_ELEMENT = 2,
        ALERT = 3,
        COLOR_BACKGROUND = 0,
        COLOR_FOREGROUND = 1,
        COLOR_HIGHLIGHTED_BACKGROUND = 2,
        COLOR_HIGHLIGHTED_FOREGROUND = 3,
        COLOR_BORDER = 4,
        COLOR_HIGHLIGHTED_BORDER = 5;
  
  var Display = java.define('javax.microedition.lcdui.Display', {
    constructor: [function Display(midlet) {
    }],
    staticMethods: {
      getDisplay: function(midlet) {
        if (_DISPLAY in midlet) {
          return midlet[_DISPLAY];
        }
        return midlet[_DISPLAY] = new Display(midlet);
      },
    },
    methods: {
      callSerially: ['java.lang.Runnable', function callSerially(runnable) {
      }],
      flashBacklight: [{ret:'boolean'}, 'i32', function flashBacklight(milliseconds) {
        // zero: turn flashing off
        // returns false if not possible
      }],
      getBestImageHeight: [{ret:'i32'}, 'i32', function getBestImageHeight(imageType) {
      }],
      getBestImageWidth: [{ret:'i32'}, 'i32', function getBestImageWidth(imageType) {
      }],
      getBorderStyle: [{ret:'i32'}, 'boolean', function getBorderStyle(highlighted) {
      }],
      getColor: [{ret:'i32'}, 'i32', function getColor(colorSpecifier) {
      }],
      getCurrent: [{ret:'./Displayable'}, function getCurrent() {
      }],
      isColor: [{ret:'boolean'}, function isColor() {
      }],
      numAlphaLevels: [{ret:'i32'}, function numAlphaLevels() {
      }],
      numColors: [{ret:'i32'}, function numColors() {
      }],
      setCurrent: [
        [
          './Alert', './Displayable',
          function setCurrent(alert, nextDisplayable) {
          },
        ],
        [
          './Displayable',
          function setCurrent(nextDisplayable) {
          },
        ],
      ],
      setCurrentItem: ['./Item', function setCurrentItem(item) {
      }],
      vibrate: [{ret:'boolean'}, 'i32', function vibrate(duration) {
      }],
    },
    constants: {
      LIST_ELEMENT: LIST_ELEMENT,
      CHOICE_GROUP_ELEMENT: CHOICE_GROUP_ELEMENT,
      ALERT: ALERT,
      COLOR_BACKGROUND: COLOR_BACKGROUND,
      COLOR_FOREGROUND: COLOR_FOREGROUND,
      COLOR_HIGHLIGHTED_BACKGROUND: COLOR_HIGHLIGHTED_BACKGROUND,
      COLOR_HIGHLIGHTED_FOREGROUND: COLOR_HIGHLIGHTED_FOREGROUND,
      COLOR_BORDER: COLOR_BORDER,
      COLOR_HIGHLIGHTED_BORDER: COLOR_HIGHLIGHTED_BORDER,
    },
  });
  
  return Display;

});
