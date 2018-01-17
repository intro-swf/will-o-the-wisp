define(['java', './Screen', './Ticker'], function(java, Screen, Ticker) {

  'use strict';
  
  return java.define('javax.microedition.lcdui.TextBox', {
    superclass: Screen,
    constructor: ['string', 'string', 'i32', 'i32', function(title, text, maxSize, constraints) {
    }],
    methods: {
      delete: ['i32', 'i32', function(offset, length) {
      }],
      getCaretPosition: [{ret:'i32'}, function() {
      }],
      getChars: ['char[]', function(out_chars) {
      }],
      getConstraints: [{ret:'i32'}, function() {
      }],
      getMaxSize: [{ret:'i32'}, function() {
      }],
      getString: [{ret:'string'}, function() {
      }],
      insert: [
        ['char[]', 'i32', 'i32', 'i32', function(chars, offset, length, position) {
        }],
        ['string', 'i32', function(string, offset) {
        }],
      ],
      setChars: ['char[]', 'i32', 'i32', function(chars, offset, length) {
      }],
      setConstraints: ['i32', function(constraints) {
      }],
      setInitialInputMode: ['string', function(subsetName) {
      }],
      setMaxSize: [{ret:'i32'}, 'i32', function(maxSize) {
      }],
      setString: ['string', function(string) {
      }],
      setTicker: [Ticker, function(ticker) {
      }],
      setTitle: ['string', function(title) {
      }],
      size: [{ret:'i32'}, function() {
      }],
    },
  });

});
