define(['java', './Layer'], function(java, Layer) {

  'use strict';
  
  function TiledLayer(columns, rows, image, tileWidth, tileHeight) {
  }
  
  java.initClass(TiledLayer, {
    name: 'javax.microedition.lcdui.game.TiledLayer',
    superclass: Layer,
    instanceMethods: {
      createAnimatedTile: function(staticTileIndex) {
        throw new Error('NYI');
      },
      fillCells: function(col, row, numCols, numRows, tileIndex) {
        throw new Error('NYI');
      },
      getAnimatedTiles: function(animatedTileIndex) {
        throw new Error('NYI');
      },
      getCell: function(col, row) {
        throw new Error('NYI');
      },
      getCellHeight: function() {
        throw new Error('NYI');
      },
      getCellWidth: function() {
        throw new Error('NYI');
      },
      getColumns: function() {
        throw new Error('NYI');
      },
      getRows: function() {
        throw new Error('NYI');
      },
      paint: function(graphics) {
        throw new Error('NYI');
      },
      setAnimatedTile: function(animatedTileIndex, staticTileIndex) {
        throw new Error('NYI');
      },
      setCell: function(col, row, tileIndex) {
        throw new Error('NYI');
      },
      setStaticTileSet: function(image, tileWidth, tileHeight) {
        throw new Error('NYI');
      },
    },
  });
  
  return TiledLayer;

});
