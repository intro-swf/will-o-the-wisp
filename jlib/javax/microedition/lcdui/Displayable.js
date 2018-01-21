define(['java'], function(java) {

  'use strict';

  return java.define('javax.microedition.lcdui.Displayable', {
    
    constructor: [
      {access:'package'},
      function Displayable() {
      },
    ],
    
    methods: {
      addCommand: ['./Command', function addCommand(cmd) {
      }],
      removeCommand: ['./Command', function removeCommand(cmd) {
      }],
      setCommandListener: ['./CommandListener', function setCommandListener(listener) {
      }],
      setTicker: ['./Ticker', function setTicker(ticker) {
      }],
      getTicker: [{ret:'./Ticker'}, function getTicker() {
      }],
      setTitle: ['string', function setTitle(title) {
      }],
      getTitle: [{ret:'string'}, function getHeight() {
      }],
      getWidth: [{ret:'i32'}, function getWidth() {
      }],
      getHeight: [{ret:'i32'}, function getHeight() {
      }],
      sizeChanged: ['i32', 'i32', function(width, height) {
      }],
      isShown: [{ret:'boolean'}, function() {
      }],
    },
    
  });

});
