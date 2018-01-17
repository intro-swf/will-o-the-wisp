define(['java', 'Item'], function(java, Item) {

  'use strict';
  
  const ANY = 0,
        EMAILADDR = 1,
        NUMERIC = 2,
        PHONENUMBER = 3,
        URL = 4,
        DECIMAL = 5,
        PASSWORD = 0x10000,
        UNEDITABLE = 0x20000,
        SENSITIVE = 0x40000,
        NON_PREDICTIVE = 0x80000,
        INITIAL_CAPS_WORD = 0x100000,
        INITIAL_CAPS_SENTENCE = 0x100000,
        CONSTRAINT_MASK = 0xFFFF;
  
  return java.define('javax.microedition.lcdui.TextField', {
    superclass: Item,
    constructor: [
      'string', 'string', 'i32', 'i32',
      function TextField(label, text, maxSize, constraints) {
      },
    ],
    methods: {
      delete: ['i32', 'i32', function(offset, length) {
      }],
      getCaretPosition: [{ret:'i32'}, function() {
      }],
      getChars: [{ret:'i32'}, 'char[]', function(out_chars) {
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
        ['string', 'i32', function(string, position) {
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
      setString: ['string', function(text) {
      }],
      size: [{ret:'i32'}, function() {
      }],
    },
    constants: {
      ANY: ANY,
      EMAILADDR: EMAILADDR,
      NUMERIC: NUMERIC,
      PHONENUMBER: PHONENUMBER,
      URL: URL,
      DECIMAL: DECIMAL,
      PASSWORD: PASSWORD,
      UNEDITABLE: UNEDITABLE,
      SENSITIVE: SENSITIVE,
      NON_PREDICTIVE: NON_PREDICTIVE,
      INITIAL_CAPS_WORD: INITIAL_CAPS_WORD,
      INITIAL_CAPS_SENTENCE: INITIAL_CAPS_SENTENCE,
      CONSTRAINT_MASK: CONSTRAINT_MASK,
    },
  });

});
