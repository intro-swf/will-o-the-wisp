define(['java', './Item', './Command'], function(java, Item, Command) {

  'use strict';
  
  return java.define('javax.microedition.lcdui.Spacer', {
    superclass: Item,
    constructor: ['i32', 'i32', function(minWidth, minHeight) {
    }],
    methods: {
      addCommand: [Command, function(command) {
      }],
      setDefaultCommand: [Command, function(command) {
      }],
      setLabel: ['string', function() {
      }],
      setMinimumSize: ['i32', 'i32', function(minWidth, minHeight) {
      }],
    },
  });

});
