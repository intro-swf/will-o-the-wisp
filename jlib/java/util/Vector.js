define(['java'], function(java) {
  
  'use strict';
  
  const _CAPACITY_INCREMENT = Symbol('capacityIncrement');
  const _ELEMENT_COUNT = Symbol('elementCount');
  const _ELEMENT_DATA = Symbol('elementData');
  
  return java.define('java.util.Vector', {
    constructor: [
      [],
      ['i32'],
      ['i32','i32'],
      function Vector(initialCapacity, capacityIncrement) {
      },
    ],
    methods: {
      addElement: ['object', function(element) {
      }],
      capacity: [{ret:'i32'}, function() {
      }],
      contains: [{ret:'boolean'}, 'object', function(element) {
      }],
      copyInto: ['object[]', function(array) {
      }],
      elementAt: [{ret:'object'}, 'i32', function(index) {
      }],
      elements: [{ret:'./Enumeration'}, function() {
      }],
      ensureCapacity: ['i32', function(minCapacity) {
      }],
      firstElement: [{ret:'object'}, function() {
      }],
      indexOf: [
        [{ret:'i32'}, 'object'],
        [{ret:'i32'}, 'object', 'i32'],
        function(element, startIndex) {
          startIndex = startIndex || 0;
        },
      ],
      insertElementAt: ['object', 'i32', function(element, index) {
      }],
      isEmpty: [{ret:'boolean'}, function() {
      }],
      lastElement: [{ret:'object'}, function() {
      }],
      lastIndexOf: [
        [{ret:'i32'}, 'object'],
        [{ret:'i32'}, 'object', 'i32'],
        function(element, startIndex) {
        },
      ],
      removeAllElements: [function() {
      }],
      removeElement: [{ret:'boolean'}, function(element) {
      }],
      removeElementAt: ['i32', function(index) {
      }],
      setElementAt: ['object', 'index', function(element, index) {
      }],
      setSize: ['i32', function(newSize) {
      }],
      size: [{ret:'i32'}, function() {
      }],
      toString: [{ret:'string'}, function() {
      }],
      trimToSize: [function() {
      }],
    },
    fields: {
      capacityIncrement: [{access:'protected'}, 'i32', _CAPACITY_INCREMENT],
      elementCount: [{access:'protected'}, 'i32', _ELEMENT_COUNT],
      elementData: [{access:'protected'}, 'object[]', _ELEMENT_DATA],
    },
  });
  
});
