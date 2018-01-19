define(['java'], function(java) {

  'use strict';
  
  return java.define('com.mascotcapsule.micro3d.v3.Effect3D', {
    constructor: [
      [
        function Effect3D() {
        },
      ],
      [
        './Light', './Texture',
        function Effect3D(light, texture) {
        },
      ],
    ],
    methods: {
      setLight: ['./Light', function setLight(light) {
      }],
      setTransparency: ['boolean', function setTransparency(enable) {
      }],
    },
  });

});
