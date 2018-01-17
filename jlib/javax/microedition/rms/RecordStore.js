define(['java'], function(java) {

  'use strict';
  
  const AUTHMODE_PRIVATE = 0,
        AUTHMODE_ANY = 1;
  
  return java.define('javax.microedition.rms.RecordStore', {
    constants: {
      AUTHMODE_PRIVATE: AUTHMODE_PRIVATE,
      AUTHMODE_ANY: AUTHMODE_ANY,
    },
    staticMethods: {
      deleteRecordStore: ['string', function(storeName) {
      }],
      listRecordStores: ['string[]', function() {
      }],
      openRecordStore: [
        [
          {ret:'./RecordStore'}, 'string', 'boolean',
          function(storeName, orCreate) {
          },
        ],
        [
          {ret:'./RecordStore'}, 'string', 'boolean', 'i32', 'boolean',
          function(storeName, orCreate, authMode, writable) {
          },
        ],
        [
          {ret:'./RecordStore'}, 'string', 'string', 'string',
          function(storeName, vendorName, suiteName) {
          },
        ],
      ],
    },
    methods: {
      addRecord: [{ret:'i32'}, 'i8[]', 'i32', 'i32', function(bytes, offset, length) {
      }],
      addRecordListener: ['./RecordListener', function(listener) {
      }],
      closeRecordStore: [function() {
      }],
      deleteRecord: ['i32', function(id) {
      }],
      enumerateRecords: [
        {ret:'./RecordEnumeration'}, './RecordFilter', './RecordComparator', 'boolean',
        function(filter, comparator, keepUpdated) {
        },
      ],
      getLastModified: [{ret:'i64'}, function() {
      }],
      getName: [{ret:'string'}, function() {
      }],
      getNextRecordID: [{ret:'i32'}, function() {
      }],
      getNumRecords: [{ret:'i32'}, function() {
      }],
      getRecord: [
        [{ret:'i8[]'}, 'i32', function(id) {
        }],
        [{ret:'i32'}, 'i32', 'i8[]', 'i32', function(id, bytes, offset) {
        }],
      ],
      getRecordSize: [{ret:'i32'}, 'i32', function(id) {
      }],
      getSize: [{ret:'i32'}, function() {
      }],
      getSizeAvailable: [{ret:'i32'}, function() {
      }],
      getVersion: [{ret:'i32'}, function() {
      }],
      removeRecordListener: ['./RecordListener', function(listener) {
      }],
      setMode: ['i32', 'boolean', function(authMode, writable) {
      }],
      setRecord: ['i32', 'i8[]', 'i32', 'i32', function(id, data, offset, length) {
      }],
    },
  });

});
