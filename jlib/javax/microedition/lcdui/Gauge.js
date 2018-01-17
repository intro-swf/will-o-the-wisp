define(['java', './Item', './Command', './ItemCommandListener'], function(java, Item, Command, ItemCommandListener) {

  'use strict';
  
  const INDEFINITE = -1,
        CONTINUOUS_IDLE = 0,
        INCREMENTAL_IDLE = 1,
        CONTINUOUS_RUNNING = 2,
        INCREMENTAL_UPDATING = 3;
  
  return java.define('javax.microedition.lcdui.Gauge', {
    superclass: Item,
    constructor: ['string', 'boolean', 'i32', 'i32', function(label, interactive, maxValue, initialValue) {
    }],
    methods: {
      addCommand: [Command, function(command) {
      }],
      getMaxValue: [{ret:'i32'}, function() {
      }],
      getValue: [{ret:'i32'}, function() {
      }],
      isInteractive: [{ret:'boolean'}, function() {
      }],
      setDefaultCommand: [Command, function(command) {
      }],
      setItemCommandListener: [ItemCommandListener, function(listener) {
      }],
      setLabel: ['string', function(label) {
      }],
      setLayout: ['i32', function(layout) {
      }],
      setMaxValue: ['i32', function(maxValue) {
      }],
      setPreferredSize: ['i32','i32', function(width,height) {
      }],
      setValue: ['i32', function(value) {
      }],
    },
    constants: {
      INDEFINITE: INDEFINITE,
      CONTINUOUS_IDLE: CONTINUOUS_IDLE,
      INCREMENTAL_IDLE: INCREMENTAL_IDLE,
      CONTINUOUS_RUNNING: CONTINUOUS_RUNNING,
      INCREMENTAL_UPDATING: INCREMENTAL_UPDATING,
    },
  });

});
