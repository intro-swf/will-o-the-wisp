define(['java'], function(java) {

  'use strict';
  
  return java.define('com.mascotcapsule.micro3d.v3.Texture', {
    constructor: [
      ['i8[]', function Texture(data) {
      }],
      [{blocking:true}, 'string', function Texture(resourceName) {
      }],
    ],
    methods {
      dispose: [function dispose() {
      }],
    },
  });

});
