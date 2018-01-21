define(['java'], function(java) {

  'use strict';
  
  const AUTHMODE_PRIVATE = 0,
        AUTHMODE_ANY = 1;
  
  return java.define('javax.microedition.rms.RecordStore', {
    final: true, // no accessible constructors
    constants: {
      AUTHMODE_PRIVATE : AUTHMODE_PRIVATE,
          AUTHMODE_ANY : AUTHMODE_ANY,
    },
    staticMethods: {
      deleteRecordStore: [
        {blocking:true}, 'string',
        function deleteRecordStore(storeName) {
        },
      ],
      listRecordStores: [
        {blocking:true}, {ret:'string[]'},
        function listRecordStores() {
        },
      ],
      openRecordStore: [
        [
          {blocking:true}, {ret:'./RecordStore'}, 'string', 'boolean',
          function openRecordStore(storeName, orCreate) {
          },
        ],
        [
          {blocking:true}, {ret:'./RecordStore'}, 'string', 'boolean', 'i32', 'boolean',
          function openRecordStore(storeName, orCreate, authMode, writable) {
          },
        ],
        [
          {blocking:true}, {ret:'./RecordStore'}, 'string', 'string', 'string',
          function openRecordStore(storeName, vendorName, suiteName) {
          },
        ],
      ],
    },
    methods: {
      addRecord: [
        {blocking:true}, {ret:'i32'}, 'i8[]', 'i32', 'i32',
        function addRecord(bytes, offset, length) {
        },
      ],
      addRecordListener: [
        './RecordListener',
        function addRecordListener(listener) {
        },
      ],
      removeRecordListener: [
        './RecordListener',
        function removeRecordListener(listener) {
        },
      ],
      closeRecordStore: [
        function closeRecordStore() {
        },
      ],
      deleteRecord: [
        {blocking:true}, 'i32',
        function deleteRecord(id) {
        },
      ],
      enumerateRecords: [
        {blocking:true}, {ret:'./RecordEnumeration'}, './RecordFilter', './RecordComparator', 'boolean',
        function enumerateRecords(filter, comparator, keepUpdated) {
        },
      ],
      getLastModified: [
        {blocking:true}, {ret:'i64'},
        function getLastModified() {
        },
      ],
      getName: [
        {blocking:true}, {ret:'string'},
        function getName() {
        },
      ],
      getNextRecordID: [
        {blocking:true}, {ret:'i32'},
        function getNextRecordID() {
        },
      ],
      getNumRecords: [
        {blocking:true}, {ret:'i32'},
        function getNumRecords() {
        },
      ],
      getRecord: [
        [
          {blocking:true}, {ret:'i8[]'}, 'i32',
          function getRecord(id) {
          },
        ],
        [
          {ret:'i32'}, 'i32', 'i8[]', 'i32',
          function getRecord(id, bytes, offset) {
          },
        ],
      ],
      getRecordSize: [
        {blocking:true}, {ret:'i32'}, 'i32',
        function getRecordSize(id) {
        },
      ],
      getSize: [
        {blocking:true}, {ret:'i32'},
        function getSize() {
        },
      ],
      getSizeAvailable: [
        {blocking:true}, {ret:'i32'},
        function getSizeAvailable() {
        },
      ],
      getVersion: [
        {blocking:true}, {ret:'i32'},
        function getVersion() {
        },
      ],
      setMode: [
        'i32', 'boolean',
        function setMode(authMode, writable) {
        },
      ],
      setRecord: [
        {blocking:true}, 'i32', 'i8[]', 'i32', 'i32',
        function setRecord(id, data, offset, length) {
        },
      ],
    },
  });

});
