define(['java'], function(java) {

  const Class = java.Class;
  const Interface = java.Interface;
  const _REFLECTS = java._REFLECTS;
  const _CTOR = java._CTOR;

  return java.define('java.lang.Class', {
    final: true,
    constructor: [{access:'private'}, Class],
    staticMethods: {
      forName: [{blocking:true, ret:Class}, 'string', function(className) {
        return java.currentThread.vm.loadClass(className);
      }],
    },
    methods: {
      getName: [{ret:'string'}, function() {
        return this[_REFLECTS].className;
      }],
      getResourceAsStream: [{ret:'../io/InputStream'}, 'string', function(name) {
        return java.currentThread.vm.getResourceAsStream(name);
      }],
      isArray: [{ret:'boolean'}, function() {
        return !!this[_REFLECTS].componentType;
      }],
      isAssignableFrom: [{ret:'boolean'}, Class, function(cls) {
        var other = cls[_REFLECTS];
        if (other instanceof Interface) {
          return this[_REFLECTS].interfaceSet.has(other);
        }
        return this[_REFLECTS].prototype instanceof other;
      }],
      isInstance: [{ret:'boolean'}, 'object', function(v) {
        var reflect = this[_REFLECTS];strin
        if (reflect instanceof Interface) {
          return v[_CTOR].interfaceSet.has(reflect);
        }
        return v instanceof this[_REFLECTS];
      }],
      isInterface: [{ret:'boolean'}, function() {
        return this[_REFLECTS] instanceof Interface;
      }],
      newInstance: [{ret:'object'}, function() {
        var TClass = this[_REFLECTS];
        return new TClass();
      }],
      toString: [{ret:'string'}, function() {
        var reflect = this[_REFLECTS];
        if (reflect.isPrimitive) return reflect.className;
        if (reflect instanceof Interface) return 'interface ' + reflect.className;
        return 'class ' + reflect.className;
      }],
    },
  });
  
});
