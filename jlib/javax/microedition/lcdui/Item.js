define(['java', './Command', './ItemCommandListener'], function(java, Command, ItemCommandListener) {

  'use strict';
  
  const LAYOUT_DEFAULT = 0,
        LAYOUT_LEFT = 1,
        LAYOUT_RIGHT = 2,
        LAYOUT_CENTER = 3,
        LAYOUT_TOP = 0x10,
        LAYOUT_BOTTOM = 0x20,
        LAYOUT_VCENTER = 0x30,
        LAYOUT_NEWLINE_BEFORE = 0x100,
        LAYOUT_NEWLINE_AFTER = 0x200,
        LAYOUT_SHRINK = 0x400,
        LAYOUT_EXPAND = 0x800,
        LAYOUT_VSHRINK = 0x1000,
        LAYOUT_VEXPAND = 0x2000,
        LAYOUT_2 = 0x4000,
        PLAIN = 0,
        HYPERLINK = 1,
        BUTTON = 2;

  return java.define('javax.microedition.lcdui.Item', {
    constructor: false,
    methods: {
      addCommand: [Command, function(command) {
      }],
      getLabel: [{ret:'string'}, function() {
      }],
      getLayout: [{ret:'int'}, function() {
      }],
      getMinimumHeight: [{ret:'int'}, function() {
      }],
      getMinimumWidth: [{ret:'int'}, function() {
      }],
      getPreferredHeight: [{ret:'int'}, function() {
      }],
      getPreferredWidth: [{ret:'int'}, function() {
      }],
      notifyStateChanged: [function() {
      }],
      removeCommand: [Command, function(command) {
      }],
      setDefaultCommand: [Command, function(command) {
      }],
      setItemCommandListener: [ItemCommandListener, function(listener) {
      }],
      setLabel: ['string', function(label) {
      }],
      setLayout: ['i32', function(layout) {
      }],
      setPreferredSize: ['i32', 'i32', function(width, height) {
      }],
    },
    constants: {
      LAYOUT_DEFAULT: LAYOUT_DEFAULT,
      LAYOUT_LEFT: LAYOUT_LEFT,
      LAYOUT_RIGHT: LAYOUT_RIGHT,
      LAYOUT_CENTER: LAYOUT_CENTER,
      LAYOUT_TOP: LAYOUT_TOP,
      LAYOUT_BOTTOM: LAYOUT_BOTTOM,
      LAYOUT_VCENTER: LAYOUT_VCENTER,
      LAYOUT_NEWLINE_BEFORE: LAYOUT_NEWLINE_BEFORE,
      LAYOUT_NEWLINE_AFTER: LAYOUT_NEWLINE_AFTER,
      LAYOUT_SHRINK: LAYOUT_SHRINK,
      LAYOUT_EXPAND: LAYOUT_EXPAND,
      LAYOUT_VSHRINK: LAYOUT_VSHRINK,
      LAYOUT_VEXPAND: LAYOUT_VEXPAND,
      LAYOUT_2: LAYOUT_2,
      PLAIN: PLAIN,
      HYPERLINK: HYPERLINK,
      BUTTON: BUTTON,
    },
  });

});
