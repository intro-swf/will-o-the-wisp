define(['java'
        ,'./Screen'
        ,'./Choice'
        ,'./Command'
        ,'./Image'
        ,'./Font'
        ,'./Ticker'
],
function(java
          ,Screen
          ,Choice
          ,Command
          ,Image
          ,Font
          ,Ticker
) {

  'use strict';
  
  const SELECT_COMMAND = new Command('', null, 1, 0);
  
  return java.define('javax.microedition.lcdui.List', {
    superclass: Screen,
    interfaces: [Choice],
    methods: {
      append: [{ret:'i32'}, 'string', Image, function(string, image) {
      }],
      delete: ['i32', function(index) {
      }],
      deleteAll: [function() {
      }],
      getFitPolicy: [{ret:'i32'}, function() {
      }],
      getFont: [{ret:Font}, 'i32', function(index) {
      }],
      getImage: [{ret:Image}, 'i32', function(index) {
      }],
      getSelectedFlags: ['boolean[]', function(out_flags) {
      }],
      getSelectedIndex: [{ret:'i32'}, function() {
      }],
      getString: [{ret:'string'}, 'i32', function(index) {
      }],
      insert: ['i32', 'string', Image, function(index, text, image) {
      }],
      isSelected: [{ret:'boolean'}, 'i32', function(index) {
      }],
      removeCommand: [Command, function(command) {
      }],
      set: ['i32', 'string', Image, function(index, text, image) {
      }],
      setFitPolicy: ['i32', function(policy) {
      }],
      setFont: ['i32', Font, function(index, font) {
      }],
      setSelectCommand: [Command, function(command) {
      }],
      setSelectedFlags: ['boolean[]', function(in_flags) {
      }],
      setSelectedIndex: ['i32', 'boolean', function(index, isSelected) {
      }],
      setTicker: [Ticker, function(ticker) {
      }],
      setTitle: ['string', function(title) {
      }],
      size: [{ret:'i32'}, function() {
      }],
    },
    constants: {
      SELECT_COMMAND: SELECT_COMMAND,
    },
  });

});
