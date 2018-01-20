define(['java', '../io/PrintStream'], function(java, PrintStream) {

  'use strict';
  
  const out = new PrintStream();
  const err = new PrintStream();
  
  const _HASHCODE = java._HASHCODE;
  
  return java.define('java.lang.System', {
    staticMethods: {
      arraycopy: [
        'object', 'i32', 'object', 'i32', 'i32',
        function arraycopy(src, src_i, dst, dst_i, len) {
        },
      ],
      currentTimeMillis: [{ret:'i64'}, function currentTimeMillis() {
        return new Date().getTime();
      }],
      exit: [{blocking:true}, 'i32', function exit(statusCode) {
      }],
      gc: [function() {
      }],
      getProperty: [{ret:'string'}, 'string', function getProperty(propertyName) {
        return java.currentThread.vm.getProperty(propertyName);
      }],
      identityHashCode: [{ret:'i32'}, 'object', function identityHashCode(o) {
      }],
    },
    constants: {
      out: out,
      err: err,
    },
  });

});
