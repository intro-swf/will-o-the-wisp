define(['java'], function(java) {

  'use strict';
  
  return java.define('javax.microedition.m3g.Loader', {
    staticMethods: {
      load: [
        [
          {ret:'./Object3D'}, 'i8[]', 'i32',
          function load(bytes, offset) {
          },
        ],
        [
          {ret:'./Object3D'}, 'string',
          function load(resourceName) {
          },
        ],
      ],
    },
  });

});
