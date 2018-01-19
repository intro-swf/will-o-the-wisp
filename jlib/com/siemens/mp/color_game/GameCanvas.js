define(['java', 'jlib/javax/microedition/lcdui/Canvas'], function(java, Canvas) {
  
  'use strict';
  
  const DOWN_PRESSED = 64,
        FIRE_PRESSED = 256,
        GAME_A_PRESSED = 512,
        GAME_B_PRESSED = 1024,
        GAME_C_PRESSED = 2048,
        GAME_D_PRESSED = 4096,
        LEFT_PRESSED = 4,
        RIGHT_PRESSED = 32,
        UP_PRESSED = 2;
  
  return java.define('com.siemens.mp.color_game.GameCanvas', {
    base: Canvas,
    constructor: [
      {access:'protected'}, 'boolean',
      function GameCanvas(suppressKeyEvents) {
      },
    ],
    methods: {
      flushGraphics: [
        [
          function flushGraphics() {
          },
        ],
        [
          'i32','i32','i32','i32',
          function flushGraphics(x,y,width,height) {
          },
        ],
      ],
      getGraphics: [
        {access:'protected', ret:'javax.microedition.lcdui.Graphics'},
        function getGraphics() {
        },
      ],
      getKeyStates: [{ret:'i32'}, function getKeyStates() {
      }],
      hideNotify: [{access:'protected'}, function hideNotify() {
      }],
      keyPressed: [{access:'protected'}, 'i32', function keyPressed(keyCode) {
      }],
      keyReleased: [{access:'protected'}, 'i32', function keyReleased(keyCode) {
      }],
      keyRepeated: [{access:'protected'}, 'i32', function keyRepeated(keyCode) {
      }],
      paint: ['javax.microedition.lcdui.Graphics', function paint(gfx) {
      }],
    },
    constants: {
      DOWN_PRESSED: DOWN_PRESSED,
      FIRE_PRESSED: FIRE_PRESSED,
      GAME_A_PRESSED: GAME_A_PRESSED,
      GAME_B_PRESSED: GAME_B_PRESSED,
      GAME_C_PRESSED: GAME_C_PRESSED,
      GAME_D_PRESSED: GAME_D_PRESSED,
      LEFT_PRESSED: LEFT_PRESSED,
      RIGHT_PRESSED: RIGHT_PRESSED,
      UP_PRESSED: UP_PRESSED,
    },
  });
  
});
