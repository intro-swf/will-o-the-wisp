define(['java'], function(java) {

  const Class = java.Class;
  const Interface = java.Interface;
  const _REFLECTS = java._REFLECTS;
  const _CTOR = java._CTOR;

  Object.assign(Class.prototype, {
    isInterface: function() {
      return this[_REFLECTS] instanceof Interface;
    },
    isArray: function() {
      return !!this[_REFLECTS].componentType;
    },
    isPrimitive: function() {
      return !!this[_REFLECTS].isPrimitive;
    },
    getName: function() {
      return this[_REFLECTS].name;
    },
    toString: function() {
      var reflect = this[_REFLECTS];
      if (reflect.isPrimitive) return reflect.name;
      if (reflect instanceof Interface) return 'interface ' + reflect.name;
      return 'class ' + reflect.name;
    },
    isInstance: function(v) {
      var reflect = this[_REFLECTS];
      if (reflect instanceof Interface) {
        return v[_CTOR].interfaceSet.has(reflect);
      }
      return v instanceof this[_REFLECTS];
    },
    isAssignableFrom: function(cls) {
      var other = cls[_REFLECTS];
      if (other instanceof Interface) {
        return this[_REFLECTS].interfaceSet.has(other);
      }
      return this[_REFLECTS].prototype instanceof other;
    },
    getSuperclass: function() {
      var superclass = this[_REFLECTS].superclass;
      if (!superclass) return null;
      return superclass.classObject;
    },
    getInterfaces: function() {
      return new Class.Array((this[_REFLECTS].interfaces || []).slice());
    },
    getSigners: function() {
      return new java.Object.Array((this[_REFLECTS].signers || []).slice());
    },
    getComponentType: function() {
      var componentType = this[_REFLECTS].componentType;
      if (!componentType) return null;
      return componentType.classObject;
    },
    getDeclaringClass: function() {
      return null;
    },
    getClasses: function() {
      return new Class.Array([]);
    },
    newInstance: function() {
      //throws InstantiationException, IllegalAccessException
      const TClass = this[_REFLECTS];
      return new TClass();
    },
    getClassLoader: function() {
      throw new Error('NYI');
    },
    getModifiers: function() {
      throw new Error('NYI');
    },
    getFields: function() {
      throw new Error('NYI');
    },
    getMethods: function() {
      throw new Error('NYI');
    },
    getConstructors: function() {
      throw new Error('NYI');
    },
    getField: function(name) {
      throw new Error('NYI');
    },
    getMethod: function(name, parameterTypes) {
      throw new Error('NYI');
    },
    getConstructor: function(parameterTypes) {
      throw new Error('NYI');
    },
    getDeclaredClasses: function() {
      throw new Error('NYI');
    },
    getDeclaredFields: function() {
      throw new Error('NYI');
    },
    getDeclaredMethods: function() {
      throw new Error('NYI');
    },
    getDeclaredConstructors: function() {
      throw new Error('NYI');
    },
    getDeclaredField: function(name) {
      throw new Error('NYI');
    },
    getDeclaredMethod: function(name, parameterTypes) {
      throw new Error('NYI');
    },
    getDeclaredConstructor: function(parameterTypes) {
      throw new Error('NYI');
    },
    getResourceAsStream: function(name) {
      throw new Error('NYI');
    },
    getResource: function(name) {
      // returns URL
      throw new Error('NYI');
    },
  });
  
  Class.staticMembers = {
    forName: function(className) {
      throw new Error('NYI');
    },
    getPrimitiveClass: function(className) {
      throw new Error('NYI');
    },
  };
  
  return Class;

});
