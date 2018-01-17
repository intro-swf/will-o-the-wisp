define(['java'], function(java) {

  'use strict';

  const JObject = java.Object;
  
  const _CTOR = java._CTOR;
  const _HASHCODE = new Symbol('hashCode');
  
  Object.assign(JObject.prototype, {
    equals: function(o) {
      return this === o;
    },
    finalize: function(){},
    hashCode: function() {
      if (_HASHCODE in this) {
        return this[_HASHCODE];
      }
      return this[_HASHCODE] = (Math.random() * 0xffffffff) | 0;
    },
    toString: function() {
      return this[_CTOR].name + "@" + (this.hashCode() >>> 0).toString(16);
    },
    getClass: function() {
      return this[_CTOR].classObject;
    },
    clone: function() {
      throw new Exception('NYI');
    },
    notify: function() {
      throw new Exception('NYI');
    },
    notifyAll: function() {
      throw new Exception('NYI');
    },
    wait: function() {
      throw new Exception('NYI');
    },
  });

  return JObject;

});
