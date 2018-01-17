define(['java', './Item'], function(java, Item) {

  'use strict';
  
  return java.defineClass(
  
    function CustomItem(label) {
    },
    
    {
      name: 'javax.microedition.lcdui.CustomItem',
      superclass: Item,
      instanceMembers: {
        getGameAction: function(keyCode) {
          throw new Error('NYI');
        },
        getInteractionModes: function() {
          throw new Error('NYI');
        },
        getMinContentHeight: function() {
          throw new Error('NYI');
        },
        getMinContentWidth: function() {
          throw new Error('NYI');
        },
        getPrefContentHeight: function() {
          throw new Error('NYI');
        },
        getPrefContentWidth: function() {
          throw new Error('NYI');
        },
        hideNotify: function() {
          throw new Error('NYI');
        },
        invalidate: function() {
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
        paint: function(graphics, width, height) {
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
        showNotify: function() {
          throw new Error('NYI');
        },
        sizeChanged: function(width, height) {
          throw new Error('NYI');
        },
        traverse: function(dir, viewportWidth, viewportHeight, inout_visibleRect) {
          // visible rect: int array
          throw new Error('NYI');
        },
        traverseOut: function() {
          throw new Error('NYI');
        },
      },
      staticMembers: {
        TRAVERSE_HORIZONTAL: 1,
        TRAVERSE_VERTICAL: 2,
        KEY_PRESS: 4,
        KEY_RELEASE: 8,
        KEY_RELEASE: 0x10,
        POINTER_PRESS: 0x20,
        POINTER_RELEASE: 0x40,
        POINTER_DRAG: 0x80,
        NONE: 0,
      },
    });

});
