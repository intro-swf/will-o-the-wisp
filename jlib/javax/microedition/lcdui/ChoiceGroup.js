define(['java'
        ,'./Item'
        ,'./Choice'
        ,'jlib.java.lang.String'
        ,'jlib.java.lang.Integer'
        ],
function(java
        ,Item
        ,Choice
        ,JString
        ,JInteger
) {

  'use strict';
  
  return java.defineClass(
  
    function ChoiceGroup(label, choiceType, stringElements, imageElements) {
    },
    
    {
      name: 'javax.microedition.lcdui.ChoiceGroup',
      superclass: Item,
      interfaces: [Choice],
      constructor: new java.Overload([
        new java.Signature([JString, JInteger]),
        new java.Signature([JString, JInteger, JString.Array, JString.Array]),
      ]),
      instanceMethods: {
        append: function(stringPart, imagePart) {
        },
        delete: function(index) {
        },
        deleteAll: function() {
        },
        getFitPolicy: function() {
        },
        getFont: function(index) {
        },
        getImage: function(index) {
        },
        getSelectedFlags: function(out_booleanArray) {
        },
        getSelectedIndex: function() {
        },
        getString: function(index) {
        },
        insert: function(index, string, image) {
        },
        isSelected: function(index) {
        },
        set: function(index, string, image) {
        },
        setFitPolicy: function(fitPolicy) {
        },
        setFont: function(font) {
        },
        setSelectedFlags: function(booleanArray) {
        },
        setSelectedIndex: function(index, boolean) {
        },
        size: function() {
        },
      },
    });

});
