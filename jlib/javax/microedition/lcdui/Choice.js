define(['java'], function(java) {

  'use strict';
  
  return java.defineInterface({
    name: 'javax.microedition.lcdui.Choice',
    instanceMembers: {
      append: function(text, image) {
        throw new Error('NYI');
      },
      delete: function(index) {
        throw new Error('NYI');
      },
      deleteAll: function() {
        throw new Error('NYI');
      },
      getFitPolicy: function() {
        throw new Error('NYI');
      },
      getFont: function(index) {
        throw new Error('NYI');
      },
      getImage: function(index) {
        throw new Error('NYI');
      },
      getSelectedFlags: function(out_booleanArray) {
        throw new Error('NYI');
      },
      getSelectedIndex: function() {
        throw new Error('NYI');
      },
      getString: function(index) {
        throw new Error('NYI');
      },
      insert: function(index, text, image) {
        throw new Error('NYI');
      },
      isSelected: function(index) {
        throw new Error('NYI');
      },
      set: function(index, text, image) {
        throw new Error('NYI');
      },
      setFitPolicy: function(fitPolicy) {
        throw new Error('NYI');
      },
      setFont: function(index, font) {
        throw new Error('NYI');
      },
      setSelectedFlags: function(booleanArray) {
        throw new Error('NYI');
      },
      setSelectedIndex: function(index, selected) {
        throw new Error('NYI');
      },
      size: function() {
        throw new Error('NYI');
      },
    },
    staticMembers: {
      EXCLUSIVE: 1,
      MULTIPLE: 2,
      IMPLICIT: 3,
      POPUP: 4,
      TEXT_WRAP_DEFAULT: 0,
      TEXT_WRAP_ON: 1,
      TEXT_WRAP_OFF: 2,
    },
  });

});
