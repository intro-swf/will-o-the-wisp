define(['java', './Object3D'], function(java, Object3D) {

  'use strict';
  
  const ALPHA = 256,
        AMBIENT_COLOR = 257,
        COLOR = 258,
        CROP = 259,
        DENSITY = 260,
        DIFFUSE_COLOR = 261,
        EMISSIVE_COLOR = 262,
        FAR_DISTANCE = 263,
        FIELD_OF_VIEW = 264,
        INTENSITY = 265,
        MORPH_WEIGHTS = 266,
        NEAR_DISTANCE = 267,
        ORIENTATION = 268,
        PICKABILITY = 269,
        SCALE = 270,
        SHININESS = 271,
        SPECULAR_COLOR = 272,
        SPOT_ANGLE = 273,
        SPOT_EXPONENT = 274,
        TRANSLATION = 275,
        VISIBILITY = 276;
  
  return java.define('javax.microedition.m3g.AnimationTrack', {
    base: Object3D,
    constructor: [
      './KeyframeSequence', 'i32',
      function AnimationTrack(sequence, property) {
      },
    ],
    methods: {
      getController: [{ret:'./AnimationController'}, function getController() {
      }],
      getKeyframeSequence: [{ret:'./KeyframeSequence'}, function getKeyframeSequence() {
      }],
      getTargetProperty: [{ret:'i32'}, function getTargetProperty() {
      }],
      setController: ['./AnimationController', function setController(controller) {
      }],
    },
    constants: {
      ALPHA: ALPHA,
      AMBIENT_COLOR: AMBIENT_COLOR,
      COLOR: COLOR,
      CROP: CROP,
      DENSITY: DENSITY,
      DIFFUSE_COLOR: DIFFUSE_COLOR,
      EMISSIVE_COLOR: EMISSIVE_COLOR,
      FAR_DISTANCE: FAR_DISTANCE,
      FIELD_OF_VIEW: FIELD_OF_VIEW,
      INTENSITY: INTENSITY,
      MORPH_WEIGHTS: MORPH_WEIGHTS,
      NEAR_DISTANCE: NEAR_DISTANCE,
      ORIENTATION: ORIENTATION,
      PICKABILITY: PICKABILITY,
      SCALE: SCALE,
      SHININESS: SHININESS,
      SPECULAR_COLOR: SPECULAR_COLOR,
      SPOT_ANGLE: SPOT_ANGLE,
      SPOT_EXPONENT: SPOT_EXPONENT,
      TRANSLATION: TRANSLATION,
      VISIBILITY: VISIBILITY,
    },
  });

});
