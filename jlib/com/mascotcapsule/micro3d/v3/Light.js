define(['java'], function(java) {

  'use strict';
  
  return java.define('com.mascotcapsule.micro3d.v3.Light', {
    constructor: [function Light() {
    }],
    methods: {
      setAmbientIntensity: [
        'i32',
        function setAmbientIntensity(intensity) {
        },
      ],
      setParallelLightDirection: [
        './Vector3D',
        function setParallelLightDirection(dirVector) {
        },
      ],
      setParallelLightIntensity: [
        'i32',
        function setParallelLightIntensity(intensity) {
        },
      ],
    },
  });

});
