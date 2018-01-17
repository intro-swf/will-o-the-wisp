define(['java'], function(java) {

  'use strict';

  const _MESSAGE = new Symbol('message');
  const _CTOR = java._CTOR;

  function Throwable(message) {
    this[_MESSAGE] = message || null;
  }
  
  java.initClass(Throwable, {
    interfaces: [java.Serializable],
    instanceMembers: {
      getMessage: function() {
        return this[_MESSAGE];
      },
      getLocalizedMessage: function() {
        return this[_MESSAGE];
      },
      toString: function() {
        var msg = this[_MESSAGE], className = this[_CTOR].name;
        return msg ? className+': '+msg : className;
      },
      printStackTrace: function() {
        // ()
        // (java.io.PrintStream s)
        // (java.io.PrintWriter s)
        throw new Error('NYI');
      },
      fillInStackTrace: function() {
        throw new Error('NYI');
      },
    },
  });
  
  return Throwable;

});
