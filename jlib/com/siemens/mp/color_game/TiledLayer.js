define(['java', './Layer'], function(java, Layer) {

  'use strict';
  
  return java.define('com.siemens.mp.color_game.TiledLayer', {
    base: Layer,
    constructor: [
      'i32', 'i32', 'javax.microedition.lcdui.Image', 'i32', 'i32',
      function TiledLayer(columns, rows, image, tileWidth, tileHeight) {
      },
    ],
    methods: {
      createAnimatedTile: [
        {ret:'i32'}, 'i32',
        function createAnimatedTile(staticTileIndex) {
        },
      ],
      setAnimatedTile: [
        'i32', 'i32',
        function setAnimatedTile(animatedTileIndex, staticTileIndex) {
        },
      ],
      getAnimatedTile: [
        {ret:'i32'}, 'i32',
        function getAnimatedTile(animatedTileIndex) {
        },
      ],
      setCell: [
        'i32', 'i32', 'i32',
        function setCell(col, row, tileIndex) {
        },
      ],
      fillCells: [
        'i32', 'i32', 'i32', 'i32', 'i32',
        function fillCells(col, row, numCols, numRows, tileIndex) {
        },
      ],
      getCell: [
        {ret:'i32'}, 'i32', 'i32',
        function getCell(col, row) {
        },
      ],
      getCellWidth: [{ret:'i32'}, function getCellWidth() {
      }],
      getCellHeight: [{ret:'i32'}, function getCellHeight() {
      }],
      getColumns: [{ret:'i32'}, function getColumns() {
      }],
      getRows: [{ret:'i32'}, function getRows() {
      }],
      paint: ['javax.microedition.lcdui.Graphics', function paint(gfx) {
      }],
      setStaticTileSet: [
        'javax.microedition.lcdui.Image', 'i32', 'i32',
        function setStaticTileSet(image, tileWidth, tileHeight) {
        },
      ],
    },
  });

});
