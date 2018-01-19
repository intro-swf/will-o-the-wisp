define(['java', './Displayable'], function(java, Displayable) {

  'use strict';
  
  const UP = 1,
        DOWN = 6,
        LEFT = 2,
        RIGHT = 5,
        FIRE = 8,
        GAME_A = 9,
        GAME_B = 10,
        GAME_C = 11,
        GAME_D = 12,
        KEY_NUM0 = 48,
        KEY_NUM1 = 49,
        KEY_NUM2 = 50,
        KEY_NUM3 = 51,
        KEY_NUM4 = 52,
        KEY_NUM5 = 53,
        KEY_NUM6 = 54,
        KEY_NUM7 = 55,
        KEY_NUM8 = 56,
        KEY_NUM9 = 57,
        KEY_STAR = 42,
        KEY_POUND = 35;
  
  return java.define('javax.microedition.lcdui.Canvas', {
    base: Displayable,
    constructor: [{access:'protected'}, function Canvas() {
    }],
    methods: {
      getGameAction: [{ret:'i32'}, 'i32', function getGameAction(keyCode) {
      }],
      getKeyCode: [{ret:'i32'}, 'i32', function getKeyCode(gameAction) {
      }],
      getKeyName: [{ret:'string'}, 'i32', function getKeyName(keyCode) {
      }],
      hasPointerEvents: [{ret:'boolean'}, function hasPointerEvents() {
      }],
      hasPointerMotionEvents: [{ret:'boolean'}, function hasPointerMotionEvents() {
      }],
      hasRepeatEvents: [{ret:'boolean'}, function hasRepeatEvents() {
      }],
      hideNotify: [{access:'protected'}, function hideNotify() {
      }],
      isDoubleBuffered: [{ret:'boolean'}, function isDoubleBuffered() {
      }],
      keyPressed: [{access:'protected'}, function keyPressed(keyCode) {
      }],
      keyReleased: [{access:'protected'}, function keyReleased(keyCode) {
      }],
      keyRepeated: [{access:'protected'}, function keyRepeated(keyCode) {
      }],
      paint: [{access:'protected'}, './Graphics'],
      pointerDragged: [
        {access:'protected'}, 'i32', 'i32',
        function pointerDragged(x, y) {
        },
      ],
      pointerPressed: [
        {access:'protected'}, 'i32', 'i32',
        function pointerPressed(x, y) {
        },
      ],
      pointerReleased: [
        {access:'protected'}, 'i32', 'i32',
        function pointerReleased(x, y) {
        },
      ],
      repaint: [
        [
          function repaint() {
          },
        ],
        [
          'i32','i32','i32','i32',
          function repaint(x, y, width, height) {
          },
        ],
      ],
      serviceRepaints: [function serviceRepaints() {
      }],
      setFullScreenMode: ['boolean', function setFullScreenMode(full) {
      }],
      showNotify: [{access:'protected'}, function showNotify() {
      }],
      sizeChanged: [
        {access:'protected'}, 'i32', 'i32',
        function sizeChanged(width, height) {
          throw new Error('NYI');
        },
      ],
    },
    constants: {
      UP: UP,
      DOWN: DOWN,
      LEFT: LEFT,
      RIGHT: RIGHT,
      FIRE: FIRE,
      GAME_A: GAME_A,
      GAME_B: GAME_B,
      GAME_C: GAME_C,
      GAME_D: GAME_D,
      KEY_NUM0: KEY_NUM0,
      KEY_NUM1: KEY_NUM1,
      KEY_NUM2: KEY_NUM2,
      KEY_NUM3: KEY_NUM3,
      KEY_NUM4: KEY_NUM4,
      KEY_NUM5: KEY_NUM5,
      KEY_NUM6: KEY_NUM6,
      KEY_NUM7: KEY_NUM7,
      KEY_NUM8: KEY_NUM8,
      KEY_NUM9: KEY_NUM9,
      KEY_STAR: KEY_STAR,
      KEY_POUND: KEY_POUND,
    },
  });

});
