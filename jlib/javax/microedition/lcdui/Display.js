define(['java'], function(java) {

  'use strict';
  
  const _DISPLAY = new Symbol('display');
  
  return java.defineClass(
    
    function Display(midlet) {
    },
    
    {
      name: 'javax.microedition.lcdui',
      instanceMembers: {
        callSerially: function(runnable) {
        },
        flashBacklight: function(milliseconds) {
          // zero: turn flashing off
          // returns false if not possible
        },
        getBestImageHeight: function(imageType) {
        },
        getBestImageWidth: function(imageType) {
        },
        getBorderStyle: function(highlighted) {
        },
        getColor: function(colorSpecifier) {
        },
        getCurrent: function() {
        },
        isColor: function() {
        },
        numAlphaLevels: function() {
        },
        numColors: function() {
        },
        setCurrent: function() {
          // (alert, nextDisplayable)
          // (nextDisplayable)
        },
        setCurrentItem: function(item) {
        },
        vibrate: function(duration) {
        },
      },
      staticMembers: {
        getDisplay: function(midlet) {
          if (_DISPLAY in midlet) {
            return midlet[_DISPLAY];
          }
          return midlet[_DISPLAY] = new Display(midlet);
        },
        LIST_ELEMENT: 1,
        CHOICE_GROUP_ELEMENT: 2,
        ALERT: 3,
        COLOR_BACKGROUND: 0,
        COLOR_FOREGROUND: 1,
        COLOR_HIGHLIGHTED_BACKGROUND: 2,
        COLOR_HIGHLIGHTED_FOREGROUND: 3,
        COLOR_BORDER: 4,
        COLOR_HIGHLIGHTED_BORDER: 5,
      },
    });

});
