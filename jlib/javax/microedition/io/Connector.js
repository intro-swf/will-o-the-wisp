define(['java'], function(java) {

  'use strict';
  
  const READ = 1,
        WRITE = 2,
        READ_WRITE = 3;
  
  return java.define('javax.microedition.io.Connector', {
    staticMethods: {
      open: [
        [{ret:'./Connection'}, 'string'],
        [{ret:'./Connection'}, 'string', 'i32'],
        [{ret:'./Connection'}, 'string', 'i32', 'boolean'],
        function open(name, mode, timeouts) {
        },
      ],
      openInputStream: [
        {ret:'java.io.InputStream'}, 'string',
        function openInputStream(name) {
        },
      ],
      openOutputStream: [
        {ret:'java.io.OutputStream'}, 'string',
        function openOutputStream(name) {
        },
      ],
      openDataInputStream: [
        {ret:'java.io.DataInputStream'}, 'string',
        function openDataInputStream(name) {
        },
      ],
      openDataOutputStream: [
        {ret:'java.io.DataOutputStream'}, 'string',
        function openDataOutputStream(name) {
        },
      ],
    },
    constants: {
      READ: READ,
      WRITE: WRITE,
      READ_WRITE: READ_WRITE,
    },
  });

});
