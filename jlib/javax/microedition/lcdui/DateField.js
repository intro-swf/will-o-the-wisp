define(['java'
        ,'./Item'
        ,'jlib.java.lang.String'
        ,'jlib.java.lang.Integer'
        ,'jlib.java.util.Date'
        ,'jlib.java.util.TimeZone'
],
function(java
          ,Item
          ,JString
          ,JInteger
          ,Date
          ,TimeZone) {
  
  'use strict';

  return java.defineClass(
  
    function DateField(label, mode, timeZone) {
    },
    
    {
      name: 'javax.microedition.lcdui.DateField',
      constructors: new java.Overload([
        new java.Signature([JString, JInteger]),
        new java.Signature([JString, JInteger, TimeZone]),
      ]),
      instanceMembers: {
        getDate: function() {
          throw new Error('NYI');
        },
        getInputMode: function() {
          throw new Error('NYI');
        },
        setDate: function(date) {
          throw new Error('NYI');
        },
        setInputMode: function(mode) {
          throw new Error('NYI');
        },
      },
      staticMembers: {
        DATE: 1,
        TIME: 2,
        DATE_TIME: 3,
      },
    });

});
