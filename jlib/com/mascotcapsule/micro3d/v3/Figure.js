define(['java'], function(java) {

  'use strict';

  return java.define('com.mascotcapsult.micro3d.v3.Figure', {
    constructor: [
      ['i8[]', function Figure(data) {
      }],
      [{blocking:true}, 'string', function Figure(resourceName) {
      }],
    ],
    methods: {
      setPosture: [
        './ActionTable', 'i32', 'i32',
        function setPosture(actionTable, action, frame) {
        },
      ],
      setTexture: [
        ['./Texture', function setTexture(texture) {
        }],
        ['./Texture[]', function setTexture(textures) {
        }],
      ],
      dispose: [function() {
      }],
    },
  });

});
