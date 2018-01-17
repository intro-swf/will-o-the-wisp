define(['java'
        ,'./Screen'
        ,'./Item'
        ,'./Image'
        ,'./ItemStateListener'
],
function(java
          ,Screen
          ,Item
          ,Image,
          ,ItemStateListener
) {

  'use strict';
  
  return java.define('javax.microedition.lcdui.Form', {
    superclass: Screen,
    constructor: [
      [java.String],
      [java.String, Item.Array],
      function Form(title, items) {
      },
    ],
    methods: {
      append: [
        [{ret:'i32'}, Image, function(img) {
          throw new Error('NYI');
        }],
        [{ret:'i32'}, Item, function(item) {
          throw new Error('NYI');
        }],
        [{ret:'i32'}, java.String, function(str) {
          throw new Error('NYI');
        }],
      ],
      delete: ['i32', function(index) {
        throw new Error('NYI');
      }],
      deleteAll: function() {
        throw new Error('NYI');
      },
      get: [{ret:Item}, 'i32', function(index) {
        throw new Error('NYI');
      }],
      getHeight: [{ret:'i32'}, function() {
        throw new Error('NYI');
      }],
      getWidth: [{ret:'i32'}, function() {
        throw new Error('NYI');
      }],
      insert: ['i32', Item, function(index, item) {
        throw new Error('NYI');
      }],
      set: ['i32', Item, function(index, item) {
        throw new Error('NYI');
      }],
      setItemStateListener: [ItemStateListener, function(listener) {
        throw new Error('NYI');
      }],
      size: [{ret:'i32'}, function() {
        throw new Error('NYI');
      }],
    },
  });

});
