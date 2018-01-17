define(['java', './Displayable'], function(java, Displayable) {

  'use strict';
  
  return java.defineClass(
  
    function Canvas() {
    },
    
    {
      name: 'javax.microedition.lcdui.Canvas',
      superclass: Displayable,
      instanceMethods: {
        getGameAction: function(keyCode) {
          throw new Error('NYI');
        },
        getKeyCode: function(gameAction) {
          throw new Error('NYI');
        },
        getKeyName: function(keyCode) {
          throw new Error('NYI');
        },
        hasPointerEvents: function() {
          throw new Error('NYI');
        },
        hasPointerMotionEvents: function() {
          throw new Error('NYI');
        },
        hasRepeatEvents: function() {
          throw new Error('NYI');
        },
        hideNotify: function() {
          throw new Error('NYI');
        },
        isDoubleBuffered: function() {
          throw new Error('NYI');
        },
        keyPressed: function(keyCode) {
          throw new Error('NYI');
        },
        keyReleased: function(keyCode) {
          throw new Error('NYI');
        },
        keyRepeated: function(keyCode) {
          throw new Error('NYI');
        },
        paint: function(graphics) {
          throw new Error('NYI');
        },
        pointerDragged: function(x, y) {
          throw new Error('NYI');
        },
        pointerPressed: function(x, y) {
          throw new Error('NYI');
        },
        pointerReleased: function(x, y) {
          throw new Error('NYI');
        },
        repaint: function() {
          // ()
          // (x, y, width, height)
          throw new Error('NYI');
        },
        serviceRepaints: function() {
          throw new Error('NYI');
        },
        setFullScreenMode: function(boolean) {
          throw new Error('NYI');
        },
        showNotify: function() {
          throw new Error('NYI');
        },
        sizeChanged: function(width, height) {
          throw new Error('NYI');
        },
      },
      staticMembers: {
        UP: 1,
        DOWN: 6,
        LEFT: 2,
        RIGHT: 5,
        FIRE: 8,
        GAME_A: 9,
        GAME_B: 10,
        GAME_C: 11,
        GAME_D: 12,
        KEY_NUM0: 48,
        KEY_NUM1: 49,
        KEY_NUM2: 50,
        KEY_NUM3: 51,
        KEY_NUM4: 52,
        KEY_NUM5: 53,
        KEY_NUM6: 54,
        KEY_NUM7: 55,
        KEY_NUM8: 56,
        KEY_NUM9: 57,
        KEY_STAR: 42,
        KEY_POUND: 35,
      },
    });

});
